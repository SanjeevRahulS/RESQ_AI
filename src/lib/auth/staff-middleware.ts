import { createMiddleware } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Signed-in admin or responder only. Adds `actor` (the staff email) for the event log. */
export const requireStaff = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ next, context }) => {
    const { data: isStaff, error } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (error || !isStaff) throw new Error("Forbidden: command staff only");
    const email = typeof context.claims.email === "string" ? context.claims.email : null;
    return next({ context: { actor: email ?? `staff:${context.userId.slice(0, 8)}` } });
  });

/** Signed-in admin only: manages who holds staff access. Adds `actor` and `userId`. */
export const requireAdmin = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ next, context }) => {
    const { data: isAdmin, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (error || !isAdmin) throw new Error("Forbidden: admins only");
    const email = typeof context.claims.email === "string" ? context.claims.email : null;
    return next({
      context: { actor: email ?? `staff:${context.userId.slice(0, 8)}`, userId: context.userId },
    });
  });
