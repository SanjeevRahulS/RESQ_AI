import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Clock, GitMerge, Loader2, MapPin, Phone, Split, Users } from "lucide-react";
import { format } from "date-fns";

import { IncidentTypeIcon } from "@/components/incidents/IncidentTypeIcon";
import { PhotoGallery } from "@/components/incidents/PhotoGallery";
import { SeverityBadge } from "@/components/incidents/SeverityBadge";
import { StatusBadge } from "@/components/incidents/StatusBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIncidentActions } from "@/hooks/useIncidentActions";
import { ALL_SEVERITIES, SEVERITY_LABEL, TYPE_LABEL, type Severity } from "@/lib/incidents/constants";
import { timeAgo } from "@/lib/incidents/format";
import { incidentDetailQuery } from "@/lib/incidents/queries";
import type { Incident } from "@/lib/incidents/types";
import { EventLog } from "./EventLog";
import { StatusWorkflow } from "./StatusWorkflow";

interface Props {
  incidentId: string | null;
  onClose: () => void;
  onOpenIncident: (id: string) => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

function Chips({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((n) => (
        <li key={n} className="rounded-md bg-secondary px-2 py-1 text-xs">
          {n}
        </li>
      ))}
    </ul>
  );
}

function LinkedRow({ incident, onOpen }: { incident: Incident; onOpen: () => void }) {
  return (
    <li className="rounded-lg border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <SeverityBadge severity={incident.severity} size="sm" />
        <span className="text-xs text-muted-foreground font-mono">{timeAgo(incident.created_at)}</span>
        {incident.duplicate_similarity != null && (
          <span className="text-xs text-muted-foreground">
            · similarity {Math.round(incident.duplicate_similarity * 100)}%
          </span>
        )}
        <Button size="sm" variant="ghost" className="ml-auto h-7" onClick={onOpen}>
          Open
        </Button>
      </div>
      <p className="mt-1 text-sm">{incident.summary ?? incident.raw_text}</p>
    </li>
  );
}

