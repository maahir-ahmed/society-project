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

  // Marketing directors (or execs) may fill in the finished content.
  const isMarketing =
    membership!.role === "EXECUTIVE" || (membership!.title?.toLowerCase().includes("marketing") ?? false);

  const updated = await prisma.contentRequest.update({
    where: { id },
    data: {
      ...(body.status ? { status: body.status } : {}),
      ...(isMarketing && body.finishedBlurb !== undefined ? { finishedBlurb: body.finishedBlurb || null } : {}),
      ...(isMarketing && typeof body.bannerDone === "boolean" ? { bannerDone: body.bannerDone } : {}),
      ...(isMarketing && typeof body.blurbDone === "boolean" ? { blurbDone: body.blurbDone } : {}),
    },
  });

  if (isMarketing && Array.isArray(body.addDeliverables) && body.addDeliverables.length > 0) {
    await prisma.contentDeliverable.createMany({
      data: body.addDeliverables
        .filter((d: { fileUrl?: string }) => d?.fileUrl)
        .map((d: { fileName?: string; fileUrl: string }) => ({
          contentRequestId: id,
          fileName: d.fileName || d.fileUrl.split("/").pop() || "graphic",
          fileUrl: d.fileUrl,
        })),
    });
  }

  if (isMarketing && Array.isArray(body.removeDeliverableIds) && body.removeDeliverableIds.length > 0) {
    await prisma.contentDeliverable.deleteMany({
      where: { id: { in: body.removeDeliverableIds }, contentRequestId: id },
    });
  }

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
