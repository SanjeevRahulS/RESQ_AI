import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Plus, UsersRound, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MIN_STAFF_PASSWORD, STAFF_ROLE_LABEL, isAcceptableStaffPassword, type StaffRole } from "@/lib/auth/access";
import { addStaffMember, removeStaffMember, setStaffRole } from "@/lib/auth/staff.functions";
import { staffKeys, staffQuery } from "@/lib/auth/queries";

function errorMessage(err: unknown) {
  return err instanceof Error && err.message ? err.message : "Something went wrong. Please try again.";
}

/** Admins only: decide who can open the Live Map and Command Dashboard, and at what level. */
export function TeamAccessPanel() {
  const queryClient = useQueryClient();
  const { data: staff, isPending, isError } = useQuery(staffQuery());
  const add = useServerFn(addStaffMember);
  const remove = useServerFn(removeStaffMember);
  const changeRole = useServerFn(setStaffRole);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<StaffRole>("responder");

  const refresh = () => queryClient.invalidateQueries({ queryKey: staffKeys.all });

  const addMutation = useMutation({
    mutationFn: () => add({ data: { email, password, role } }),
    onSuccess: (res) => {
      toast.success(res.created ? `${res.email} can now sign in` : `${res.email} now has ${STAFF_ROLE_LABEL[res.role].toLowerCase()} access`);
      setEmail("");
      setPassword("");
      return refresh();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => remove({ data: { user_id: userId } }),
    onSuccess: () => {
      toast.success("Staff access removed");
      return refresh();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const roleMutation = useMutation({
    mutationFn: (vars: { userId: string; role: StaffRole }) =>
      changeRole({ data: { user_id: vars.userId, role: vars.role } }),
    onSuccess: () => {
      toast.success("Access updated");
      return refresh();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const passwordTooShort = password.length > 0 && !isAcceptableStaffPassword(password);

  return (
    <section className="rounded-md border bg-surface p-4 sm:p-5" aria-labelledby="team-access-heading">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-md bg-secondary">
          <UsersRound aria-hidden className="size-4 text-primary" />
        </span>
        <div className="min-w-0">
          <h2 id="team-access-heading" className="tracking-tight">
            Team access
          </h2>
          <p className="text-sm text-muted-foreground">
            People listed here can open the Live Map and Command Dashboard. Reporting an emergency never needs an account.
          </p>
        </div>
      </div>

      {isPending ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 aria-hidden className="size-4 animate-spin" /> Loading team…
        </p>
      ) : isError ? (
        <p className="mt-4 text-sm text-sev-critical">Team access could not be loaded.</p>
      ) : (
        <ul className="mt-4 divide-y divide-border rounded-lg border bg-background/40" aria-label="Staff accounts">
          {(staff ?? []).map((member) => {
            const busy =
              (removeMutation.isPending && removeMutation.variables === member.user_id) ||
              (roleMutation.isPending && roleMutation.variables?.userId === member.user_id);
            return (
              <li key={member.user_id} className="flex flex-wrap items-center gap-2 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{member.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {STAFF_ROLE_LABEL[member.role]} · added {new Date(member.granted_at).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    roleMutation.mutate({
                      userId: member.user_id,
                      role: member.role === "admin" ? "responder" : "admin",
                    })
                  }
                >
                  {busy && <Loader2 aria-hidden className="size-3.5 animate-spin" />}
                  {member.role === "admin" ? "Make responder" : "Make admin"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-sev-critical"
                  disabled={busy}
                  aria-label={`Remove access for ${member.email}`}
                  onClick={() => removeMutation.mutate(member.user_id)}
                >
                  <X aria-hidden className="size-3.5" /> Remove
                </Button>
              </li>
            );
          })}
          {(staff ?? []).length === 0 && (
            <li className="px-3 py-4 text-sm text-muted-foreground">No one has staff access yet.</li>
          )}
        </ul>
      )}

      <form
        className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          addMutation.mutate();
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="staff-email">Email</Label>
          <Input
            id="staff-email"
            type="email"
            autoComplete="off"
            placeholder="responder@agency.org"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="staff-password">Temporary password</Label>
          <Input
            id="staff-password"
            type="password"
            autoComplete="new-password"
            placeholder={`at least ${MIN_STAFF_PASSWORD} characters`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={passwordTooShort}
            required
          />
          {passwordTooShort && (
            <p className="text-xs text-sev-critical">Use at least {MIN_STAFF_PASSWORD} characters.</p>
          )}
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex gap-1.5" role="group" aria-label="Access level">
            <Button
              type="button"
              size="sm"
              variant={role === "responder" ? "default" : "outline"}
              onClick={() => setRole("responder")}
            >
              Responder
            </Button>
            <Button
              type="button"
              size="sm"
              variant={role === "admin" ? "default" : "outline"}
              onClick={() => setRole("admin")}
            >
              Admin
            </Button>
          </div>
          <Button
            type="submit"
            disabled={addMutation.isPending || !email || passwordTooShort}
            aria-label="Add staff member"
          >
            {addMutation.isPending ? (
              <Loader2 aria-hidden className="size-4 animate-spin" />
            ) : (
              <Plus aria-hidden className="size-4" />
            )}
            Add
          </Button>
        </div>
      </form>
      <p className="mt-2 text-xs text-muted-foreground">
        The password is only used when the account does not exist yet; an account that already exists keeps its own password.
      </p>
    </section>
  );
}
