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
  const { membership, error: memErr } = await requireMembership(session!.user.id, society, "DIRECTOR");
  if (memErr) return memErr;

  const body = await req.json();

  const request = await prisma.contentRequest.findUnique({ where: { id } });
  if (!request || request.societyId !== membership!.societyId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.contentRequest.update({
    where: { id },
    data: {
      ...(body.status ? { status: body.status } : {}),
      ...(body.assignedToId !== undefined ? { assignedToId: body.assignedToId } : {}),
    },
  });

  await createAuditLog({
    societyId: membership!.societyId,
    userId: session!.user.id,
    action: "STATUS_CHANGE",
    entityType: "ContentRequest",
    entityId: id,
    metadata: { from: request.status, to: body.status },
  });

  if (body.status && body.status !== request.status) {
    await createNotification({
      userId: request.submittedById,
      type: "STATUS_CHANGE",
      title: `Content Request Updated: ${request.eventName}`,
      body: `Status changed to ${body.status.replace(/_/g, " ").toLowerCase()}.`,
      link: `/requests/content/${id}`,
    });
  }

  return NextResponse.json(updated);
}

export async function GET(req: NextRequest, { params }: { params: Promise<Params> }) {
  const { session, error: authErr } = await requireAuth();
  if (authErr) return authErr;

  const { society, id } = await params;
  const { membership, error: memErr } = await requireMembership(session!.user.id, society);
  if (memErr) return memErr;

  const request = await prisma.contentRequest.findUnique({
    where: { id },
    include: {
      submittedBy: { select: { id: true, name: true, avatarUrl: true, email: true } },
      assignedTo: { select: { id: true, name: true, avatarUrl: true } },
      thread: { include: { comments: { include: { author: { select: { id: true, name: true, avatarUrl: true } } } } } },
    },
  });

  if (!request || request.societyId !== membership!.societyId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(request);
}
