import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ALL_SEVERITIES,
  INCIDENT_TYPES,
  SEVERITY_LABEL,
  STATUSES,
  STATUS_LABEL,
  TIME_RANGES,
  TYPE_LABEL,
} from "@/lib/incidents/constants";
import type { IncidentFilters } from "@/lib/incidents/filters";
import { SEVERITY_ICON } from "./SeverityBadge";

const SEVERITY_TEXT = {
  critical: "text-sev-critical",
  high: "text-sev-high",
  medium: "text-sev-medium",
  low: "text-sev-low",
  unclassified: "text-sev-unclassified",
} as const;

interface Props {
  value: IncidentFilters;
  onChange: (f: IncidentFilters) => void;
  idPrefix: string;
  hideStatuses?: string[];
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-[140px] flex-1 flex-col gap-1">
      <label htmlFor={id} className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

export function IncidentFilterControls({ value, onChange, idPrefix, hideStatuses = [] }: Props) {
  const set = (patch: Partial<IncidentFilters>) => onChange({ ...value, ...patch });
  return (
    <>
      <Field id={`${idPrefix}-severity`} label="Severity">
        <Select value={value.severity} onValueChange={(v) => set({ severity: v as IncidentFilters["severity"] })}>
          <SelectTrigger id={`${idPrefix}-severity`} className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-[1200]">
            <SelectItem value="all">All severities</SelectItem>
            {ALL_SEVERITIES.map((s) => {
              const Icon = SEVERITY_ICON[s];
              return (
                <SelectItem key={s} value={s}>
                  <span className="flex items-center gap-2">
                    <Icon aria-hidden className={`size-4 ${SEVERITY_TEXT[s]}`} /> {SEVERITY_LABEL[s]}
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </Field>
      <Field id={`${idPrefix}-type`} label="Type">
        <Select value={value.type} onValueChange={(v) => set({ type: v as IncidentFilters["type"] })}>
          <SelectTrigger id={`${idPrefix}-type`} className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-[1200]">
            <SelectItem value="all">All types</SelectItem>
            {INCIDENT_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {TYPE_LABEL[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field id={`${idPrefix}-status`} label="Status">
        <Select value={value.status} onValueChange={(v) => set({ status: v as IncidentFilters["status"] })}>
          <SelectTrigger id={`${idPrefix}-status`} className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-[1200]">
            <SelectItem value="active">Active (not resolved)</SelectItem>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.filter((s) => !hideStatuses.includes(s)).map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field id={`${idPrefix}-range`} label="Time">
        <Select value={value.range} onValueChange={(v) => set({ range: v as IncidentFilters["range"] })}>
          <SelectTrigger id={`${idPrefix}-range`} className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-[1200]">
            {TIME_RANGES.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </>
  );
}
