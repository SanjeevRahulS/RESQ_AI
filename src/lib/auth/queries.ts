import { queryOptions } from "@tanstack/react-query";

import { listStaff } from "./staff.functions";

export const staffKeys = {
  all: ["staff"] as const,
  list: () => [...staffKeys.all, "list"] as const,
};

/** Accounts with command-staff access. Admins only, so the panel must gate rendering. */
export const staffQuery = () =>
  queryOptions({
    queryKey: staffKeys.list(),
    queryFn: () => listStaff(),
    staleTime: 15_000,
  });
