"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";

interface Props {
  societySlug: string;
  requestId: string;
}

export function DeleteTreasuryClaim({ societySlug, requestId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function remove() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/societies/${societySlug}/treasury/${requestId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Claim deleted");
        setOpen(false);
        router.push(`/${societySlug}/requests/treasury`);
        router.refresh();
      } else {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error ?? "Failed to delete claim");
      }
    } catch {
      toast.error("Failed to delete claim");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-red-600 hover:text-red-700">
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete this claim?</DialogTitle>
          <DialogDescription>
            This permanently removes the claim along with its receipts, approvals and comments. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={remove} disabled={deleting}>
            {deleting ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Deleting…</> : "Delete claim"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
