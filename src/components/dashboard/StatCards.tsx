import { Activity, GitMerge, OctagonAlert, Timer, type LucideIcon } from "lucide-react";

import { formatHours } from "@/lib/incidents/format";
import type { DashboardStats } from "@/lib/incidents/stats";
import { cn } from "@/lib/utils";

function Card({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: LucideIcon;
  tone: string;
}) {
  return (
    <div className="bg-surface px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="label-caps">{label}</p>
        <Icon aria-hidden className={cn("size-4", tone)} />
      </div>
      <p className={cn("mt-1 font-mono text-2xl font-medium tabular-nums", tone)}>{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

export function StatCards({ stats }: { stats: DashboardStats }) {
  return (
    <section aria-label="Key figures" className="grid grid-cols-2 gap-px overflow-hidden rounded-md border bg-border lg:grid-cols-4">
      <Card label="Active incidents" value={stats.active} hint="Not yet resolved" icon={Activity} tone="text-primary" />
      <Card
        label="Critical"
        value={stats.critical}
        hint="Active, critical severity"
        icon={OctagonAlert}
        tone="text-sev-critical"
      />
      <Card
        label="Needs review"
        value={stats.needsReview}
        hint="Suspected duplicates"
        icon={GitMerge}
        tone="text-status-review"
      />
      <Card
        label="Avg. time to resolve"
        value={formatHours(stats.avgResolveHours)}
        hint="From report to resolved"
        icon={Timer}
        tone="text-foreground"
      />
    </section>
  );
}
