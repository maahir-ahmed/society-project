import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { RubricShell } from "@/components/rubric/RubricShell";
import { ExternalLink } from "lucide-react";

// Rubric's site allows framing (no X-Frame-Options / CSP frame-ancestors), so it
// embeds here. We can't auto-login the frame: the stored session id is an API-body
// token for api.hellorubric.com, not a cookie for this site, and the browser won't
// let us set cross-origin cookies — hence the always-works "open in new tab".
const RUBRIC_URL = "https://campus.hellorubric.com/";

export default async function RubricWebPage({ params }: { params: Promise<{ society: string }> }) {
  const { society } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const membership = await prisma.societyMembership.findFirst({
    where: { userId: session.user.id, society: { slug: society }, isActive: true },
  });
  // Execs only — this tab isn't shown to anyone else, and the guard blocks direct access.
  if (!membership || membership.role !== "EXECUTIVE") notFound();

  return (
    <RubricShell>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            The Rubric portal, embedded — submit room bookings, forms, etc. without leaving here.
            If it shows a login screen, use “Open in new tab”.
          </p>
          <a
            href={RUBRIC_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted"
          >
            Open in new tab <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
        <iframe
          src={RUBRIC_URL}
          title="Rubric portal"
          className="w-full rounded-lg border bg-white"
          style={{ height: "calc(100vh - 15rem)", minHeight: 500 }}
        />
      </div>
    </RubricShell>
  );
}
