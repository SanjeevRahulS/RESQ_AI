import { queryOptions } from "@tanstack/react-query";

import { listFacilities } from "./facilities.functions";

export const facilityKeys = {
  all: ["facilities"] as const,
};

/** Staff only: shelters, hospitals and relief camps. */
export const facilitiesQuery = () =>
  queryOptions({
    queryKey: facilityKeys.all,
    queryFn: () => listFacilities(),
    staleTime: 60_000,
  });
