import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { listAllAdvisories } from "./advisories.functions";
import { activeAdvisories, type Advisory } from "./rules";

export const advisoryKeys = {
  all: ["advisories"] as const,
  active: () => [...advisoryKeys.all, "active"] as const,
  admin: () => [...advisoryKeys.all, "admin"] as const,
};

/** Public banner: unexpired advisories (readable by anyone), most severe first. */
export const activeAdvisoriesQuery = () =>
  queryOptions({
    queryKey: advisoryKeys.active(),
    queryFn: async (): Promise<Advisory[]> => {
      const { data, error } = await supabase
        .from("advisories")
        .select("id, created_at, updated_at, title, message, severity, area, expires_at, created_by")
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .limit(20);
      if (error) throw error;
      return activeAdvisories((data ?? []) as Advisory[]);
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

/** Admin panel: all advisories including expired ones. */
export const allAdvisoriesQuery = () =>
  queryOptions({
    queryKey: advisoryKeys.admin(),
    queryFn: () => listAllAdvisories(),
    staleTime: 10_000,
  });
