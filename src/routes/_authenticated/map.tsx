import { lazy, Suspense, useCallback, useMemo, useRef, useState } from "react";
import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Crosshair, Maximize2 } from "lucide-react";
import { toast } from "sonner";

import { IncidentFilterControls } from "@/components/incidents/IncidentFilterControls";
import { IncidentPanel } from "@/components/map/IncidentPanel";
import type { IncidentMapHandle } from "@/components/map/IncidentMap";
import { MapLegend } from "@/components/map/MapLegend";
import { Button } from "@/components/ui/button";
import { useIncidentsRealtime } from "@/hooks/useIncidentsRealtime";
import { DEFAULT_FILTERS, matchesFilters, type IncidentFilters } from "@/lib/incidents/filters";
import { incidentsQuery } from "@/lib/incidents/queries";
import type { Incident } from "@/lib/incidents/types";

const IncidentMap = lazy(() => import("@/components/map/IncidentMap"));

export const Route = createFileRoute("/_authenticated/map")({
  head: () => ({
    meta: [
      { title: "Live Incident Map — RESQ AI" },
      { name: "description", content: "Live map of reported emergencies, colour-coded by severity and updated in real time." },
      { property: "og:title", content: "Live Incident Map — RESQ AI" },
      { property: "og:description", content: "Live map of reported emergencies, colour-coded by severity." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => (context.isStaff ? context.queryClient.ensureQueryData(incidentsQuery()) : undefined),
  component: LiveMapPage,
});

function MapLoading() {
  return <div className="flex h-full items-center justify-center text-muted-foreground">Loading map…</div>;
}

function LiveMapPage() {
  const { data } = useSuspenseQuery(incidentsQuery());
  const [filters, setFilters] = useState<IncidentFilters>(DEFAULT_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());
  const [announcement, setAnnouncement] = useState("");
  const mapRef = useRef<IncidentMapHandle>(null);

  const onNew = useCallback((incident: Incident) => {
    setFreshIds((s) => new Set(s).add(incident.id));
    setTimeout(() => {
      setFreshIds((s) => {
        const next = new Set(s);
        next.delete(incident.id);
        return next;
      });
    }, 6000);
    setAnnouncement(`New incident reported${incident.address_text ? ` at ${incident.address_text}` : ""}.`);
  }, []);
  useIncidentsRealtime(data, onNew);

  const visible = useMemo(
    () =>
      data.filter(
        (i) => i.duplicate_of == null && i.latitude != null && i.longitude != null && matchesFilters(i, filters),
      ),
    [data, filters],
  );
  const selected = data.find((i) => i.id === selectedId) ?? null;
  const unmapped = data.filter((i) => i.duplicate_of == null && (i.latitude == null || i.longitude == null)).length;

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col">
      <div className="border-b bg-surface px-3 py-2 sm:px-4">
        <div role="group" aria-label="Filter incidents" className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap">
          <IncidentFilterControls value={filters} onChange={setFilters} idPrefix="map" />
        </div>
        <p className="mt-1 text-xs text-muted-foreground" aria-live="polite">
          Showing {visible.length} incident{visible.length === 1 ? "" : "s"}
          {unmapped > 0 && ` · ${unmapped} without a map location`}
        </p>
      </div>

      <div className="relative isolate min-h-0 flex-1">
        <h1 className="sr-only">Live incident map</h1>
        <ClientOnly fallback={<MapLoading />}>
          <Suspense fallback={<MapLoading />}>
            <IncidentMap
              ref={mapRef}
              incidents={visible}
              freshIds={freshIds}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </Suspense>
        </ClientOnly>

        <div className="absolute right-3 top-3 z-[900] flex flex-col gap-2">
          <Button
            size="icon"
            variant="secondary"
            className="shadow-panel border"
            aria-label="Fit all incidents in view"
            title="Fit all incidents"
            onClick={() => mapRef.current?.fitAll()}
          >
            <Maximize2 aria-hidden className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="shadow-panel border"
            aria-label="Show my location"
            title="Locate me"
            onClick={async () => {
              const err = await mapRef.current?.locate();
              if (err) toast.error(err);
            }}
          >
            <Crosshair aria-hidden className="size-4" />
          </Button>
        </div>

        <div className="absolute bottom-6 left-3 z-[900] hidden sm:block">
          <MapLegend />
        </div>
        <div className="absolute left-3 top-3 z-[900] sm:hidden">
          <MapLegend defaultOpen={false} />
        </div>

        {selected && <IncidentPanel incident={selected} onClose={() => setSelectedId(null)} />}

        <div aria-live="polite" role="status" className="sr-only">
          {announcement}
        </div>
        {visible.length === 0 && (
          <div className="pointer-events-none absolute inset-x-0 top-6 z-[800] mx-auto w-fit rounded-lg border bg-surface px-4 py-2 text-sm">
            No incidents match these filters.
          </div>
        )}
      </div>
    </div>
  );
}

