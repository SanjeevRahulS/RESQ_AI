import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  ALL_SEVERITIES,
  INCIDENT_TYPES,
  PHOTO_BUCKET,
  WORKFLOW_STATUSES,
  type Severity,
} from "./constants";
import type { ExtractedFields } from "./types";
import { requireStaff } from "@/lib/auth/staff-middleware";
import type { Database } from "@/integrations/supabase/types";

type IncidentUpdate = Database["public"]["Tables"]["incidents"]["Update"];

// submitReport/confirmReport are public so anonymous reporters can send reports; every input is
// validated and only whitelisted fields are written. Dashboard actions require command staff and
// record the signed-in staff email as the actor.

const photoPath = z
  .string()
  .regex(/^reports\/[A-Za-z0-9_-]+\/[A-Za-z0-9_.-]+$/, "Invalid photo path")
  .max(200);

const submitSchema = z
  .object({
    raw_text: z.string().trim().max(5000),
    image_paths: z.array(photoPath).max(3),
    latitude: z.number().min(-90).max(90).nullable(),
    longitude: z.number().min(-180).max(180).nullable(),
    address_text: z.string().trim().max(300).nullable(),
    contact_phone: z
      .string()
      .trim()
      .max(30)
      .regex(/^[+0-9 ()-]*$/, "Phone number can contain digits, spaces, +, ( ) and -")
      .nullable(),
  })
  .refine((v) => v.raw_text.length > 0 || v.image_paths.length > 0, {
    message: "Add a description or at least one photo.",
  });

export type SubmitReportInput = z.infer<typeof submitSchema>;

export interface SubmitReportResult {
  id: string;
  aiOk: boolean;
  extracted: ExtractedFields;
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/** Saves the raw report first (so it is never lost), then asks the AI to extract and classify it. */
export const submitReport = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => submitSchema.parse(input))
  .handler(async ({ data }): Promise<SubmitReportResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row, error } = await supabaseAdmin
      .from("incidents")
      .insert({
        raw_text: data.raw_text,
        image_urls: data.image_paths,
        latitude: data.latitude,
        longitude: data.longitude,
        address_text: data.address_text || null,
        contact_phone: data.contact_phone || null,
        severity: "unclassified",
        ai_status: "pending",
      })
      .select("id")
      .single();
    if (error || !row) {
      console.error("Failed to save report", error);
      throw new Error("We couldn't save your report. Please try again.");
    }

    const unclassified: ExtractedFields = {
      incident_type: null,
      people_affected: null,
      hazards: [],
      needs: [],
      severity: "unclassified",
      severity_reason: null,
      confidence: null,
      summary: null,
    };

    try {
      const { extractIncident } = await import("@/lib/ai/incident-ai.server");
      const images = [];
      for (const path of data.image_paths) {
        const { data: blob, error: dlErr } = await supabaseAdmin.storage.from(PHOTO_BUCKET).download(path);
        if (dlErr || !blob) continue;
        const bytes = new Uint8Array(await blob.arrayBuffer());
        images.push({ dataUrl: `data:${blob.type || "image/jpeg"};base64,${toBase64(bytes)}` });
      }
      const extracted = await extractIncident({
        rawText: data.raw_text,
        addressText: data.address_text,
        images,
      });
      await supabaseAdmin
        .from("incidents")
        .update({ ...extracted, ai_status: "classified" })
        .eq("id", row.id);
      return { id: row.id, aiOk: true, extracted };
    } catch (aiError) {
      console.error("AI extraction failed; report saved as unclassified", aiError);
      await supabaseAdmin.from("incidents").update({ ai_status: "failed" }).eq("id", row.id);
      return { id: row.id, aiOk: false, extracted: unclassified };
    }
  });

const listSchema = z.array(z.string().trim().min(1).max(80)).max(10);

const confirmSchema = z.object({
  id: z.string().uuid(),
  fields: z.object({
    incident_type: z.enum(INCIDENT_TYPES).nullable(),
    people_affected: z.number().int().min(0).max(1_000_000).nullable(),
    hazards: listSchema,
    needs: listSchema,
    severity: z.enum(ALL_SEVERITIES as [Severity, ...Severity[]]),
    severity_reason: z.string().trim().max(300).nullable(),
    confidence: z.number().min(0).max(1).nullable(),
    summary: z.string().trim().max(400).nullable(),
  }),
});

