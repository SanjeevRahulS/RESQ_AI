import { Bar, BarChart, Cell, LabelList, XAxis, YAxis } from "recharts";

import { SEVERITY_ICON, SEVERITY_VAR } from "@/components/incidents/SeverityBadge";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { ALL_SEVERITIES, SEVERITY_LABEL, type Severity } from "@/lib/incidents/constants";

const config: ChartConfig = { count: { label: "Active incidents" } };

export function SeverityChart({ counts }: { counts: Record<Severity, number> }) {
  const data = ALL_SEVERITIES.map((s) => ({ severity: s, label: SEVERITY_LABEL[s], count: counts[s] }));
  const total = data.reduce((sum, d) => sum + d.count, 0);
  return (
    <section aria-labelledby="sev-chart-title" className="self-start rounded-md border bg-surface p-4">
      <h2 id="sev-chart-title" className="label-caps">
        Active incidents by severity
      </h2>
      <ChartContainer config={config} className="mt-3 aspect-auto h-44 w-full" aria-hidden>
        <BarChart data={data} margin={{ left: -20, right: 8, top: 16 }}>
          <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={13} interval={0} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={13} />
          <ChartTooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent />} />
          <Bar dataKey="count" radius={[2, 2, 0, 0]}>
            <LabelList dataKey="count" position="top" fontSize={13} fill="var(--foreground)" />
            {data.map((d) => (
              <Cell key={d.severity} fill={SEVERITY_VAR[d.severity]} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
      {/* Text equivalent of the chart, doubling as its legend: icon + label + count per severity. */}
      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        {data.map((d) => {
          const Icon = SEVERITY_ICON[d.severity];
          return (
            <li key={d.severity} className="flex items-center gap-2">
              <Icon aria-hidden className="size-4 shrink-0" style={{ color: SEVERITY_VAR[d.severity] }} />
              <span>{d.label}</span>
              <span className="ml-auto tabular-nums">{d.count}</span>
            </li>
          );
        })}
      </ul>
      <p className="sr-only">{total} active incidents in total.</p>
    </section>
  );
}
