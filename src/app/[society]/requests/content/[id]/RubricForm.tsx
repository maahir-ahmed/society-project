"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function RubricForm({ requestId, societySlug }: { requestId: string; societySlug: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSaving(true);
    const res = await fetch(`/api/societies/${societySlug}/content-requests/${requestId}/rubric`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rubricEventLink: fd.get("rubricEventLink"),
        rubricQrCodeUrl: fd.get("rubricQrCodeUrl") || null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Rubric event attached");
      router.refresh();
    } else {
      toast.error("Failed to attach rubric event");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2">
      <input
        name="rubricEventLink"
        type="url"
        placeholder="Rubric event URL"
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
        required
      />
      <input
        name="rubricQrCodeUrl"
        type="url"
        placeholder="QR code image URL (optional)"
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
      />
      <Button type="submit" size="sm" className="w-full" disabled={saving}>
        {saving ? "Attaching…" : "Attach Rubric Event"}
      </Button>
    </form>
  );
}
