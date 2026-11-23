import { queryOptions } from "@tanstack/react-query";

import { getIncidentDetail, listIncidents } from "./reads.functions";

export type { IncidentDetail } from "./reads.functions";

/** How often open pages check for new or changed incidents. */
export const LIVE_REFRESH_MS = 8_000;

export const incidentKeys = {
  all: ["incidents"] as const,
  list: () => [...incidentKeys.all, "list"] as const,
  detail: (id: string) => [...incidentKeys.all, "detail", id] as const,
};

/** Every incident (newest first), refreshed in the background. Demo scale. */
export const incidentsQuery = () =>
  queryOptions({
    queryKey: incidentKeys.list(),
    queryFn: () => listIncidents(),
    staleTime: 5_000,
    refetchInterval: LIVE_REFRESH_MS,
  });

export const incidentDetailQuery = (id: string) =>
  queryOptions({
    queryKey: incidentKeys.detail(id),
    queryFn: () => getIncidentDetail({ data: { id } }),
    refetchInterval: LIVE_REFRESH_MS,
  });
