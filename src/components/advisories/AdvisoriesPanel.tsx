import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Megaphone, Pencil, TimerOff } from "lucide-react";
import { toast } from "sonner";

import { SeverityBadge } from "@/components/incidents/SeverityBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { expireAdvisory, saveAdvisory } from "@/lib/advisories/advisories.functions";
import { advisoryKeys, allAdvisoriesQuery } from "@/lib/advisories/queries";
import { isAdvisoryActive, type Advisory } from "@/lib/advisories/rules";
import { SEVERITIES, SEVERITY_LABEL, type ClassifiedSeverity } from "@/lib/incidents/constants";

interface Draft {
  id?: string;
  title: string;
  message: string;
  severity: ClassifiedSeverity;
  area: string;
  expiresLocal: string;
}

const EMPTY: Draft = { title: "", message: "", severity: "medium", area: "", expiresLocal: "" };

/** ISO timestamp -> value for <input type="datetime-local"> in the viewer's time zone. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function errorMessage(err: unknown) {
  return err instanceof Error && err.message ? err.message : "Something went wrong. Please try again.";
}

/** Admins only: write, edit and expire the public advisories shown at the top of every page. */
export function AdvisoriesPanel() {
  const queryClient = useQueryClient();
  const { data, isPending, isError } = useQuery(allAdvisoriesQuery());
  const save = useServerFn(saveAdvisory);
  const expire = useServerFn(expireAdvisory);
  const [draft, setDraft] = useState<Draft>(EMPTY);

  const refresh = () => queryClient.invalidateQueries({ queryKey: advisoryKeys.all });

  const saveMutation = useMutation({
    mutationFn: () =>
      save({
        data: {
          ...(draft.id ? { id: draft.id } : {}),
          title: draft.title,
          message: draft.message,
          severity: draft.severity,
          area: draft.area.trim() || null,
          expires_at: draft.expiresLocal ? new Date(draft.expiresLocal).toISOString() : null,
        },
      }),
    onSuccess: () => {
      toast.success(draft.id ? "Advisory updated" : "Advisory published");
      setDraft(EMPTY);
      return refresh();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const expireMutation = useMutation({
    mutationFn: (id: string) => expire({ data: { id } }),
    onSuccess: () => {
      toast.success("Advisory expired");
      return refresh();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const edit = (a: Advisory) =>
    setDraft({
      id: a.id,
      title: a.title,
      message: a.message,
      severity: a.severity,
      area: a.area ?? "",
      expiresLocal: toLocalInput(a.expires_at),
    });

  return (
    <section className="rounded-md border bg-surface p-4 sm:p-5" aria-labelledby="advisories-heading">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-md bg-secondary">
          <Megaphone aria-hidden className="size-4 text-primary" />
        </span>
        <div className="min-w-0">
          <h2 id="advisories-heading" className="tracking-tight">
            Public advisories
          </h2>
          <p className="text-sm text-muted-foreground">
            Active advisories appear in a banner at the top of every page, including the Live Map.
          </p>
        </div>
      </div>

      <form
        className="mt-4 grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          saveMutation.mutate();
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="adv-title">Title</Label>
          <Input
            id="adv-title"
            value={draft.title}
            maxLength={120}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="Heavy rain warning"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="adv-area">Area (optional)</Label>
          <Input
            id="adv-area"
            value={draft.area}
            maxLength={120}
            onChange={(e) => setDraft({ ...draft, area: e.target.value })}
            placeholder="Adyar, Velachery"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="adv-message">Message</Label>
          <Textarea
            id="adv-message"
            value={draft.message}
            maxLength={600}
            rows={3}
            onChange={(e) => setDraft({ ...draft, message: e.target.value })}
            placeholder="Avoid low-lying roads. Move vehicles to higher ground."
            required
          />
        </div>
        <div className="space-y-1.5">
          <span className="text-sm font-medium" id="adv-severity-label">
            Severity
          </span>
          <div className="flex flex-wrap gap-1.5" role="group" aria-labelledby="adv-severity-label">
            {SEVERITIES.map((s) => (
              <Button
                key={s}
                type="button"
                size="sm"
                variant={draft.severity === s ? "default" : "outline"}
                aria-pressed={draft.severity === s}
                onClick={() => setDraft({ ...draft, severity: s })}
              >
                {SEVERITY_LABEL[s]}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="adv-expires">Expires (optional)</Label>
          <Input
            id="adv-expires"
            type="datetime-local"
            value={draft.expiresLocal}
            onChange={(e) => setDraft({ ...draft, expiresLocal: e.target.value })}
          />
        </div>
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <Button type="submit" disabled={saveMutation.isPending || !draft.title.trim() || !draft.message.trim()}>
            {saveMutation.isPending && <Loader2 aria-hidden className="size-4 animate-spin" />}
            {draft.id ? "Save changes" : "Publish advisory"}
          </Button>
          {draft.id && (
            <Button type="button" variant="ghost" onClick={() => setDraft(EMPTY)}>
              Cancel edit
            </Button>
          )}
        </div>
      </form>

      {isPending ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 aria-hidden className="size-4 animate-spin" /> Loading advisories…
        </p>
      ) : isError ? (
        <p className="mt-4 text-sm text-sev-critical">Advisories could not be loaded.</p>
      ) : (
        <ul className="mt-4 divide-y divide-border rounded-md border bg-background/40" aria-label="All advisories">
          {(data ?? []).map((a) => {
            const active = isAdvisoryActive(a);
            const busy = expireMutation.isPending && expireMutation.variables === a.id;
            return (
              <li key={a.id} className="flex flex-wrap items-center gap-2 px-3 py-2.5">
                <SeverityBadge severity={a.severity} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {active ? "Active" : "Expired"}
                    {a.area ? ` · ${a.area}` : ""}
                    {a.expires_at && (
                      <>
                        {" · "}
                        {active ? "until" : "ended"}{" "}
                        <time>{new Date(a.expires_at).toLocaleString()}</time>
                      </>
                    )}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => edit(a)} aria-label={`Edit advisory ${a.title}`}>
                  <Pencil aria-hidden className="size-3.5" /> Edit
                </Button>
                {active && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-sev-critical"
                    disabled={busy}
                    onClick={() => expireMutation.mutate(a.id)}
                    aria-label={`Expire advisory ${a.title} now`}
                  >
                    {busy ? <Loader2 aria-hidden className="size-3.5 animate-spin" /> : <TimerOff aria-hidden className="size-3.5" />}
                    Expire now
                  </Button>
                )}
              </li>
            );
          })}
          {(data ?? []).length === 0 && <li className="px-3 py-4 text-sm text-muted-foreground">No advisories yet.</li>}
        </ul>
      )}
    </section>
  );
}
