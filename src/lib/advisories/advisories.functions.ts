import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { SEVERITIES } from "@/lib/incidents/constants";
import { requireAdmin } from "@/lib/auth/staff-middleware";
import type { Advisory } from "./rules";

// Admin-only advisory management, queried as the signed-in admin so row-level security applies.
// The public banner reads active advisories directly (anyone may read unexpired rows).

const COLUMNS = "id, created_at, updated_at, title, message, severity, area, expires_at, created_by";

/** Admins: every advisory, including expired ones, newest first. */
export const listAllAdvisories = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }): Promise<Advisory[]> => {
    const { data, error } = await context.supabase
      .from("advisories")
      .select(COLUMNS)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      console.error("Failed to list advisories", error);
      throw new Error("Advisories could not be loaded.");
    }
    return (data ?? []) as Advisory[];
  });

const saveSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1, "Add a title.").max(120),
  message: z.string().trim().min(1, "Add a message.").max(600),
  severity: z.enum(SEVERITIES),
  area: z.string().trim().max(120).nullable(),
  expires_at: z.string().datetime({ offset: true }).nullable(),
});

/** Admins: create a new advisory, or edit an existing one when `id` is given. */
export const saveAdvisory = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: unknown) => saveSchema.parse(input))
  .handler(async ({ data, context }) => {
    const fields = {
      title: data.title,
      message: data.message,
      severity: data.severity,
      area: data.area || null,
      expires_at: data.expires_at,
    };
    const { error } = data.id
      ? await context.supabase.from("advisories").update(fields).eq("id", data.id)
      : await context.supabase.from("advisories").insert({ ...fields, created_by: context.actor });
    if (error) {
      console.error("Failed to save advisory", error);
      throw new Error("The advisory could not be saved.");
    }
    return { ok: true };
  });

/** Admins: take an advisory down now. Advisories are never deleted. */
export const expireAdvisory = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("advisories")
      .update({ expires_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) {
      console.error("Failed to expire advisory", error);
      throw new Error("The advisory could not be expired.");
    }
    return { ok: true };
  });
