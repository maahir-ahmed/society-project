import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api";
import { z } from "zod";

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const account = await prisma.bankAccount.findFirst({
    where: { userId: session!.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(account ?? null);
}

const schema = z.object({
  accountName: z.string().trim().min(1).max(100),
  bsb: z.string().trim().min(3).max(20),
  accountNumber: z.string().trim().min(3).max(30),
});

// Saves the user's bank details. Existing accounts referenced by past claims are
// kept intact (a new default row is created instead), so reimbursement history
// still shows the details the claim was actually paid to.
export async function PUT(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;
  const userId = session!.user.id;

  try {
    const body = schema.parse(await req.json());

    const account = await prisma.$transaction(async (tx) => {
      const current = await tx.bankAccount.findFirst({
        where: { userId },
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      });

      if (current) {
        const referenced = await tx.treasuryRequest.count({ where: { bankAccountId: current.id } });
        if (referenced === 0) {
          return tx.bankAccount.update({
            where: { id: current.id },
            data: { ...body, isDefault: true },
          });
        }
      }

      await tx.bankAccount.updateMany({ where: { userId }, data: { isDefault: false } });
      return tx.bankAccount.create({ data: { userId, ...body, isDefault: true } });
    });

    return NextResponse.json(account);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Validation error" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
