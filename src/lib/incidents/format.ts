import { formatDistanceToNowStrict } from "date-fns";

export function timeAgo(iso: string, now: Date = new Date()): string {
  const diff = now.getTime() - new Date(iso).getTime();
  if (diff < 60_000) return "just now";
  return `${formatDistanceToNowStrict(new Date(iso))} ago`;
}

export function formatHours(hours: number | null): string {
  if (hours == null) return "—";
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  return `${hours.toFixed(1)} h`;
}
