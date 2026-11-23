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
