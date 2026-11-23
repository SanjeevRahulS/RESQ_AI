import { useQuery } from "@tanstack/react-query";

import { getPhotoUrls } from "@/lib/incidents/reads.functions";

/** Photos live in a private bucket; the server resolves short-lived viewing links. */
export function useSignedPhotoUrls(paths: string[]) {
  return useQuery({
    queryKey: ["photo-urls", ...paths],
    enabled: paths.length > 0,
    staleTime: 30 * 60_000,
    queryFn: () => getPhotoUrls({ data: { paths } }),
  });
}
