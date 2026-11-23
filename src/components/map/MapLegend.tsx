import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { ALL_SEVERITIES, SEVERITY_LABEL } from "@/lib/incidents/constants";
import { SEVERITY_ICON, SEVERITY_VAR } from "@/components/incidents/SeverityBadge";

export function MapLegend({ defaultOpen = true }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="shadow-panel rounded-xl border bg-surface/95 text-sm backdrop-blur">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="map-legend-list"
        className="flex w-full items-center justify-between gap-6 rounded-xl px-3 py-2 font-semibold"
      >
        Legend
        {open ? <ChevronDown aria-hidden className="size-4" /> : <ChevronUp aria-hidden className="size-4" />}
      </button>
      {open && (
        <ul id="map-legend-list" className="space-y-1.5 px-3 pb-3">
          {ALL_SEVERITIES.map((s) => {
            const Icon = SEVERITY_ICON[s];
            return (
              <li key={s} className="flex items-center gap-2">
                <span
                  className="grid size-6 place-items-center rounded-full text-background"
                  style={{ background: SEVERITY_VAR[s] }}
                >
                  <Icon aria-hidden className="size-3.5" strokeWidth={2.5} />
                </span>
                {SEVERITY_LABEL[s]}
              </li>
            );
          })}
          <li className="flex items-center gap-2 pt-1 text-muted-foreground">
            <span className="grid size-6 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              3
            </span>
            Cluster of incidents
          </li>
        </ul>
      )}
    </div>
  );
}
