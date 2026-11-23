import { ALL_SEVERITIES, type Severity } from "./constants";
import { averageResolveHours } from "./rules";

interface StatInput {
  severity: Severity;
  status: string;
  duplicate_of: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface DashboardStats {
  active: number;
  critical: number;
  needsReview: number;
  avgResolveHours: number | null;
  bySeverity: Record<Severity, number>;
}

/** Counts primary incidents only: linked duplicate reports are folded into their original. */
export function computeStats(items: StatInput[]): DashboardStats {
  const primary = items.filter((i) => i.duplicate_of == null);
  const active = primary.filter((i) => i.status !== "resolved");
  const bySeverity = Object.fromEntries(ALL_SEVERITIES.map((s) => [s, 0])) as Record<Severity, number>;
  for (const i of active) bySeverity[i.severity] += 1;
  return {
    active: active.length,
    critical: bySeverity.critical,
    needsReview: primary.filter((i) => i.status === "needs_review").length,
    avgResolveHours: averageResolveHours(primary.filter((i) => i.status === "resolved")),
    bySeverity,
  };
}
