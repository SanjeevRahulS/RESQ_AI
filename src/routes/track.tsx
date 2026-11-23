import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Loader2, MapPin, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trackReport } from "@/lib/incidents/incidents.functions";
import { PUBLIC_STATUSES, PUBLIC_STATUS_LABEL, normalizeTrackingCode } from "@/lib/incidents/tracking";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/track")({
  validateSearch: (search: Record<string, unknown>): { code?: string } => {
    const code = search["code"];
    return typeof code === "string" && code.length <= 20 ? { code } : {};
  },
  head: () => ({
    meta: [
      { title: "Track a Report — RESQ" },
      { name: "description", content: "Enter your RESQ tracking code to see the status of your emergency report." },
      { property: "og:title", content: "Track a Report — RESQ" },
      { property: "og:description", content: "Check the status of an emergency report with its tracking code." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TrackPage,
});

function TrackPage() {
  const { code } = Route.useSearch();
  const navigate = useNavigate({ from: "/track" });
  const [input, setInput] = useState(code ?? "");
  const [formError, setFormError] = useState<string | null>(null);
  const lookup = useServerFn(trackReport);
  const normalized = code ? normalizeTrackingCode(code) : null;

  useEffect(() => setInput(code ?? ""), [code]);

  const query = useQuery({
    queryKey: ["track", normalized],
    queryFn: () => lookup({ data: { code: normalized! } }),
    enabled: normalized != null,
    staleTime: 15_000,
  });

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-3 py-8 sm:px-6 sm:py-12">
      <header className="mb-8 space-y-3 border-b pb-6">
        <p className="label-caps">Public report status</p>
        <h1 className="text-3xl sm:text-4xl">Track a report</h1>
        <p className="text-muted-foreground">
          Enter the tracking code you were given after sending a report. Only the status and general area are shown.
        </p>
      </header>

      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          const next = normalizeTrackingCode(input);
          if (!next) {
            setFormError("Enter a code like RQ-7K3M9.");
            return;
          }
          setFormError(null);
          void navigate({ search: { code: next } });
        }}
      >
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label htmlFor="tracking-code">Tracking code</Label>
          <Input
            id="tracking-code"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="RQ-7K3M9"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            className="font-mono uppercase"
            aria-invalid={formError != null}
            aria-describedby={formError ? "tracking-code-error" : undefined}
          />
        </div>
        <Button type="submit">
          <Search aria-hidden className="size-4" /> Check status
        </Button>
        {formError && (
          <p id="tracking-code-error" className="w-full text-sm text-sev-critical">
            {formError}
          </p>
        )}
      </form>

      <div className="mt-8" aria-live="polite">
        {code && !normalized && (
          <p className="rounded-md border bg-surface p-4 text-sm">That doesn't look like a tracking code. Codes look like RQ-7K3M9.</p>
        )}
        {query.isFetching && !query.data && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 aria-hidden className="size-4 animate-spin" /> Looking up your report…
          </p>
        )}
        {query.isError && (
          <p className="rounded-md border bg-surface p-4 text-sm text-sev-critical">
            We couldn't look up that report right now. Please try again.
          </p>
        )}
        {query.isSuccess && query.data === null && (
          <p className="rounded-md border bg-surface p-4 text-sm">
            No report found with code <span className="font-mono">{normalized}</span>. Check the code and try again.
          </p>
        )}
        {query.data && <TrackResult result={query.data} />}
      </div>
    </div>
  );
}

function TrackResult({
  result,
}: {
  result: { code: string; status: (typeof PUBLIC_STATUSES)[number]; updatedAt: string; area: string | null };
}) {
  const current = PUBLIC_STATUSES.indexOf(result.status);
  return (
    <section className="rounded-md border bg-surface p-5" aria-labelledby="track-result-heading">
      <p className="label-caps">Report</p>
      <h2 id="track-result-heading" className="font-mono text-2xl">
        {result.code}
      </h2>
      <p className="mt-3 text-lg">
        Status: <span className="font-semibold">{PUBLIC_STATUS_LABEL[result.status]}</span>
      </p>

      <ol className="mt-4 grid grid-cols-4 gap-2" aria-label="Progress">
        {PUBLIC_STATUSES.map((s, i) => {
          const done = i <= current;
          return (
            <li key={s} className="space-y-1.5" aria-current={i === current ? "step" : undefined}>
              <span className={cn("block h-1.5 rounded-sm", done ? "bg-primary" : "bg-border")} />
              <span className={cn("flex items-center gap-1 text-xs", done ? "text-foreground" : "text-muted-foreground")}>
                {done && <Check aria-hidden className="size-3" />}
                {PUBLIC_STATUS_LABEL[s]}
              </span>
            </li>
          );
        })}
      </ol>

      <dl className="mt-5 grid gap-3 border-t pt-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="label-caps">Last update</dt>
          <dd className="font-mono">{new Date(result.updatedAt).toLocaleString()}</dd>
        </div>
        <div>
          <dt className="label-caps">General area</dt>
          <dd className="flex items-center gap-1.5">
            <MapPin aria-hidden className="size-4 text-muted-foreground" />
            {result.area ?? "Not provided"}
          </dd>
        </div>
      </dl>
    </section>
  );
}
