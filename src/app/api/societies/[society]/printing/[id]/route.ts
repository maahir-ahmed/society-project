import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireMembership } from "@/lib/api";
import { createAuditLog } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import { z } from "zod";

type Params = { society: string; id: string };

const schema = z.object({ action: z.enum(["approve", "reject"]) });

// Exec approves or rejects a printing request. Budget is reduced only on approval
// (the GET endpoint sums APPROVED costs), so approving = deducting.
export async function POST(req: NextRequest, { params }: { params: Promise<Params> }) {
  const { session, error: authErr } = await requireAuth();
  if (authErr) return authErr;
  const { society, id } = await params;
  const { membership, error: memErr } = await requireMembership(session!.user.id, society, "EXECUTIVE");
  if (memErr) return memErr;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  const request = await prisma.printingRequest.findUnique({ where: { id } });
  if (!request || request.societyId !== membership!.societyId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (request.status !== "SUBMITTED") {
    return NextResponse.json({ error: "Request has already been decided" }, { status: 400 });
  }

  const approved = parsed.data.action === "approve";

  await prisma.printingRequest.update({
    where: { id },
    data: {
      status: approved ? "APPROVED" : "REJECTED",
      decidedById: session!.user.id,
      decidedAt: new Date(),
    },
  });

  await createAuditLog({
    societyId: membership!.societyId,
    userId: session!.user.id,
    action: approved ? "APPROVE" : "REJECT",
    entityType: "PrintingRequest",
    entityId: id,
  });

  await createNotification({
    userId: request.submittedById,
    type: "STATUS_CHANGE",
    title: approved ? "Printing Request Approved" : "Printing Request Rejected",
    body: approved
      ? `Your printing request ($${Number(request.cost).toFixed(2)}) was approved. You'll be emailed when it's ready to collect from Arc Front Desk.`
      : "Your printing request was rejected. Check the request for details or resubmit.",
    link: `/requests/printing/${id}`,
  });

  return NextResponse.json({ ok: true });
}
