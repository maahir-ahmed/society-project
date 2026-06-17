import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api";

export async function POST() {
  const { session, error: authErr } = await requireAuth();
  if (authErr) return authErr;

  await prisma.notification.updateMany({
    where: { userId: session!.user.id, isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json({ ok: true });
}
