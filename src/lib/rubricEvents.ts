// Shared parsing for Rubric's getSocietyPortalTicketingHomePage response.

export interface RubricEvent {
  eventid?: number | string;
  eventname?: string;
  eventTime?: string;
  bannerurl?: string;
  purchaseurl?: string;
  totalScanned?: number;
  totalpaid?: number;
  totalrev?: string;
  draft?: boolean;
  private?: boolean;
}

// Events come back grouped under `eventdetails` by category/year. Flatten all the
// event arrays and dedupe by eventid (categories overlap, e.g. "2026" + "Recently
// Updated"), newest first.
export function flattenEvents(d: Record<string, unknown> | null | undefined): RubricEvent[] {
  const details = d?.eventdetails as Record<string, unknown> | undefined;
  if (!details) return [];
  const byId = new Map<number | string, RubricEvent>();
  for (const val of Object.values(details)) {
    if (!Array.isArray(val)) continue;
    for (const ev of val as RubricEvent[]) {
      if (ev?.eventid != null && !byId.has(ev.eventid)) byId.set(ev.eventid, ev);
    }
  }
  return [...byId.values()].sort((a, b) => (b.eventTime ?? "").localeCompare(a.eventTime ?? ""));
}
