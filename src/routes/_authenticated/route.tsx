import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSignOut } from "@/hooks/useSignOut";

// Session lives in browser storage, so this gate runs client-side only.
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: "/auth", search: { redirect: location.href } });
    const { data: isStaff } = await supabase.rpc("is_staff", { _user_id: user.id });
    return { user, isStaff: Boolean(isStaff) };
  },
  component: StaffGate,
});

function StaffGate() {
  const { isStaff, user } = Route.useRouteContext();
  const signOut = useSignOut();
  if (isStaff) return <Outlet />;
  return (
    <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <ShieldAlert aria-hidden className="size-10 text-sev-high" />
      <h1 className="text-xl font-bold">No command staff access</h1>
      <p className="text-sm text-muted-foreground">
        {user.email} is signed in but has not been given the admin or responder role. Ask an admin to grant access.
      </p>
      <Button variant="outline" onClick={() => void signOut()}>
        Sign out
      </Button>
    </div>
  );
}
