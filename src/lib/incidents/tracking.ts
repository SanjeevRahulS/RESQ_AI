// Pure helpers for public report tracking. The public page may show only the status, the last
// update time and a general area — never contact details, photos or exact coordinates.
import type { IncidentStatus } from "./constants";

/** No 0/O, 1/I/L, so codes read back clearly over the phone. */
export const TRACKING_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const TRACKING_PREFIX = "RQ-";
export const TRACKING_LENGTH = 5;

const CODE_PATTERN = new RegExp(`^RQ-[${TRACKING_ALPHABET}]{${TRACKING_LENGTH}}$`);

/** e.g. RQ-7K3M9. `randomValues` is injectable for tests. */
export function generateTrackingCode(
  randomValues: (arr: Uint32Array<ArrayBuffer>) => Uint32Array<ArrayBuffer> = (arr) => crypto.getRandomValues(arr),
): string {
  const values = randomValues(new Uint32Array(new ArrayBuffer(TRACKING_LENGTH * 4)));
  let body = "";
  for (const v of values) body += TRACKING_ALPHABET[v % TRACKING_ALPHABET.length];
  return TRACKING_PREFIX + body;
}

/** Accepts "rq-7k3m9", "RQ 7K3M9", "7K3M9"; returns the canonical code or null if it can't be one. */
export function normalizeTrackingCode(input: string): string | null {
  const compact = input.toUpperCase().replace(/[\s-]/g, "");
  const body = compact.startsWith("RQ") && compact.length === TRACKING_LENGTH + 2 ? compact.slice(2) : compact;
  const code = TRACKING_PREFIX + body;
  return CODE_PATTERN.test(code) ? code : null;
}

export const PUBLIC_STATUSES = ["received", "verified", "dispatched", "resolved"] as const;
export type PublicStatus = (typeof PUBLIC_STATUSES)[number];

export const PUBLIC_STATUS_LABEL: Record<PublicStatus, string> = {
  received: "Received",
  verified: "Verified",
  dispatched: "Dispatched",
  resolved: "Resolved",
};

/** Internal review states are shown to the public as simply "received". */
export function publicStatus(status: IncidentStatus | string): PublicStatus {
  if (status === "verified" || status === "dispatched" || status === "resolved") return status;
  return "received";
}

/**
 * A neighbourhood-level description: drops address parts containing digits (house/street numbers,
 * PIN codes) and keeps the last two remaining parts. Falls back to coordinates rounded to ~1 km.
 */
export function generalArea(address: string | null, lat: number | null, lng: number | null): string | null {
  const parts = (address ?? "")
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && !/\d/.test(p));
  if (parts.length > 0) return parts.slice(-2).join(", ");
  if (lat != null && lng != null) return `Near ${lat.toFixed(2)}, ${lng.toFixed(2)}`;
  return null;
}
