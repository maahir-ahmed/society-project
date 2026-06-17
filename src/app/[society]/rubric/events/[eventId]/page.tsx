"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { RubricShell } from "@/components/rubric/RubricShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, ExternalLink, Ticket, MapPin, Calendar, Users, DollarSign } from "lucide-react";
import { useRubricClient } from "@/hooks/useRubricClient";

interface EventDetail {
  eventname?: string;
  eventaddress?: string;
  eventtime?: string;
  purchaseurl?: string;
  bannerurl?: string;
  societyemail?: string;
  facebookurl?: string;
}

interface TicketData {
  allTickets?: unknown[];
  scannedin?: number;
  eventname?: string;
  societyname?: string;
  societycolor?: string;
  logo_url?: string;
}

export default function RubricEventDetailPage() {
  const params = useParams<{ society: string; eventId: string }>();
  const rubric = useRubricClient(params.society);
  const [details, setDetails] = useState<EventDetail | null>(null);
  const [tickets, setTickets] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      rubric.call({ type: "getEventDetails", eventid: params.eventId }),
      rubric.call({ type: "getSocietyPortalEventTicketList", eventid: Number(params.eventId) }),
    ]).then(([d, t]) => {
      setDetails(d as EventDetail);
      setTickets(t as TicketData);
    }).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Failed to load");
    }).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.society, params.eventId]);

  const allTickets = (tickets?.allTickets ?? []) as Record<string, unknown>[];

  // Names that appear on more than one ticket — likely duplicate/multi purchases.
  const nameKey = (t: Record<string, unknown>) => ((t.fullname as string) ?? "").trim().toLowerCase();
  const nameCounts = allTickets.reduce<Record<string, number>>((acc, t) => {
    const k = nameKey(t);
    if (k) acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
  const dupNames = new Set(Object.entries(nameCounts).filter(([, n]) => n > 1).map(([k]) => k));
  const dupTicketCount = allTickets.filter((t) => dupNames.has(nameKey(t))).length;

  return (
    <RubricShell>
      <div className="flex items-center gap-3 mb-4">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/${params.society}/rubric/events`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h2 className="text-lg font-semibold">{details?.eventname ?? "Event Detail"}</h2>
      </div>

      {loading && <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}
      {error && <p className="text-sm text-red-600 text-center py-8">{error}</p>}

      {!loading && !error && (
        <div className="space-y-6">
          {details?.bannerurl && (
            <img src={details.bannerurl} alt="" className="h-40 w-full object-contain rounded-xl border bg-gray-50" />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base">Event Info</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {details?.eventtime && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {new Date(details.eventtime).toLocaleString("en-AU", { dateStyle: "full", timeStyle: "short" })}
                    </div>
                  )}
                  {details?.eventaddress && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" /> {details.eventaddress}
                    </div>
                  )}
                  {details?.societyemail && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" /> {details.societyemail}
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    {details?.purchaseurl && (
                      <Button asChild size="sm" variant="outline">
                        <a href={details.purchaseurl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5 mr-1" /> Buy Tickets Page
                        </a>
                      </Button>
                    )}
                    {details?.facebookurl && (
                      <Button asChild size="sm" variant="outline">
                        <a href={details.facebookurl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5 mr-1" /> Facebook Event
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Ticket className="h-4 w-4" /> Ticket Sales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {allTickets.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No ticket data available</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left">
                            <th className="pb-2 pr-3 font-medium text-muted-foreground">Name</th>
                            <th className="pb-2 pr-3 font-medium text-muted-foreground">Email</th>
                            <th className="pb-2 pr-3 font-medium text-muted-foreground">Ticket Type</th>
                            <th className="pb-2 pr-3 font-medium text-muted-foreground">Paid</th>
                            <th className="pb-2 font-medium text-muted-foreground">Scanned</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allTickets.map((t, i) => {
                            const isDup = dupNames.has(nameKey(t));
                            return (
                            <tr key={(t.ticketid as number) ?? i} className={`border-b last:border-0 ${isDup ? "bg-amber-50 hover:bg-amber-100" : "hover:bg-gray-50"}`}>
                              <td className="py-2 pr-3 font-medium">
                                {(t.fullname as string) || "—"}
                                {isDup && <span className="ml-1.5 text-xs text-amber-700">×{nameCounts[nameKey(t)]}</span>}
                              </td>
                              <td className="py-2 pr-3 text-muted-foreground">{(t.email as string) || "—"}</td>
                              <td className="py-2 pr-3">{(t.tickettypename as string) || "—"}</td>
                              <td className="py-2 pr-3 text-muted-foreground">{(t.totalbill as string) || "—"}</td>
                              <td className="py-2">
                                {t["Ticket Scanned"] === "Yes" ? (
                                  <span className="text-green-600 font-medium">✓</span>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </td>
                            </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base">Summary</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1"><Ticket className="h-3.5 w-3.5" /> Total tickets</span>
                    <span className="font-semibold">{allTickets.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Scanned in</span>
                    <span className="font-semibold">{tickets?.scannedin ?? 0}</span>
                  </div>
                  {dupTicketCount > 0 && (
                    <div className="flex items-center justify-between rounded-md bg-amber-50 border border-amber-200 px-2.5 py-1.5 -mx-0.5">
                      <span className="text-amber-800">Duplicate-name tickets</span>
                      <span className="font-semibold text-amber-800">{dupTicketCount} across {dupNames.size} {dupNames.size === 1 ? "name" : "names"}</span>
                    </div>
                  )}
                  {allTickets.some((t) => (t as Record<string, unknown>).price != null) && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" /> Revenue</span>
                      <span className="font-semibold">
                        ${allTickets.reduce((acc, t) => {
                          const price = Number((t as Record<string, unknown>).price ?? 0);
                          return acc + price;
                        }, 0).toFixed(2)}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </RubricShell>
  );
}
