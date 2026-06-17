import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireMembership } from "@/lib/api";
import { createAuditLog } from "@/lib/audit";
import { notifyExecs } from "@/lib/notifications";
import { treasuryApprovalsNeeded } from "@/lib/permissions";
import { z } from "zod";

const schema = z.object({
  contactEmail: z.string().email(),
  expenseDate: z.string(),
  locationSupplier: z.string().min(1),
  description: z.string().min(1),
  amount: z.number().positive(),
  useExistingBank: z.boolean(),
  bankAccountName: z.string().nullable().optional(),
  bankBsb: z.string().nullable().optional(),
  bankAccountNumber: z.string().nullable().optional(),
  saveToProfile: z.boolean().optional(),
  acknowledgedRules: z.boolean(),
  receiptUrls: z.array(z.string()).optional(),
  status: z.enum(["DRAFT", "SUBMITTED"]).default("SUBMITTED"),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ society: string }> }) {
  const { session, error: authErr } = await requireAuth();
  if (authErr) return authErr;

  const { society } = await params;
  const { membership, error: memErr } = await requireMembership(session!.user.id, society);
  if (memErr) return memErr;

  try {
    const body = schema.parse(await req.json());

    if (!body.acknowledgedRules) {
      return NextResponse.json({ error: "Must acknowledge reimbursement rules" }, { status: 400 });
    }

    let bankAccountId: string | null = null;

    if (!body.useExistingBank && body.bankAccountName && body.bankBsb && body.bankAccountNumber) {
      // Check if user already has a bank account on file
      const existingCount = await prisma.bankAccount.count({ where: { userId: session!.user.id } });
      const account = await prisma.bankAccount.create({
        data: {
          userId: session!.user.id,
          accountName: body.bankAccountName,
          bsb: body.bankBsb,
          accountNumber: body.bankAccountNumber,
          isDefault: existingCount === 0, // first account becomes default
        },
      });
      bankAccountId = account.id;
    } else if (body.useExistingBank) {
      const existing = await prisma.bankAccount.findFirst({
        where: { userId: session!.user.id },
        orderBy: { createdAt: "desc" },
      });
      bankAccountId = existing?.id ?? null;
    }

    const request = await prisma.treasuryRequest.create({
      data: {
        societyId: membership!.societyId,
        submittedById: session!.user.id,
        contactEmail: body.contactEmail,
        expenseDate: new Date(body.expenseDate),
        locationSupplier: body.locationSupplier,
        description: body.description,
        amount: body.amount,
        bankAccountId,
        acknowledgedRules: body.acknowledgedRules,
        status: body.status === "SUBMITTED" ? "AWAITING_APPROVAL" : "DRAFT",
      },
    });

    if (body.receiptUrls?.length) {
      await prisma.treasuryAttachment.createMany({
        data: body.receiptUrls.map((url: string) => ({
          treasuryRequestId: request.id,
          fileName: url.split("/").pop() ?? "receipt",
          fileUrl: url,
          fileSize: 0,
          mimeType: "application/octet-stream",
        })),
      });
    }

    await prisma.thread.create({ data: { treasuryRequestId: request.id } });

    await createAuditLog({
      societyId: membership!.societyId,
      userId: session!.user.id,
      action: "CREATE",
      entityType: "TreasuryRequest",
      entityId: request.id,
    });

    const needed = treasuryApprovalsNeeded(body.amount);
    await notifyExecs(
      membership!.societyId,
      "APPROVAL_REQUIRED",
      `New Reimbursement: $${body.amount.toFixed(2)} from ${session!.user.name}`,
      `Requires ${needed} approval${needed > 1 ? "s" : ""}${body.amount >= 50 ? " including the Treasurer" : ""}.`,
      `/requests/treasury/${request.id}`
    );

    return NextResponse.json(request, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Validation error" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
