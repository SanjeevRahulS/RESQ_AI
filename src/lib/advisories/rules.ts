import type { ClassifiedSeverity } from "@/lib/incidents/constants";

export interface Advisory {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  message: string;
  severity: ClassifiedSeverity;
  area: string | null;
  expires_at: string | null;
  created_by: string;
}

/** An advisory is public until its expiry time; no expiry means it stays up until an admin expires it. */
export function isAdvisoryActive(advisory: Pick<Advisory, "expires_at">, now: Date = new Date()): boolean {
  return advisory.expires_at == null || new Date(advisory.expires_at).getTime() > now.getTime();
}

const RANK: Record<ClassifiedSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3 };

/** Active advisories, most severe first, then newest first. */
export function activeAdvisories<T extends Pick<Advisory, "expires_at" | "severity" | "created_at">>(
  list: T[],
  now: Date = new Date(),
): T[] {
  return list
    .filter((a) => isAdvisoryActive(a, now))
    .sort((a, b) => RANK[a.severity] - RANK[b.severity] || b.created_at.localeCompare(a.created_at));
}
