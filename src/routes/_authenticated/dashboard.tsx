import { useCallback, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { UserRound } from "lucide-react";

import { IncidentDetailSheet } from "@/components/dashboard/IncidentDetailSheet";
import { IncidentQueue } from "@/components/dashboard/IncidentQueue";
import { ReviewList } from "@/components/dashboard/ReviewList";
import { SeverityChart } from "@/components/dashboard/SeverityChart";
import { StatCards } from "@/components/dashboard/StatCards";
import { TeamAccessPanel } from "@/components/dashboard/TeamAccessPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIncidentsRealtime } from "@/hooks/useIncidentsRealtime";
import { incidentsQuery } from "@/lib/incidents/queries";
import { computeStats } from "@/lib/incidents/stats";
import type { Incident } from "@/lib/incidents/types";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Command Dashboard — RESQ" },
      { name: "description", content: "Triage incidents by severity, track status from new to resolved, and review suspected duplicates." },
      { property: "og:title", content: "Command Dashboard — RESQ" },
      { property: "og:description", content: "Triage incidents by severity, track status and review suspected duplicates." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => (context.isStaff ? context.queryClient.ensureQueryData(incidentsQuery()) : undefined),
  component: DashboardPage,
});

function DashboardPage() {
  const { data } = useSuspenseQuery(incidentsQuery());
  const { user, isAdmin } = Route.useRouteContext();
  const [openId, setOpenId] = useState<string | null>(null);
  const [tab, setTab] = useState("queue");
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());
  const [announcement, setAnnouncement] = useState("");

  const onNew = useCallback((incident: Incident) => {
    setFreshIds((s) => new Set(s).add(incident.id));
    setTimeout(() => {
      setFreshIds((s) => {
        const next = new Set(s);
        next.delete(incident.id);
        return next;
      });
    }, 3000);
    setAnnouncement(`New incident reported${incident.address_text ? ` at ${incident.address_text}` : ""}.`);
  }, []);
  useIncidentsRealtime(data, onNew);

  const stats = useMemo(() => computeStats(data), [data]);

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 px-3 py-5 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Chennai operations</p>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Command Dashboard</h1>
        </div>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <UserRound aria-hidden className="size-4" /> Signed in as <span className="font-semibold text-foreground">{user.email}</span>
        </p>
      </div>

      <StatCards stats={stats} />

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <Tabs value={tab} onValueChange={setTab} className="min-w-0 space-y-3">
          <TabsList>
            <TabsTrigger value="queue">Incident queue</TabsTrigger>
            <TabsTrigger value="review">
              Needs review
              {stats.needsReview > 0 && (
                <span className="ml-2 rounded-full bg-status-review px-1.5 text-xs font-bold text-background">
                  {stats.needsReview}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="queue" className="mt-0">
            <IncidentQueue incidents={data} freshIds={freshIds} onOpen={setOpenId} />
          </TabsContent>
          <TabsContent value="review" className="mt-0">
            <ReviewList incidents={data} onOpen={setOpenId} />
          </TabsContent>
        </Tabs>
        <SeverityChart counts={stats.bySeverity} />
      </div>

      {isAdmin && <TeamAccessPanel />}

      <IncidentDetailSheet incidentId={openId} onClose={() => setOpenId(null)} onOpenIncident={setOpenId} />

      <div aria-live="polite" role="status" className="sr-only">
        {announcement}
      </div>
    </div>
  );
}
