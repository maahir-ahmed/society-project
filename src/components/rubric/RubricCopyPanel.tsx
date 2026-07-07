"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Copy, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CopyRecord {
  id: string;
  title: string;
  fields: { label: string; value: string }[];
}

// Shows room booking / printing details beside the embedded Rubric portal so the
// info can be copied field-by-field into Rubric's (cross-origin) web forms.
export function RubricCopyPanel({ bookings, printing }: { bookings: CopyRecord[]; printing: CopyRecord[] }) {
  const [tab, setTab] = useState<"room" | "printing">("room");
  const records = tab === "room" ? bookings : printing;
  const [id, setId] = useState<string>(bookings[0]?.id ?? "");
  const record = records.find((r) => r.id === id) ?? records[0];

  function switchTab(t: "room" | "printing") {
    setTab(t);
    setId((t === "room" ? bookings : printing)[0]?.id ?? "");
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied");
    } catch {
      toast.error("Copy failed — select and copy manually");
    }
  }

  return (
    <div className="flex w-full flex-col overflow-hidden rounded-lg border bg-card lg:w-[360px] lg:flex-shrink-0">
      <div className="flex border-b">
        {(["room", "printing"] as const).map((t) => (
          <button
            key={t}
            onClick={() => switchTab(t)}
            className={cn(
              "flex-1 px-3 py-2 text-sm font-medium transition-colors",
              tab === t ? "border-b-2 border-primary text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t === "room" ? `Room bookings (${bookings.length})` : `Printing (${printing.length})`}
          </button>
        ))}
      </div>

      {records.length === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">
          No {tab === "room" ? "room bookings" : "printing requests"} yet.
        </p>
      ) : (
        <>
          <div className="space-y-2 border-b p-3">
            <select
              value={record?.id ?? ""}
              onChange={(e) => setId(e.target.value)}
              className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
            >
              {records.map((r) => (
                <option key={r.id} value={r.id}>{r.title}</option>
              ))}
            </select>
            {record && (
              <button
                onClick={() => copy(record.fields.map((f) => `${f.label}: ${f.value}`).join("\n"))}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                <ClipboardList className="h-3.5 w-3.5" /> Copy all fields
              </button>
            )}
          </div>

          <div className="flex-1 divide-y overflow-y-auto">
            {record?.fields.map((f, i) => (
              <button
                key={i}
                onClick={() => copy(f.value)}
                className="group flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-muted/50"
                title="Click to copy"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{f.label}</p>
                  <p className="whitespace-pre-wrap break-words text-sm">{f.value || "—"}</p>
                </div>
                <Copy className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
