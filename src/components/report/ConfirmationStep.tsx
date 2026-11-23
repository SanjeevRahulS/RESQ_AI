import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

import { IncidentTypeIcon } from "@/components/incidents/IncidentTypeIcon";
import { SeverityBadge } from "@/components/incidents/SeverityBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  INCIDENT_TYPES,
  SEVERITIES,
  SEVERITY_LABEL,
  TYPE_LABEL,
  type IncidentType,
  type Severity,
} from "@/lib/incidents/constants";
import type { ExtractedFields } from "@/lib/incidents/types";

interface Props {
  aiOk: boolean;
  initial: ExtractedFields;
  confirming: boolean;
  error: string | null;
  onConfirm: (fields: ExtractedFields) => void;
}

const toList = (v: string) =>
  v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 10);

export function ConfirmationStep({ aiOk, initial, confirming, error, onConfirm }: Props) {
  const [fields, setFields] = useState(initial);
  const [hazards, setHazards] = useState(initial.hazards.join(", "));
  const [needs, setNeeds] = useState(initial.needs.join(", "));
  const [people, setPeople] = useState(initial.people_affected?.toString() ?? "");
  const set = (patch: Partial<ExtractedFields>) => setFields((f) => ({ ...f, ...patch }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = people.trim() === "" ? null : Number.parseInt(people, 10);
    onConfirm({
      ...fields,
      people_affected: n != null && Number.isFinite(n) && n >= 0 ? n : null,
      hazards: toList(hazards),
      needs: toList(needs),
      summary: fields.summary?.trim() || null,
      severity_reason: fields.severity_reason?.trim() || null,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-5" aria-labelledby="confirm-heading">
      <div className="flex items-start gap-3 rounded-md border border-sev-low/50 bg-sev-low/10 p-4">
        <CheckCircle2 aria-hidden className="mt-0.5 size-5 shrink-0 text-sev-low" />
        <div>
          <p className="font-semibold">Your report has been saved.</p>
          <p className="text-sm text-muted-foreground">Check the details below, fix anything that's wrong, then confirm.</p>
        </div>
      </div>

      {!aiOk && (
        <div role="status" className="flex items-start gap-3 rounded-md border border-sev-high/60 bg-sev-high/10 p-4">
          <AlertTriangle aria-hidden className="mt-0.5 size-5 shrink-0 text-sev-high" />
          <div>
            <p className="font-semibold">Automatic classification is unavailable right now.</p>
            <p className="text-sm text-muted-foreground">
              Your report was saved as <strong>Unclassified</strong> and responders will review it. You can fill in the
              details yourself below.
            </p>
          </div>
        </div>
      )}

      <section className="space-y-4 rounded-md border bg-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="confirm-heading" className="flex items-center gap-2 text-lg font-semibold">
            {aiOk ? "Automated summary, verified by staff" : "Report details"}
          </h2>
          <SeverityBadge severity={fields.severity} size="lg" />
        </div>
        {aiOk && fields.confidence != null && (
          <p className="text-xs text-muted-foreground">Automated summary, verified by staff · confidence {Math.round(fields.confidence * 100)}%</p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="c-type">Incident type</Label>
            <Select
              value={fields.incident_type ?? "unknown"}
              onValueChange={(v) => set({ incident_type: v === "unknown" ? null : (v as IncidentType) })}
            >
              <SelectTrigger id="c-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unknown">Unknown</SelectItem>
                {INCIDENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    <span className="flex items-center gap-2">
                      <IncidentTypeIcon type={t} /> {TYPE_LABEL[t]}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-severity">Severity</Label>
            <Select value={fields.severity} onValueChange={(v) => set({ severity: v as Severity })}>
              <SelectTrigger id="c-severity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[...SEVERITIES, ...(fields.severity === "unclassified" || !aiOk ? (["unclassified"] as const) : [])].map(
                  (s) => (
                    <SelectItem key={s} value={s}>
                      {SEVERITY_LABEL[s]}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-people">People affected</Label>
            <Input
              id="c-people"
              type="number"
              inputMode="numeric"
              min={0}
              value={people}
              onChange={(e) => setPeople(e.target.value)}
              placeholder="Unknown"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-hazards">Hazards</Label>
            <Input id="c-hazards" value={hazards} onChange={(e) => setHazards(e.target.value)} placeholder="Comma separated" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="c-needs">Needs</Label>
            <Input id="c-needs" value={needs} onChange={(e) => setNeeds(e.target.value)} placeholder="e.g. ambulance, boat rescue" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="c-summary">Summary</Label>
            <Textarea
              id="c-summary"
              rows={2}
              maxLength={400}
              value={fields.summary ?? ""}
              onChange={(e) => set({ summary: e.target.value })}
              placeholder="Short summary of the situation"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="c-reason">Why this severity</Label>
            <Input
              id="c-reason"
              maxLength={300}
              value={fields.severity_reason ?? ""}
              onChange={(e) => set({ severity_reason: e.target.value })}
              placeholder="One sentence"
            />
          </div>
        </div>
      </section>

      <div aria-live="assertive">
        {error && (
          <p role="alert" className="rounded-lg border border-sev-critical/60 bg-sev-critical/10 p-3 text-sm">
            {error} Your report is already saved — press Confirm to try again.
          </p>
        )}
      </div>

      <Button type="submit" size="lg" className="h-12 w-full text-base font-semibold" disabled={confirming}>
        {confirming ? <Loader2 aria-hidden className="size-5 animate-spin" /> : <CheckCircle2 aria-hidden className="size-5" />}
        {confirming ? "Confirming…" : "Confirm report"}
      </Button>
    </form>
  );
}
