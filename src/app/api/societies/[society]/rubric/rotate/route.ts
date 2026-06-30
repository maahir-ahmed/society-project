import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, requireMembership } from "@/lib/api";
import { prisma } from "@/lib/db";

const body = z.object({ sessionId: z.string().min(10) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ society: string }> }) {
  const { session, error: authErr } = await requireAuth();
  if (authErr) return authErr;
  const { society } = await params;
  const { membership, error: memErr } = await requireMembership(session!.user.id, society);
  if (memErr) return memErr;
  if (membership!.role === "SUBCOMMITTEE") return NextResponse.json({ error: "Not authorised" }, { status: 403 });

  const parsed = body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  await prisma.society.update({
    where: { id: membership!.societyId },
    data: { rubricSessionId: parsed.data.sessionId },
  });

  return NextResponse.json({ ok: true });
}
