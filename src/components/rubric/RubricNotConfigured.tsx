import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plug } from "lucide-react";

export function RubricNotConfigured({ societySlug }: { societySlug: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
        <Plug className="h-6 w-6 text-gray-400" />
      </div>
      <div>
        <p className="font-semibold text-lg">Rubric not connected</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Add your Rubric session ID and society ID in Settings to enable the portal.
        </p>
      </div>
      <Button asChild>
        <Link href={`/${societySlug}/settings`}>Go to Settings</Link>
      </Button>
    </div>
  );
}
