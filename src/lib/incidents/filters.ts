import { TIME_RANGES, type IncidentStatus, type IncidentType, type Severity, type TimeRange } from "./constants";

export interface IncidentFilters {
  severity: Severity | "all";
  type: IncidentType | "all";
  status: IncidentStatus | "all" | "active";
  range: TimeRange;
  search?: string;
}

export const DEFAULT_FILTERS: IncidentFilters = { severity: "all", type: "all", status: "active", range: "all" };

interface Filterable {
  severity: Severity;
  incident_type: IncidentType | null;
  status: IncidentStatus;
  created_at: string;
  summary?: string | null;
  address_text?: string | null;
  raw_text?: string;
}

export function matchesFilters(item: Filterable, f: IncidentFilters, now: Date = new Date()): boolean {
  if (f.severity !== "all" && item.severity !== f.severity) return false;
  if (f.type !== "all" && item.incident_type !== f.type) return false;
  if (f.status === "active" && item.status === "resolved") return false;
  if (f.status !== "all" && f.status !== "active" && item.status !== f.status) return false;
  const hours = TIME_RANGES.find((r) => r.value === f.range)?.hours ?? null;
  if (hours != null && now.getTime() - new Date(item.created_at).getTime() > hours * 3_600_000) return false;
  const q = f.search?.trim().toLowerCase();
  if (q) {
    const haystack = [item.summary, item.address_text, item.raw_text, item.incident_type].join(" ").toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  return true;
}