/** Applies the reporter's edits, then runs duplicate detection. Reveals nothing about other reports. */
export const confirmReport = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => confirmSchema.parse(input))
  .handler(async ({ data }): Promise<{ outcome: "received" | "linked" }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: existing, error: readErr } = await supabaseAdmin
      .from("incidents")
      .select("id, reporter_confirmed")
      .eq("id", data.id)
      .single();
    if (readErr || !existing) throw new Error("Report not found.");
    if (existing.reporter_confirmed) return { outcome: "received" };

    const { error } = await supabaseAdmin
      .from("incidents")
      .update({ ...data.fields, reporter_confirmed: true })
      .eq("id", data.id);
    if (error) throw new Error("We couldn't save your changes. Your original report is still saved.");

    try {
      const { runDuplicateCheck } = await import("./dedupe.server");
      return { outcome: await runDuplicateCheck(supabaseAdmin, data.id) };
    } catch (dedupeError) {
      console.error("Duplicate check failed; report kept as new", dedupeError);
      return { outcome: "received" };
    }
  });

const updateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(WORKFLOW_STATUSES).optional(),
  severity: z.enum(ALL_SEVERITIES as [Severity, ...Severity[]]).optional(),
});

/** Dashboard: change status and/or severity, logging every change. */
export const updateIncident = createServerFn({ method: "POST" })
  .middleware([requireStaff])
  .inputValidator((input: unknown) => updateSchema.parse(input))
  .handler(async ({ data, context }) => {
    const actor = context.actor;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { logEvent } = await import("./dedupe.server");

    const { data: current, error } = await supabaseAdmin
      .from("incidents")
      .select("id, status, severity")
      .eq("id", data.id)
      .single();
    if (error || !current) throw new Error("Incident not found.");

    const patch: IncidentUpdate = {};
    if (data.status && data.status !== current.status) {
      patch.status = data.status;
      patch.resolved_at = data.status === "resolved" ? new Date().toISOString() : null;
    }
    if (data.severity && data.severity !== current.severity) {
      patch.severity = data.severity;
      patch.severity_reason = `Set by ${actor}`;
    }
    if (Object.keys(patch).length === 0) return { changed: false };

    const { error: updErr } = await supabaseAdmin.from("incidents").update(patch).eq("id", data.id);
    if (updErr) throw new Error("Update failed. Please try again.");

    if (patch.status) {
      await logEvent(supabaseAdmin, {
        incident_id: data.id,
        actor: actor,
        event_type: "status_change",
        from_value: current.status,
        to_value: data.status!,
      });
    }
    if (patch.severity) {
      await logEvent(supabaseAdmin, {
        incident_id: data.id,
        actor: actor,
        event_type: "severity_change",
        from_value: current.severity,
        to_value: data.severity!,
      });
    }
    return { changed: true };
  });

const reviewSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(["merge", "keep"]),
});

/** Dashboard "Needs review": merge into the suspected original, or keep as a separate incident. */
export const resolveReview = createServerFn({ method: "POST" })
  .middleware([requireStaff])
  .inputValidator((input: unknown) => reviewSchema.parse(input))
  .handler(async ({ data, context }) => {
    const actor = context.actor;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { linkAsDuplicate, logEvent } = await import("./dedupe.server");

    const { data: report, error } = await supabaseAdmin
      .from("incidents")
      .select("id, status, suspected_duplicate_of, duplicate_similarity, duplicate_reason")
      .eq("id", data.id)
      .single();
    if (error || !report) throw new Error("Incident not found.");
    if (report.status !== "needs_review") throw new Error("This incident is no longer awaiting review.");

    if (data.action === "merge") {
      if (!report.suspected_duplicate_of) throw new Error("No suspected original to merge into.");
      await linkAsDuplicate(supabaseAdmin, report.id, report.suspected_duplicate_of, {
        similarity: report.duplicate_similarity,
        reason: report.duplicate_reason,
        actor: actor,
        statusAfter: "new",
      });
      await logEvent(supabaseAdmin, {
        incident_id: report.id,
        actor: actor,
        event_type: "review_merged",
        from_value: "needs_review",
        to_value: "new",
        note: "Merged into existing incident",
      });
      return { ok: true };
    }

    const { error: keepErr } = await supabaseAdmin
      .from("incidents")
      .update({ status: "new", suspected_duplicate_of: null })
      .eq("id", report.id);
    if (keepErr) throw new Error("Update failed. Please try again.");
    await logEvent(supabaseAdmin, {
      incident_id: report.id,
      actor: actor,
      event_type: "review_kept_separate",
      from_value: "needs_review",
      to_value: "new",
      note: "Kept as a separate incident",
    });
    return { ok: true };
  });
