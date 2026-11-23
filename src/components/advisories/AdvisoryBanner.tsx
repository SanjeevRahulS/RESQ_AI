import { useQuery } from "@tanstack/react-query";
import { MapPin, Megaphone } from "lucide-react";

import { SeverityBadge } from "@/components/incidents/SeverityBadge";
import { activeAdvisoriesQuery } from "@/lib/advisories/queries";
import { cn } from "@/lib/utils";

const EDGE: Record<string, string> = {
  critical: "border-l-sev-critical",
  high: "border-l-sev-high",
  medium: "border-l-sev-medium",
  low: "border-l-sev-low",
};

/** Active public advisories, shown under the header on every page. Renders nothing when there are none. */
export function AdvisoryBanner() {
  const { data } = useQuery(activeAdvisoriesQuery());
  if (!data || data.length === 0) return null;
  return (
    <section aria-label="Current advisories" className="border-b bg-surface">
      <ul className="mx-auto max-w-[1600px] divide-y divide-border">
        {data.map((a) => (
          <li
            key={a.id}
            className={cn("flex flex-wrap items-start gap-x-3 gap-y-1 border-l-4 px-3 py-2 text-sm sm:px-6", EDGE[a.severity])}
          >
            <span className="flex items-center gap-2">
              <Megaphone aria-hidden className="size-4 text-muted-foreground" />
              <SeverityBadge severity={a.severity} size="sm" />
            </span>
            <p className="min-w-0 flex-1">
              <span className="font-semibold">{a.title}.</span> <span className="text-muted-foreground">{a.message}</span>
            </p>
            {a.area && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin aria-hidden className="size-3.5" /> {a.area}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
