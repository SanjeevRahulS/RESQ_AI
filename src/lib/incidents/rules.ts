import { SEVERITIES, type ClassifiedSeverity, type Severity } from "./constants";

/** Duplicate detection window and thresholds. */
export const DUPLICATE_RADIUS_METERS = 300;
export const DUPLICATE_WINDOW_HOURS = 6;
export const LINK_THRESHOLD = 0.75;
export const REVIEW_THRESHOLD = 0.5;
export const ESCALATION_REPORT_COUNT = 3;
export const ESCALATION_REASON = "Multiple independent reports";

const EARTH_RADIUS_M = 6_371_000;

/** Great-circle distance in metres between two lat/lng points. */
export function haversineMeters(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export interface CandidateInput {
  id: string;
  incident_type: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  status: string;
  duplicate_of: string | null;
}

/** Filters to incidents that could be duplicates of `report` (same type, ≤300 m, last 6 h, not resolved). */
export function findDuplicateCandidates<T extends CandidateInput>(
  report: CandidateInput,
  others: T[],
  now: Date = new Date(),
): Array<T & { distance_m: number }> {
  if (!report.incident_type || report.latitude == null || report.longitude == null) return [];
  const since = now.getTime() - DUPLICATE_WINDOW_HOURS * 3_600_000;
  const origin = { latitude: report.latitude, longitude: report.longitude };
  return others
    .filter(
      (o) =>
        o.id !== report.id &&
        o.duplicate_of == null &&
        o.incident_type === report.incident_type &&
        o.status !== "resolved" &&
        o.latitude != null &&
        o.longitude != null &&
        new Date(o.created_at).getTime() >= since,
    )
    .map((o) => ({
      ...o,
      distance_m: haversineMeters(origin, { latitude: o.latitude!, longitude: o.longitude! }),
    }))
    .filter((o) => o.distance_m <= DUPLICATE_RADIUS_METERS)
    .sort((a, b) => a.distance_m - b.distance_m);
}

export type DuplicateDecision = "link" | "review" | "new";

/** Maps an AI comparison to an action. Uncertain (is_duplicate false) can never auto-link. */
export function decideDuplicate(result: { is_duplicate: boolean; similarity: number }): DuplicateDecision {
  const s = Math.max(0, Math.min(1, result.similarity));
  if (result.is_duplicate && s >= LINK_THRESHOLD) return "link";
  if (s >= REVIEW_THRESHOLD) return "review";
  return "new";
}

/** Raises severity one level, capped at critical. Unclassified becomes low. */
export function raiseSeverity(severity: Severity): ClassifiedSeverity {
  if (severity === "unclassified") return "low";
  const idx = SEVERITIES.indexOf(severity);
  return SEVERITIES[Math.max(0, idx - 1)]!;
}

/** True when linking a report moves the count to exactly the escalation threshold. */
export function shouldEscalate(previousCount: number, nextCount: number): boolean {
  return previousCount < ESCALATION_REPORT_COUNT && nextCount >= ESCALATION_REPORT_COUNT;
}

/** Lower rank = more urgent. */
export function severityRank(severity: Severity): number {
  const order: Severity[] = ["critical", "high", "medium", "low", "unclassified"];
  return order.indexOf(severity);
}

/** Queue order: most severe first, then oldest first. */
export function compareQueue(
  a: { severity: Severity; created_at: string },
  b: { severity: Severity; created_at: string },
): number {
  const bySeverity = severityRank(a.severity) - severityRank(b.severity);
  if (bySeverity !== 0) return bySeverity;
  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
}

/** Average hours from report to resolution for resolved incidents; null when none. */
export function averageResolveHours(
  items: Array<{ created_at: string; resolved_at: string | null }>,
): number | null {
  const durations = items
    .filter((i) => i.resolved_at)
    .map((i) => new Date(i.resolved_at!).getTime() - new Date(i.created_at).getTime())
    .filter((ms) => ms >= 0);
  if (durations.length === 0) return null;
  return durations.reduce((s, d) => s + d, 0) / durations.length / 3_600_000;
}

/** Trims to a word limit, used for the AI summary (max 25 words). */
export function limitWords(text: string, max = 25): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length <= max ? words.join(" ") : words.slice(0, max).join(" ");
}
