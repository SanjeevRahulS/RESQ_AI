import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireAdmin, requireStaff } from "@/lib/auth/staff-middleware";
import { FACILITY_TYPES, type Facility } from "./constants";

// Shelters, hospitals and relief camps. Staff can view (Live Map layer); only admins add or edit.
// Queries run as the signed-in user so row-level security applies too.

const COLUMNS = "id, name, type, latitude, longitude, capacity, contact, updated_at";

export const listFacilities = createServerFn({ method: "GET" })
  .middleware([requireStaff])
  .handler(async ({ context }): Promise<Facility[]> => {
    const { data, error } = await context.supabase.from("facilities").select(COLUMNS).order("name");
    if (error) {
      console.error("Failed to list facilities", error);
      throw new Error("Facilities could not be loaded.");
    }
    return (data ?? []) as Facility[];
  });

const saveSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Add a name.").max(120),
  type: z.enum(FACILITY_TYPES),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  capacity: z.number().int().min(0).max(1_000_000).nullable(),
  contact: z.string().trim().max(120).nullable(),
});

/** Admins: add a facility, or edit one when `id` is given. */
export const saveFacility = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: unknown) => saveSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { id, ...fields } = data;
    const row = { ...fields, contact: fields.contact || null };
    const { error } = id
      ? await context.supabase.from("facilities").update(row).eq("id", id)
      : await context.supabase.from("facilities").insert(row);
    if (error) {
      console.error("Failed to save facility", error);
      throw new Error("The facility could not be saved.");
    }
    return { ok: true };
  });
