import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireMembership } from "@/lib/api";
import { z } from "zod";

// The actual Rubric submitEvent call is made client-side (browser → Rubric API directly)
// because Rubric sessions are IP-bound. This route only stamps the DB record.
const schema = z.object({
  contentRequestId: z.string().optional(),
  rubricEventId: z.string().optional(),
  rubricEventLink: z.string().optional(),
  // false when linking an already-existing Rubric event (assignment, not submission)
  markSubmitted: z.boolean().optional().default(true),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ society: string }> }) {
  const { session, error: authErr } = await requireAuth();
  if (authErr) return authErr;

  const { society } = await params;
  const { membership, error: memErr } = await requireMembership(session!.user.id, society);
  if (memErr) return memErr;
  if (membership!.role !== "EXECUTIVE") {
    return NextResponse.json({ error: "Exec only" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  if (parsed.data.contentRequestId) {
    await prisma.contentRequest.update({
      where: { id: parsed.data.contentRequestId, societyId: membership!.societyId },
      data: {
        ...(parsed.data.markSubmitted ? { rubricSubmittedAt: new Date() } : {}),
        rubricEventId: parsed.data.rubricEventId,
        rubricEventLink: parsed.data.rubricEventLink,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
