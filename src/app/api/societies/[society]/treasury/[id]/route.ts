import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireMembership } from "@/lib/api";
import { createAuditLog } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";

type Params = { society: string; id: string };

// Claims are editable by the submitter while still DRAFT/AWAITING_APPROVAL, and by execs.
const EDITABLE_STATUSES = ["DRAFT", "AWAITING_APPROVAL"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<Params> }) {
  const { session, error: authErr } = await requireAuth();
  if (authErr) return authErr;

  const { society, id } = await params;
  const { membership, error: memErr } = await requireMembership(session!.user.id, society);
  if (memErr) return memErr;

  const body = await req.json();
  const request = await prisma.treasuryRequest.findUnique({ where: { id } });
  if (!request || request.societyId !== membership!.societyId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isExec = membership!.role === "EXECUTIVE";
  const isOwner = request.submittedById === session!.user.id;
  const canEdit = isExec || (isOwner && EDITABLE_STATUSES.includes(request.status));

  // Only execs can change status.
  if (body.status !== undefined && !isExec) {
    return NextResponse.json({ error: "Only executives can change status" }, { status: 403 });
  }

  const editsFields =
    ["contactEmail", "expenseDate", "locationSupplier", "description", "amount"].some((k) => body[k] !== undefined) ||
    Array.isArray(body.addReceipts) || Array.isArray(body.removeReceiptIds);
  if (editsFields && !canEdit) {
    return NextResponse.json({ error: "This claim can no longer be edited" }, { status: 403 });
  }

  const updated = await prisma.treasuryRequest.update({
    where: { id },
    data: {
      ...(isExec && body.status ? { status: body.status } : {}),
      ...(canEdit && body.contactEmail !== undefined ? { contactEmail: body.contactEmail } : {}),
      ...(canEdit && body.expenseDate !== undefined ? { expenseDate: new Date(body.expenseDate) } : {}),
      ...(canEdit && body.locationSupplier !== undefined ? { locationSupplier: body.locationSupplier } : {}),
      ...(canEdit && body.description !== undefined ? { description: body.description } : {}),
      ...(canEdit && body.amount !== undefined ? { amount: Number(body.amount) } : {}),
    },
  });

  if (canEdit && Array.isArray(body.addReceipts) && body.addReceipts.length > 0) {
    await prisma.treasuryAttachment.createMany({
      data: body.addReceipts
        .filter((r: { fileUrl?: string }) => r?.fileUrl)
        .map((r: { fileName?: string; fileUrl: string }) => ({
          treasuryRequestId: id,
          fileName: r.fileName || r.fileUrl.split("/").pop() || "receipt",
          fileUrl: r.fileUrl,
          fileSize: 0,
          mimeType: "application/octet-stream",
        })),
    });
  }

  if (canEdit && Array.isArray(body.removeReceiptIds) && body.removeReceiptIds.length > 0) {
    await prisma.treasuryAttachment.deleteMany({
      where: { id: { in: body.removeReceiptIds }, treasuryRequestId: id },
    });
  }

  await createAuditLog({
    societyId: membership!.societyId,
    userId: session!.user.id,
    action: body.status ? "STATUS_CHANGE" : "UPDATE",
    entityType: "TreasuryRequest",
    entityId: id,
    ...(body.status ? { metadata: { from: request.status, to: body.status } } : {}),
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
