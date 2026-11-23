import { GitMerge, Split } from "lucide-react";

import { IncidentTypeIcon } from "@/components/incidents/IncidentTypeIcon";
import { SeverityBadge } from "@/components/incidents/SeverityBadge";
import { Button } from "@/components/ui/button";
import { useIncidentActions } from "@/hooks/useIncidentActions";
import { TYPE_LABEL } from "@/lib/incidents/constants";
import { timeAgo } from "@/lib/incidents/format";
import type { Incident } from "@/lib/incidents/types";

function Side({ title, incident }: { title: string; incident: Incident | undefined }) {
  return (
    <div className="space-y-2 rounded-lg border bg-background/40 p-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      {incident ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge severity={incident.severity} size="sm" />
            <span className="text-xs text-muted-foreground">{timeAgo(incident.created_at)}</span>
          </div>
          <p className="text-sm">{incident.summary ?? incident.raw_text}</p>
          <p className="text-xs text-muted-foreground">{incident.address_text ?? "No address"}</p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Original incident not found.</p>
      )}
    </div>
  );
}

interface Props {
  incidents: Incident[];
  onOpen: (id: string) => void;
}

export function ReviewList({ incidents, onOpen }: Props) {
  const { reviewMutation } = useIncidentActions();
  const byId = new Map(incidents.map((i) => [i.id, i]));
  const items = incidents
    .filter((i) => i.status === "needs_review" && i.duplicate_of == null)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  if (items.length === 0) {
    return (
      <p className="rounded-xl border bg-surface p-8 text-center text-sm text-muted-foreground">
        Nothing to review. Suspected duplicates will appear here.
      </p>
    );
  }

  return (
    <ul className="space-y-3" aria-label="Suspected duplicates">
      {items.map((i) => {
        const busy = reviewMutation.isPending && reviewMutation.variables?.id === i.id;
        return (
          <li key={i.id} className="space-y-3 rounded-xl border bg-surface p-4">
            <div className="flex flex-wrap items-center gap-2">
              <IncidentTypeIcon type={i.incident_type} className="size-4 text-muted-foreground" />
              <span className="font-semibold">{i.incident_type ? TYPE_LABEL[i.incident_type] : "Unclassified"}</span>
              {i.duplicate_similarity != null && (
                <span className="rounded-full border border-status-review/60 px-2 py-0.5 text-xs text-status-review">
                  {Math.round(i.duplicate_similarity * 100)}% similar
                </span>
              )}
              <Button size="sm" variant="ghost" className="ml-auto" onClick={() => onOpen(i.id)}>
                Details
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Side title="New report" incident={i} />
              <Side title="Existing incident" incident={i.suspected_duplicate_of ? byId.get(i.suspected_duplicate_of) : undefined} />
            </div>
            {i.duplicate_reason && <p className="text-xs text-muted-foreground">AI: {i.duplicate_reason}</p>}
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => reviewMutation.mutate({ id: i.id, action: "merge" })}
                disabled={reviewMutation.isPending || !i.suspected_duplicate_of}
                aria-label="Merge into existing incident"
              >
                <GitMerge aria-hidden className="size-4" /> {busy && reviewMutation.variables?.action === "merge" ? "Merging…" : "Merge"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => reviewMutation.mutate({ id: i.id, action: "keep" })}
                disabled={reviewMutation.isPending}
                aria-label="Keep as a separate incident"
              >
                <Split aria-hidden className="size-4" /> {busy && reviewMutation.variables?.action === "keep" ? "Saving…" : "Keep separate"}
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
