"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RubricShell } from "@/components/rubric/RubricShell";
import { RubricNotConfigured } from "@/components/rubric/RubricNotConfigured";
import { Loader2, TrendingUp, Users, Package, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { useRubricClient } from "@/hooks/useRubricClient";

interface OverviewData {
  clubPage: Record<string, unknown> | null;
  salesMonth: Record<string, unknown> | null;
  grantsMonth: Record<string, unknown> | null;
  affiliation: Record<string, unknown> | null;
  team: Record<string, unknown> | null;
}

function StatCard({ label, value, icon: Icon, color = "blue" }: {
  label: string; value: string | number | null | undefined;
  icon: React.ElementType; color?: string;
}) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    purple: "bg-purple-50 text-purple-700",
    amber: "bg-amber-50 text-amber-700",
  };
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">{value ?? "—"}</p>
          </div>
          <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function RubricOverviewPage() {
  const params = useParams<{ society: string }>();
  const rubric = useRubricClient(params.society);
  const [data, setData] = useState<OverviewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    rubric.getToken().then((token) => {
      return Promise.allSettled([
        rubric.call({ type: "getClubPage", societyid: Number(token.societyID) }),
        rubric.call({ type: "getHomepageEventSalesMonth" }),
        rubric.call({ type: "getHomepageGrantsApprovedMonth" }),
        rubric.call({ type: "getClubAffiliationStatus" }),
        rubric.call({ type: "getSocietyTeamMembers", complete: true }),
      ]);
    }).then(([clubPage, salesMonth, grantsMonth, affiliation, team]) => {
      setData({
        clubPage: clubPage.status === "fulfilled" ? clubPage.value : null,
        salesMonth: salesMonth.status === "fulfilled" ? salesMonth.value : null,
        grantsMonth: grantsMonth.status === "fulfilled" ? grantsMonth.value : null,
        affiliation: affiliation.status === "fulfilled" ? affiliation.value : null,
        team: team.status === "fulfilled" ? team.value : null,
      });
    }).catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg === "not_configured" ? "not_configured" : msg);
    }).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.society]);

  if (loading) return (
    <RubricShell>
      <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
    </RubricShell>
  );

  if (error === "not_configured") return (
    <RubricShell><RubricNotConfigured societySlug={params.society} /></RubricShell>
  );

  if (error) return (
    <RubricShell>
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <AlertCircle className="h-8 w-8 text-red-400" />
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    </RubricShell>
  );

  const stats = data?.clubPage as Record<string, unknown> | null;
  const membershipStats = stats?.membershipstats as Record<string, unknown> | null;
  const eventStats = stats?.eventstats as Record<string, unknown> | null;
  const merchStats = stats?.merchstats as Record<string, unknown> | null;

  const salesMonthData = (data?.salesMonth as Record<string, unknown> | null)?.stats as Record<string, unknown> | null;
  const grantsMonthData = (data?.grantsMonth as Record<string, unknown> | null)?.stats as Record<string, unknown> | null;

  const affiliation = data?.affiliation as Record<string, unknown> | null;
  const affiliations = (affiliation?.clubAffiliations as unknown[]) ?? [];
  const hasAccess = (affiliation?.hasModuleAccess as Record<string, unknown> | null)?.hasAccess;

  const team = data?.team as Record<string, unknown> | null;
  const members = (team?.members as unknown[]) ?? [];
  const acceptedMembers = members.filter((m) => (m as Record<string, unknown>).accepted);

  return (
    <RubricShell>
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Revenue This Month" value={salesMonthData?.event_sales_month as string ?? "—"} icon={TrendingUp} color="green" />
        <StatCard label="Grants Approved (Month)" value={grantsMonthData?.grants_approved_month as string ?? "—"} icon={Package} color="amber" />
        <StatCard label="Active Members" value={membershipStats?.active_count as number ?? eventStats?.member_count as number ?? "—"} icon={Users} color="blue" />
        <StatCard label="Total Events" value={eventStats?.total_count as number ?? "—"} icon={TrendingUp} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Affiliation Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Affiliation Status</CardTitle>
          </CardHeader>
          <CardContent>
            {affiliations.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                {hasAccess ? "No affiliation records found" : "Affiliation module not accessible"}
              </div>
            ) : (
              <div className="space-y-2">
                {affiliations.slice(0, 5).map((a, i) => {
                  const aff = a as Record<string, unknown>;
                  return (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{(aff.name as string) ?? "Affiliation"}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        aff.status === "affiliated" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {aff.status as string ?? "unknown"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rubric Team Members */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Rubric Team ({acceptedMembers.length} active)</CardTitle>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground">No team members found</p>
            ) : (
              <div className="space-y-2">
                {members.slice(0, 6).map((m, i) => {
                  const mem = m as Record<string, unknown>;
                  return (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium">{mem.name as string}</p>
                        <p className="text-xs text-muted-foreground">{(mem.role as Record<string, unknown>)?.name as string}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {mem.accepted ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <span className="text-xs text-muted-foreground">Invited</span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {members.length > 6 && (
                  <p className="text-xs text-muted-foreground pt-1">+{members.length - 6} more</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Merch stats */}
        {merchStats && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Merchandise</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {Object.entries(merchStats).map(([k, v]) => (
                  <div key={k}>
                    <p className="text-xs text-muted-foreground capitalize">{k.replace(/_/g, " ")}</p>
                    <p className="font-semibold">{String(v)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick links */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Rubric Portal Links</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[
              { label: "Society Dashboard", href: "https://portal.hellorubric.com" },
              { label: "Event Manager", href: "https://portal.hellorubric.com/events" },
              { label: "Membership Manager", href: "https://portal.hellorubric.com/members" },
              { label: "Settlements", href: "https://portal.hellorubric.com/settlements" },
            ].map(({ label, href }) => (
              <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:underline">
                <ExternalLink className="h-3.5 w-3.5" /> {label}
              </a>
            ))}
          </CardContent>
        </Card>
      </div>
    </RubricShell>
  );
}
