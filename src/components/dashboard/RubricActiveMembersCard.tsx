"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { useRubricClient } from "@/hooks/useRubricClient";

// Active member count from Rubric — same source as the Rubric portal Members tab.
// Rubric sessions are IP-bound so this must run client-side. Self-hides if the
// user can't reach Rubric (not configured / no access).
export function RubricActiveMembersCard({ societySlug }: { societySlug: string }) {
  const rubric = useRubricClient(societySlug);
  const [count, setCount] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const home = await rubric.call({ type: "getSocietyPortalMembershipHomePage" });
        let n = Number(home.active_count);
        if (!Number.isFinite(n)) {
          const list = await rubric.call({ type: "getSocietyPortalMembershipList", viewFilter: "active" });
          n = Array.isArray(list.allMemberships) ? list.allMemberships.length : NaN;
        }
        if (!active) return;
        if (Number.isFinite(n)) setCount(n);
        else setFailed(true);
      } catch {
        if (active) setFailed(true);
      }
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [societySlug]);

  if (failed) return null;
  return <StatsCard title="Active Members" value={count ?? "…"} icon={Users} />;
}
