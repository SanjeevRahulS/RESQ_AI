import { format } from "date-fns";

import { SEVERITY_LABEL, STATUS_LABEL, type IncidentStatus, type Severity } from "@/lib/incidents/constants";
import type { IncidentEvent } from "@/lib/incidents/types";

function label(value: string | null, kind: string) {
  if (!value) return "—";
  if (kind === "severity_change") return SEVERITY_LABEL[value as Severity] ?? value;
  if (kind.startsWith("status") || kind.startsWith("review")) return STATUS_LABEL[value as IncidentStatus] ?? value;
  return value;
}

function describe(e: IncidentEvent) {
  switch (e.event_type) {
    case "status_change":
      return `Status ${label(e.from_value, e.event_type)} → ${label(e.to_value, e.event_type)}`;
    case "severity_change":
      return `Severity ${label(e.from_value, e.event_type)} → ${label(e.to_value, e.event_type)}`;
    case "linked_duplicate":
      return "Another report was linked to this incident";
    case "marked_duplicate":
      return "Linked to an existing incident";
    case "review_merged":
      return "Review: merged into existing incident";
    case "review_kept_separate":
      return "Review: kept as a separate incident";
    default:
      return e.event_type.replace(/_/g, " ");
  }
}

export function EventLog({ events }: { events: IncidentEvent[] }) {
  if (events.length === 0) return <p className="text-sm text-muted-foreground">No changes recorded yet.</p>;
  return (
    <ol className="space-y-3 border-l pl-4">
      {events.map((e) => (
        <li key={e.id} className="relative">
          <span aria-hidden className="absolute -left-[21px] top-1.5 size-2.5 rounded-full border-2 border-surface bg-primary" />
          <p className="text-sm font-medium">{describe(e)}</p>
          {e.note && <p className="text-xs text-muted-foreground">{e.note}</p>}
          <p className="text-xs text-muted-foreground">
            {e.actor} · <time dateTime={e.created_at}>{format(new Date(e.created_at), "d MMM, HH:mm")}</time>
          </p>
        </li>
      ))}
    </ol>
  );
}
