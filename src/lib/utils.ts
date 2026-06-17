import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, differenceInBusinessDays } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string) {
  return format(new Date(date), "d MMM yyyy");
}

export function formatDateTime(date: Date | string) {
  return format(new Date(date), "d MMM yyyy, h:mm a");
}

export function timeAgo(date: Date | string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function businessDaysUntil(date: Date | string): number {
  return differenceInBusinessDays(new Date(date), new Date());
}

export function isLateArcSubmission(eventDate: Date | string): boolean {
  return businessDaysUntil(eventDate) < 7;
}

export function formatCurrency(amount: number | string): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(Number(amount));
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-700",
    SUBMITTED: "bg-blue-100 text-blue-700",
    ASSIGNED: "bg-purple-100 text-purple-700",
    IN_PROGRESS: "bg-yellow-100 text-yellow-700",
    AWAITING_INFORMATION: "bg-orange-100 text-orange-700",
    AWAITING_EXECUTIVE_ACTION: "bg-red-100 text-red-700",
    COMPLETED: "bg-green-100 text-green-700",
    CANCELLED: "bg-gray-100 text-gray-500",
    UNDER_REVIEW: "bg-yellow-100 text-yellow-700",
    WAITING_ON_INFORMATION: "bg-orange-100 text-orange-700",
    SUBMITTED_TO_ARC: "bg-blue-100 text-blue-700",
    APPROVED: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
    AWAITING_APPROVAL: "bg-yellow-100 text-yellow-700",
    REIMBURSEMENT_PENDING: "bg-blue-100 text-blue-700",
    REIMBURSED: "bg-green-100 text-green-700",
  };
  return map[status] ?? "bg-gray-100 text-gray-700";
}

export function statusLabel(status: string): string {
  return status
    .split("_")
    .map((w) => w[0] + w.slice(1).toLowerCase())
    .join(" ");
}

export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n - 1) + "…" : str;
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}
