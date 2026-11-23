import { useEffect, useRef } from "react";
import { Clock, MapPin, Users, X } from "lucide-react";

import { IncidentTypeIcon } from "@/components/incidents/IncidentTypeIcon";
import { PhotoGallery } from "@/components/incidents/PhotoGallery";
import { SeverityBadge } from "@/components/incidents/SeverityBadge";
import { StatusBadge } from "@/components/incidents/StatusBadge";
import { Button } from "@/components/ui/button";
import { TYPE_LABEL } from "@/lib/incidents/constants";
import { timeAgo } from "@/lib/incidents/format";
import type { Incident } from "@/lib/incidents/types";

export function IncidentPanel({ incident, onClose }: { incident: Incident; onClose: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus(), [incident.id]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <aside
      role="dialog"
      aria-modal="false"
      aria-labelledby="incident-panel-title"
      className="shadow-panel absolute inset-x-0 bottom-0 z-[1000] flex max-h-[65dvh] flex-col rounded-t-2xl border bg-surface md:inset-x-auto md:bottom-4 md:right-4 md:top-4 md:max-h-none md:w-[380px] md:rounded-2xl"
    >
      <div aria-hidden className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-border md:hidden" />
      <div className="flex items-start gap-3 border-b p-4">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge severity={incident.severity} />
            <StatusBadge status={incident.status} />
          </div>
          <h2
            id="incident-panel-title"
            ref={headingRef}
            tabIndex={-1}
            className="flex items-center gap-2 text-lg font-semibold outline-none"
          >
            <IncidentTypeIcon type={incident.incident_type} className="size-5 text-muted-foreground" />
            {incident.incident_type ? TYPE_LABEL[incident.incident_type] : "Unclassified incident"}
          </h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close incident details">
          <X aria-hidden className="size-5" />
        </Button>
      </div>
      <div className="space-y-4 overflow-y-auto p-4">
        <p className="text-sm leading-relaxed">{incident.summary ?? incident.raw_text}</p>
        <dl className="grid grid-cols-1 gap-2 text-sm">
          <div className="flex items-start gap-2">
            <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <dt className="sr-only">Address</dt>
            <dd>{incident.address_text ?? "No address given"}</dd>
          </div>
          <div className="flex items-center gap-2">
            <Clock aria-hidden className="size-4 text-muted-foreground" />
            <dt className="sr-only">Reported</dt>
            <dd>
              <time dateTime={incident.created_at}>Reported {timeAgo(incident.created_at)}</time>
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <Users aria-hidden className="size-4 text-muted-foreground" />
            <dt className="sr-only">Reports</dt>
            <dd>
              {incident.report_count} independent report{incident.report_count === 1 ? "" : "s"}
              {incident.people_affected != null && ` · ${incident.people_affected} people affected`}
            </dd>
          </div>
        </dl>
        {incident.needs.length > 0 && (
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Needs</h3>
            <ul className="flex flex-wrap gap-1.5">
              {incident.needs.map((n) => (
                <li key={n} className="rounded-md bg-secondary px-2 py-1 text-xs">
                  {n}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Photos</h3>
          <PhotoGallery paths={incident.image_urls} />
        </div>
      </div>
    </aside>
  );
}
