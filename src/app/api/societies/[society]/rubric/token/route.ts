import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireMembership } from "@/lib/api";
import { getRubricCredentials } from "@/lib/rubric";

// Returns Rubric credentials to the browser so client-side calls can be made.
// Rubric sessions are IP-bound, so calls must come from the user's browser, not our server.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ society: string }> }) {
  const { session, error: authErr } = await requireAuth();
  if (authErr) return authErr;
  const { society } = await params;
  const { membership, error: memErr } = await requireMembership(session!.user.id, society);
  if (memErr) return memErr;
  // Execs + directors (directors are limited to the Events tab in the UI).
  if (membership!.role === "SUBCOMMITTEE") return NextResponse.json({ error: "Not authorised" }, { status: 403 });

  const creds = await getRubricCredentials(membership!.societyId);
  if (!creds) return NextResponse.json({ error: "not_configured" }, { status: 400 });

  return NextResponse.json({
    sessionid: creds.sessionId,
    societyID: creds.societyId,
    unionSessionID: creds.unionSessionId ?? null,
  });
}