export function IncidentDetailSheet({ incidentId, onClose, onOpenIncident }: Props) {
  const { data, isLoading, isError, error } = useQuery({
    ...incidentDetailQuery(incidentId ?? ""),
    enabled: Boolean(incidentId),
  });
  const { updateMutation, reviewMutation } = useIncidentActions();
  const incident = data?.incident;
  const pendingStatus = updateMutation.isPending ? (updateMutation.variables?.status ?? null) : null;

  return (
    <Sheet open={Boolean(incidentId)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto border-l bg-surface p-0 sm:max-w-xl">
        {isLoading || !incident ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-muted-foreground">
            <SheetHeader className="sr-only">
              <SheetTitle>Incident details</SheetTitle>
              <SheetDescription>Loading incident</SheetDescription>
            </SheetHeader>
            {isError ? (
              <p role="alert" className="flex items-center gap-2 text-sev-critical">
                <AlertTriangle aria-hidden className="size-4" />
                {error instanceof Error ? error.message : "Couldn't load this incident."}
              </p>
            ) : (
              <>
                <Loader2 aria-hidden className="size-6 animate-spin" /> Loading incident…
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col">
            <SheetHeader className="space-y-3 border-b p-5 pr-12 text-left">
              <div className="flex flex-wrap items-center gap-2">
                <SeverityBadge severity={incident.severity} />
                <StatusBadge status={incident.status} />
                {incident.duplicate_of && (
                  <span className="rounded-sm border px-2 py-0.5 text-xs text-muted-foreground">Linked report</span>
                )}
              </div>
              <SheetTitle className="flex items-center gap-2 text-xl">
                <IncidentTypeIcon type={incident.incident_type} className="size-5 text-muted-foreground" />
                {incident.incident_type ? TYPE_LABEL[incident.incident_type] : "Unclassified incident"}
              </SheetTitle>
              <SheetDescription className="text-sm text-foreground/90">
                {incident.summary ?? "No summary available."}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6 p-5">
              {incident.status === "needs_review" && (
                <div className="space-y-3 rounded-md border border-status-review/60 bg-status-review/10 p-4">
                  <p className="flex items-center gap-2 font-semibold">
                    <GitMerge aria-hidden className="size-4 text-status-review" /> Possible duplicate
                  </p>
                  {data.suspectedOriginal && (
                    <p className="text-sm">
                      Suspected original: {data.suspectedOriginal.summary ?? data.suspectedOriginal.raw_text}
                    </p>
                  )}
                  {incident.duplicate_reason && (
                    <p className="text-xs text-muted-foreground">
                      Automated note: {incident.duplicate_reason}
                      {incident.duplicate_similarity != null &&
                        ` (similarity ${Math.round(incident.duplicate_similarity * 100)}%)`}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => reviewMutation.mutate({ id: incident.id, action: "merge" })}
                      disabled={reviewMutation.isPending || !incident.suspected_duplicate_of}
                    >
                      <GitMerge aria-hidden className="size-4" /> Merge
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => reviewMutation.mutate({ id: incident.id, action: "keep" })}
                      disabled={reviewMutation.isPending}
                    >
                      <Split aria-hidden className="size-4" /> Keep separate
                    </Button>
                  </div>
                </div>
              )}

              <Section title="Status">
                <StatusWorkflow
                  status={incident.status}
                  pending={pendingStatus}
                  onChange={(status) => updateMutation.mutate({ id: incident.id, status })}
                />
              </Section>

              <Section title="Severity">
                <div className="flex flex-wrap items-center gap-3">
                  <Select
                    value={incident.severity}
                    onValueChange={(v) => updateMutation.mutate({ id: incident.id, severity: v as Severity })}
                    disabled={updateMutation.isPending}
                  >
                    <SelectTrigger className="w-44" aria-label="Change severity">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[1200]">
                      {ALL_SEVERITIES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {SEVERITY_LABEL[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {incident.confidence != null && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      Automated summary · confidence {Math.round(incident.confidence * 100)}%
                    </span>
                  )}
                </div>
                {incident.severity_reason && <p className="text-sm text-muted-foreground">{incident.severity_reason}</p>}
              </Section>

              <Section title="Report">
                <blockquote className="rounded-lg border bg-background/40 p-3 text-sm leading-relaxed">
                  {incident.raw_text || <span className="text-muted-foreground">No text — photo report.</span>}
                </blockquote>
                <dl className="grid gap-2 text-sm sm:grid-cols-2">
                  <div className="flex items-start gap-2">
                    <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div>
                      <dt className="sr-only">Location</dt>
                      <dd>{incident.address_text ?? "No address given"}</dd>
                      {incident.latitude != null && incident.longitude != null && (
                        <dd className="text-xs text-muted-foreground">
                          {incident.latitude.toFixed(5)}, {incident.longitude.toFixed(5)}
                        </dd>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div>
                      <dt className="sr-only">Reported</dt>
                      <dd>
                        <time dateTime={incident.created_at}>{format(new Date(incident.created_at), "d MMM yyyy, HH:mm")}</time>
                      </dd>
                      <dd className="text-xs text-muted-foreground font-mono">{timeAgo(incident.created_at)}</dd>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users aria-hidden className="size-4 text-muted-foreground" />
                    <dt className="sr-only">People and reports</dt>
                    <dd>
                      {incident.people_affected != null ? `${incident.people_affected} people affected` : "People affected unknown"} ·{" "}
                      {incident.report_count} report{incident.report_count === 1 ? "" : "s"}
                    </dd>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone aria-hidden className="size-4 text-muted-foreground" />
                    <dt className="sr-only">Contact phone</dt>
                    <dd>
                      {incident.contact_phone ? (
                        <a href={`tel:${incident.contact_phone.replace(/[^+0-9]/g, "")}`} className="text-primary underline-offset-2 hover:underline">
                          {incident.contact_phone}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">No phone given</span>
                      )}
                    </dd>
                  </div>
                </dl>
                {incident.ai_status === "failed" && (
                  <p className="text-xs text-sev-high">Automated summary unavailable for this report — review it manually.</p>
                )}
              </Section>

              <div className="grid gap-6 sm:grid-cols-2">
                <Section title="Hazards">
                  <Chips items={incident.hazards} empty="None reported" />
                </Section>
                <Section title="Needs">
                  <Chips items={incident.needs} empty="None reported" />
                </Section>
              </div>

              <Section title="Photos">
                <PhotoGallery paths={incident.image_urls} />
              </Section>

              {incident.duplicate_of && data.suspectedOriginal && (
                <Section title="Linked to">
                  <ul>
                    <LinkedRow incident={data.suspectedOriginal} onOpen={() => onOpenIncident(data.suspectedOriginal!.id)} />
                  </ul>
                </Section>
              )}

              <Section title={`Linked duplicate reports (${data.duplicates.length})`}>
                {data.duplicates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No other reports linked.</p>
                ) : (
                  <ul className="space-y-2">
                    {data.duplicates.map((d) => (
                      <LinkedRow key={d.id} incident={d} onOpen={() => onOpenIncident(d.id)} />
                    ))}
                  </ul>
                )}
              </Section>

              <Section title="Activity log">
                <EventLog events={data.events} />
              </Section>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
