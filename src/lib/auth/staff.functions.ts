import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { MIN_STAFF_PASSWORD, STAFF_ROLES, canChangeAdminRole, type StaffRole } from "./access";
import { requireAdmin } from "./staff-middleware";

// Admin-only staff access management. The caller's admin role is verified through RLS-backed
// `has_role` before anything happens; the service-role client is only used afterwards, to reach
// account records (emails) that the signed-in client cannot read.

export interface StaffMember {
  user_id: string;
  email: string;
  role: StaffRole;
  granted_at: string;
}

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address.")
  .max(200);

async function adminClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function adminCount(db: Awaited<ReturnType<typeof adminClient>>): Promise<number> {
  const { data, error } = await db
    .from("user_roles")
    .select("user_id")
    .eq("role", "admin");
  if (error) throw new Error("Could not check the current admin list.");
  return data?.length ?? 0;
}

/** Admins only: every account that can open the map or dashboard, with its role. */
export const listStaff = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async (): Promise<StaffMember[]> => {
    const db = await adminClient();
    const [rolesRes, usersRes] = await Promise.all([
      db.from("user_roles").select("user_id, role, created_at").order("created_at"),
      db.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ]);
    if (rolesRes.error) {
      console.error("Failed to list staff", rolesRes.error);
      throw new Error("Team access could not be loaded.");
    }
    const emails = new Map(
      (usersRes.data.users ?? []).map((u) => [u.id, (u.email ?? "").toLowerCase()]),
    );
    return (rolesRes.data ?? [])
      .map((r) => ({
        user_id: r.user_id,
        email: emails.get(r.user_id) ?? "account removed",
        role: r.role as StaffRole,
        granted_at: r.created_at,
      }))
      .sort((a, b) => a.email.localeCompare(b.email));
  });

const addSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(MIN_STAFF_PASSWORD, `Use at least ${MIN_STAFF_PASSWORD} characters.`)
    .max(200),
  role: z.enum(STAFF_ROLES),
});

/**
 * Admins only: give a person command-staff access. Creates the account with the temporary
 * password when it does not exist yet; an existing account keeps its own password and only
 * gains the role.
 */
export const addStaffMember = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: unknown) => addSchema.parse(input))
  .handler(async ({ data }): Promise<{ created: boolean; email: string; role: StaffRole }> => {
    const db = await adminClient();

    const { data: allUsers } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existingUser =
      (allUsers?.users ?? []).find((u) => (u.email ?? "").toLowerCase() === data.email) ?? null;

    if (existingUser) {
      const { data: current } = await db
        .from("user_roles")
        .select("role")
        .eq("user_id", existingUser.id);
      if ((current ?? []).some((r) => r.role === data.role)) {
        throw new Error(`${data.email} already has that access.`);
      }
      const { error } = await db
        .from("user_roles")
        .insert({ user_id: existingUser.id, role: data.role });
      if (error) {
        console.error("Failed to grant role", error);
        throw new Error("We couldn't give that account staff access.");
      }
      return { created: false, email: data.email, role: data.role };
    }

    const { data: created, error } = await db.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (error || !created.user) {
      console.error("Failed to create staff account", error);
      throw new Error("We couldn't create that account. Check the email address and try again.");
    }

    const { error: roleErr } = await db
      .from("user_roles")
      .insert({ user_id: created.user.id, role: data.role });
    if (roleErr) {
      console.error("Failed to grant role, removing the new account", roleErr);
      await db.auth.admin.deleteUser(created.user.id);
      throw new Error("We couldn't give that account staff access.");
    }

    return { created: true, email: data.email, role: data.role };
  });

const targetSchema = z.object({ user_id: z.string().uuid() });

/** Admins only: take away a person's staff access. Their account is left in place. */
export const removeStaffMember = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: unknown) => targetSchema.parse(input))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const db = await adminClient();
    const { data: roles, error } = await db
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user_id);
    if (error) throw new Error("We couldn't check that account.");
    if ((roles ?? []).length === 0) throw new Error("That account does not have staff access.");

    if ((roles ?? []).some((r) => r.role === "admin") && !canChangeAdminRole(await adminCount(db))) {
      throw new Error("The command needs at least one admin.");
    }

    const { error: delErr } = await db.from("user_roles").delete().eq("user_id", data.user_id);
    if (delErr) {
      console.error("Failed to revoke staff access", delErr);
      throw new Error("We couldn't remove that access.");
    }
    return { ok: true };
  });

const setRoleSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(STAFF_ROLES),
});

/** Admins only: switch a person between responder and admin. */
export const setStaffRole = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: unknown) => setRoleSchema.parse(input))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const db = await adminClient();
    const { data: current, error } = await db
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user_id);
    if (error) throw new Error("We couldn't check that account.");
    const roles = current ?? [];
    if (roles.length === 0) throw new Error("That account does not have staff access.");
    if (roles.some((r) => r.role === data.role)) {
      throw new Error(`That account is already ${data.role === "admin" ? "an admin" : "a responder"}.`);
    }

    const isLosingAdmin = roles.some((r) => r.role === "admin") && data.role !== "admin";
    if (isLosingAdmin && !canChangeAdminRole(await adminCount(db))) {
      throw new Error("The command needs at least one admin.");
    }

    const { error: updErr } = await db
      .from("user_roles")
      .update({ role: data.role })
      .eq("user_id", data.user_id);
    if (updErr) {
      console.error("Failed to change role", updErr);
      throw new Error("We couldn't change that access.");
    }
    return { ok: true };
  });
