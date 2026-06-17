import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireMembership } from "@/lib/api";
import { createAuditLog } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";

type Params = { society: string; id: string };

export async function PATCH(req: NextRequest, { params }: { params: Promise<Params> }) {
  const { session, error: authErr } = await requireAuth();
  if (authErr) return authErr;

  const { society, id } = await params;
  const { membership, error: memErr } = await requireMembership(session!.user.id, society, "EXECUTIVE");
  if (memErr) return memErr;

  const body = await req.json();
  const request = await prisma.treasuryRequest.findUnique({ where: { id } });
  if (!request || request.societyId !== membership!.societyId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.treasuryRequest.update({
    where: { id },
    data: { ...(body.status ? { status: body.status } : {}) },
  });

  await createAuditLog({
    societyId: membership!.societyId,
    userId: session!.user.id,
    action: "STATUS_CHANGE",
    entityType: "TreasuryRequest",
    entityId: id,
    metadata: { from: request.status, to: body.status },
  });

  if (body.status && body.status !== request.status) {
    await createNotification({
      userId: request.submittedById,
      type: "STATUS_CHANGE",
      title: "Reimbursement Status Updated",
      body: `Your claim for $${request.amount} has been updated to ${body.status.replace(/_/g, " ").toLowerCase()}.`,
      link: `/requests/treasury/${id}`,
    });
  }

  return NextResponse.json(updated);
}
