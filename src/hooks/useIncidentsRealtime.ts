import { useEffect, useRef } from "react";

import type { Incident } from "@/lib/incidents/types";

/**
 * Reports incidents that appear in the (auto-refreshing) incident list after the page loaded.
 * The callback is read through a ref so a new callback identity never re-triggers alerts.
 */
export function useIncidentsRealtime(incidents: Incident[], onNewIncident?: (incident: Incident) => void) {
  const knownIds = useRef<Set<string> | null>(null);
  const callbackRef = useRef(onNewIncident);
  callbackRef.current = onNewIncident;

  useEffect(() => {
    if (knownIds.current === null) {
      knownIds.current = new Set(incidents.map((i) => i.id));
      return;
    }
    for (const incident of incidents) {
      if (!knownIds.current.has(incident.id)) {
        knownIds.current.add(incident.id);
        callbackRef.current?.(incident);
      }
    }
  }, [incidents]);
}
