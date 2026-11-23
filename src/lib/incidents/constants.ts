export const SEVERITIES = ["critical", "high", "medium", "low"] as const;
export type ClassifiedSeverity = (typeof SEVERITIES)[number];
export type Severity = ClassifiedSeverity | "unclassified";
export const ALL_SEVERITIES: Severity[] = [...SEVERITIES, "unclassified"];

export const INCIDENT_TYPES = [
  "flood",
  "fire",
  "earthquake",
  "medical",
  "collapse",
  "other",
] as const;
export type IncidentType = (typeof INCIDENT_TYPES)[number];

export const STATUSES = ["new", "verified", "dispatched", "resolved", "needs_review"] as const;
export type IncidentStatus = (typeof STATUSES)[number];
/** The dispatcher workflow, in order. needs_review is set only by duplicate detection. */
export const WORKFLOW_STATUSES = ["new", "verified", "dispatched", "resolved"] as const;

export const SEVERITY_LABEL: Record<Severity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
  unclassified: "Unclassified",
};

export const TYPE_LABEL: Record<IncidentType, string> = {
  flood: "Flood",
  fire: "Fire",
  earthquake: "Earthquake",
  medical: "Medical",
  collapse: "Collapse",
  other: "Other",
};

export const STATUS_LABEL: Record<IncidentStatus, string> = {
  new: "New",
  verified: "Verified",
  dispatched: "Dispatched",
  resolved: "Resolved",
  needs_review: "Needs review",
};

export const TIME_RANGES = [
  { value: "1h", label: "Last hour", hours: 1 },
  { value: "6h", label: "Last 6 hours", hours: 6 },
  { value: "24h", label: "Last 24 hours", hours: 24 },
  { value: "all", label: "All time", hours: null },
] as const;
export type TimeRange = (typeof TIME_RANGES)[number]["value"];

/** Chennai city centre, used as the default map view. */
export const DEFAULT_CENTER: [number, number] = [13.0475, 80.2397];

export const MAX_PHOTOS = 3;
export const PHOTO_BUCKET = "incident-photos";
