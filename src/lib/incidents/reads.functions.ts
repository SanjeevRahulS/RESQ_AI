import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { PHOTO_BUCKET } from "./constants";
import { requireStaff } from "@/lib/auth/staff-middleware";
import type { Incident, IncidentEvent } from "./types";

// Staff-only reads. Queries run as the signed-in user, so row-level security (admin/responder only)
// is enforced by the database as well as by the middleware.

export interface IncidentDetail {
  incident: Incident;
  duplicates: Incident[];
  suspectedOriginal: Incident | null;
  events: IncidentEvent[];
}

export const listIncidents = createServerFn({ method: "GET" })
  .middleware([requireStaff])
  .handler(async ({ context }): Promise<Incident[]> => {
  const { data, error } = await context.supabase
    .from("incidents")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) {
    console.error("Failed to list incidents", error);
    throw new Error("Incidents could not be loaded.");
  }
  return (data ?? []) as Incident[];
});

export const getIncidentDetail = createServerFn({ method: "GET" })
  .middleware([requireStaff])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<IncidentDetail> => {
    const db = context.supabase;
    const [incidentRes, dupRes, eventsRes] = await Promise.all([
      db.from("incidents").select("*").eq("id", data.id).is("deleted_at", null).single(),
      db.from("incidents").select("*").eq("duplicate_of", data.id).is("deleted_at", null).order("created_at"),
      db
        .from("incident_events")
        .select("*")
        .eq("incident_id", data.id)
        .order("created_at", { ascending: false }),
    ]);
    if (incidentRes.error || !incidentRes.data) throw new Error("Incident not found.");
    const incident = incidentRes.data as Incident;
    let suspectedOriginal: Incident | null = null;
    const originalId = incident.suspected_duplicate_of ?? incident.duplicate_of;
    if (originalId) {
      const { data: original } = await db.from("incidents").select("*").eq("id", originalId).maybeSingle();
      suspectedOriginal = (original as Incident | null) ?? null;
    }
    return {
      incident,
      duplicates: (dupRes.data ?? []) as Incident[],
      suspectedOriginal,
      events: (eventsRes.data ?? []) as IncidentEvent[],
    };
  });

const photoPath = z
  .string()
  .regex(/^reports\/[A-Za-z0-9_-]+\/[A-Za-z0-9_.-]+$/, "Invalid photo path")
  .max(200);

/** Short-lived viewing links, only for photos attached to a saved incident. */
export const getPhotoUrls = createServerFn({ method: "POST" })
  .middleware([requireStaff])
  .inputValidator((input: unknown) => z.object({ paths: z.array(photoPath).min(1).max(10) }).parse(input))
  .handler(async ({ data }): Promise<string[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: owners, error } = await supabaseAdmin
      .from("incidents")
      .select("image_urls")
      .overlaps("image_urls", data.paths)
      .limit(20);
    if (error) throw new Error("Photos could not be loaded.");
    const attached = new Set((owners ?? []).flatMap((o) => o.image_urls));
    const allowed = data.paths.filter((p) => attached.has(p));
    if (allowed.length === 0) return [];
    const { data: signed, error: signErr } = await supabaseAdmin.storage
      .from(PHOTO_BUCKET)
      .createSignedUrls(allowed, 3600);
    if (signErr) throw new Error("Photos could not be loaded.");
    return (signed ?? []).map((s) => s.signedUrl).filter((u): u is string => Boolean(u));
  });

const EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/gif": "gif",
} as const;
type PhotoType = keyof typeof EXTENSIONS;

const uploadSchema = z.object({
  files: z
    .array(
      z.object({
        contentType: z.enum(Object.keys(EXTENSIONS) as [PhotoType, ...PhotoType[]]),
        size: z.number().int().positive().max(8 * 1024 * 1024),
      }),
    )
    .min(1)
    .max(3),
});

/** One-time upload slots in a fresh folder; the browser cannot write anywhere else in storage. */
export const createPhotoUploads = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => uploadSchema.parse(input))
  .handler(async ({ data }): Promise<{ path: string; token: string }[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const folder = crypto.randomUUID();
    const slots: { path: string; token: string }[] = [];
    for (const [i, file] of data.files.entries()) {
      const path = `reports/${folder}/photo-${i + 1}.${EXTENSIONS[file.contentType]}`;
      const { data: slot, error } = await supabaseAdmin.storage.from(PHOTO_BUCKET).createSignedUploadUrl(path);
      if (error || !slot) {
        console.error("Failed to create photo upload slot", error);
        throw new Error("Photo upload could not be started. Please try again.");
      }
      slots.push({ path, token: slot.token });
    }
    return slots;
  });
