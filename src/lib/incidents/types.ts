import type { IncidentStatus, IncidentType, Severity } from "./constants";

export interface Incident {
  id: string;
  created_at: string;
  updated_at: string;
  raw_text: string;
  image_urls: string[];
  latitude: number | null;
  longitude: number | null;
  address_text: string | null;
  contact_phone: string | null;
  incident_type: IncidentType | null;
  people_affected: number | null;
  hazards: string[];
  needs: string[];
  severity: Severity;
  severity_reason: string | null;
  confidence: number | null;
  summary: string | null;
  ai_status: "pending" | "classified" | "failed";
  reporter_confirmed: boolean;
  status: IncidentStatus;
  report_count: number;
  duplicate_of: string | null;
  suspected_duplicate_of: string | null;
  duplicate_similarity: number | null;
  duplicate_reason: string | null;
  resolved_at: string | null;
}

export interface IncidentEvent {
  id: string;
  incident_id: string;
  created_at: string;
  actor: string;
  event_type: string;
  from_value: string | null;
  to_value: string | null;
  note: string | null;
}

/** Fields the AI extracts and the reporter can edit before confirming. */
export interface ExtractedFields {
  incident_type: IncidentType | null;
  people_affected: number | null;
  hazards: string[];
  needs: string[];
  severity: Severity;
  severity_reason: string | null;
  confidence: number | null;
  summary: string | null;
}
