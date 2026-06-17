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
  const booking = await prisma.roomBooking.findUnique({ where: { id } });
  if (!booking || booking.societyId !== membership!.societyId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.roomBooking.update({
    where: { id },
    data: {
      ...(body.status ? { status: body.status } : {}),
      ...(body.assignedToId !== undefined ? { assignedToId: body.assignedToId } : {}),
      ...(body.status === "SUBMITTED_TO_ARC" ? { submittedToArcAt: new Date() } : {}),
    },
  });

  await createAuditLog({
    societyId: membership!.societyId,
    userId: session!.user.id,
    action: "STATUS_CHANGE",
    entityType: "RoomBooking",
    entityId: id,
    metadata: { from: booking.status, to: body.status },
  });

  if (body.status && body.status !== booking.status) {
    await createNotification({
      userId: booking.submittedById,
      type: "STATUS_CHANGE",
      title: `Room Booking Updated: ${booking.eventName}`,
      body: `Status changed to ${body.status.replace(/_/g, " ").toLowerCase()}.`,
      link: `/requests/room-booking/${id}`,
    });
  }

  return NextResponse.json(updated);
}
