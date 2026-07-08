import { cn, statusColor, statusLabel } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  // Extra context appended to the label, e.g. an approval count ("2/3").
  detail?: string;
  className?: string;
}

export function StatusBadge({ status, detail, className }: StatusBadgeProps) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", statusColor(status), className)}>
      {statusLabel(status)}
      {detail && <span className="ml-1 opacity-75">· {detail}</span>}
    </span>
  );
}
