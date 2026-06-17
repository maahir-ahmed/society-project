"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Banknote } from "lucide-react";

export function MarkReimbursedButton({
  societySlug,
  requestId,
}: {
  societySlug: string;
  requestId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    if (!confirm("Confirm this reimbursement has been paid out?")) return;
    setLoading(true);
    const res = await fetch(`/api/societies/${societySlug}/treasury/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "REIMBURSED" }),
    });
    setLoading(false);
    if (res.ok) {
      toast.success("Marked as reimbursed");
      router.refresh();
    } else {
      toast.error("Failed to update");
    }
  }

  return (
    <Button size="sm" onClick={handleClick} disabled={loading} className="text-xs bg-green-700 hover:bg-green-800">
      <Banknote className="h-3.5 w-3.5 mr-1" />
      {loading ? "Saving…" : "Mark Reimbursed"}
    </Button>
  );
}
