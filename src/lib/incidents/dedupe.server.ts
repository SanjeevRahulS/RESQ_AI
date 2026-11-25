// Server-only duplicate detection. Loaded from server function handlers with a dynamic import.
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";
import { compareIncidents } from "@/lib/ai/incident-ai.server";
import {
  DUPLICATE_WINDOW_HOURS,
  ESCALATION_REASON,
  decideDuplicate,
  findDuplicateCandidates,
  raiseSeverity,
  shouldEscalate,
} from "./rules";
import type { Severity } from "./constants";

type Admin = SupabaseClient<Database>;

export type DedupeOutcome = "received" | "linked";

const MAX_AI_COMPARISONS = 3;

function describe(row: { summary: string | null; raw_text: string; address_text: string | null }) {
  const body = row.summary?.trim() || row.raw_text.slice(0, 600);
  return row.address_text ? `${body} (Location: ${row.address_text})` : body;
}

export async function logEvent(
  admin: Admin,
  event: {
    incident_id: string;
    actor: string;
    event_type: string;
    from_value?: string | null;
    to_value?: string | null;
    note?: string | null;
  },
) {
  const { error } = await admin.from("incident_events").insert({
    incident_id: event.incident_id,
    actor: event.actor,
    event_type: event.event_type,
    from_value: event.from_value ?? null,
    to_value: event.to_value ?? null,
    note: event.note ?? null,
  });
  if (error) console.error("Failed to log incident event", error);
}

/** Links `reportId` to `originalId`, bumps the original's report_count and escalates at 3 reports. */
export async function linkAsDuplicate(
  admin: Admin,
  reportId: string,
  originalId: string,
  details: { similarity: number | null; reason: string | null; actor: string; statusAfter?: string },
) {
  const { data: original, error: origErr } = await admin
    .from("incidents")
    .select("id, report_count, severity")
    .eq("id", originalId)
    .single();
  if (origErr || !original) throw new Error("Original incident not found");

  const { error: linkErr } = await admin
    .from("incidents")
    .update({
      duplicate_of: originalId,
      suspected_duplicate_of: null,
      duplicate_similarity: details.similarity,
      duplicate_reason: details.reason,
      ...(details.statusAfter ? { status: details.statusAfter } : {}),
    })
    .eq("id", reportId);
  if (linkErr) throw linkErr;

  const nextCount = original.report_count + 1;
  const escalate = shouldEscalate(original.report_count, nextCount);
  const prevSeverity = original.severity as Severity;
  const nextSeverity = escalate ? raiseSeverity(prevSeverity) : prevSeverity;

  const { error: countErr } = await admin
    .from("incidents")
    .update({
      report_count: nextCount,
      ...(escalate ? { severity: nextSeverity, severity_reason: ESCALATION_REASON } : {}),
    })
    .eq("id", originalId);
  if (countErr) throw countErr;

  await logEvent(admin, {
    incident_id: originalId,
    actor: details.actor,
    event_type: "linked_duplicate",
    to_value: reportId,
    note:
      details.similarity != null
        ? `Report linked (similarity ${details.similarity.toFixed(2)}); report count now ${nextCount}`
        : `Report linked; report count now ${nextCount}`,
  });
  await logEvent(admin, {
    incident_id: reportId,
    actor: details.actor,
    event_type: "marked_duplicate",
    to_value: originalId,
    note: details.reason,
  });
  if (escalate && nextSeverity !== prevSeverity) {
    await logEvent(admin, {
      incident_id: originalId,
      actor: "System",
      event_type: "severity_change",
      from_value: prevSeverity,
      to_value: nextSeverity,
      note: ESCALATION_REASON,
    });
  }
}

/** Runs duplicate detection for a confirmed report. Never deletes anything. */
export async function runDuplicateCheck(admin: Admin, reportId: string): Promise<DedupeOutcome> {
  const { data: report, error } = await admin.from("incidents").select("*").eq("id", reportId).single();
  if (error || !report) throw new Error("Report not found");
  if (!report.incident_type || report.latitude == null || report.longitude == null) return "received";

  // Coarse bounding box (~450 m) in SQL, exact Haversine radius in code.
  const since = new Date(Date.now() - DUPLICATE_WINDOW_HOURS * 3_600_000).toISOString();
  const { data: nearby, error: nearbyErr } = await admin
    .from("incidents")
    .select("id, incident_type, latitude, longitude, created_at, status, duplicate_of, summary, raw_text, address_text")
    .eq("incident_type", report.incident_type)
    .neq("status", "resolved")
    .neq("id", report.id)
    .is("duplicate_of", null)
    .is("deleted_at", null)
    .gte("created_at", since)
    .gte("latitude", report.latitude - 0.004)
    .lte("latitude", report.latitude + 0.004)
    .gte("longitude", report.longitude - 0.0045)
    .lte("longitude", report.longitude + 0.0045)
    .limit(50);
  if (nearbyErr) throw nearbyErr;

  const candidates = findDuplicateCandidates(report, nearby ?? []).slice(0, MAX_AI_COMPARISONS);
  if (candidates.length === 0) return "received";

  let best: { id: string; similarity: number; reason: string; decision: "link" | "review" } | null = null;
  for (const candidate of candidates) {
    let comparison;
    try {
      comparison = await compareIncidents(describe(candidate), describe(report));
    } catch (aiError) {
      console.error("Duplicate comparison failed; treating as new", aiError);
      continue;
    }
    const decision = decideDuplicate(comparison);
    if (decision === "new") continue;
    const rank = (d: "link" | "review") => (d === "link" ? 2 : 1);
    if (
      !best ||
      rank(decision) > rank(best.decision) ||
      (rank(decision) === rank(best.decision) && comparison.similarity > best.similarity)
    ) {
      best = { id: candidate.id, similarity: comparison.similarity, reason: comparison.reason, decision };
    }
  }

  if (!best) return "received";

  if (best.decision === "link") {
    await linkAsDuplicate(admin, report.id, best.id, {
      similarity: best.similarity,
      reason: best.reason,
      actor: "System",
    });
    return "linked";
  }

  const { error: reviewErr } = await admin
    .from("incidents")
    .update({
      status: "needs_review",
      suspected_duplicate_of: best.id,
      duplicate_similarity: best.similarity,
      duplicate_reason: best.reason,
    })
    .eq("id", report.id);
  if (reviewErr) throw reviewErr;
  await logEvent(admin, {
    incident_id: report.id,
    actor: "System",
    event_type: "status_change",
    from_value: report.status,
    to_value: "needs_review",
    note: `Possible duplicate (similarity ${best.similarity.toFixed(2)})`,
  });
  return "received";
}
