import { Activity, Building2, Droplets, Flame, HeartPulse, CircleDot, type LucideIcon } from "lucide-react";

import type { IncidentType } from "@/lib/incidents/constants";

export const TYPE_ICON: Record<IncidentType, LucideIcon> = {
  flood: Droplets,
  fire: Flame,
  earthquake: Activity,
  medical: HeartPulse,
  collapse: Building2,
  other: CircleDot,
};

export function IncidentTypeIcon({ type, className }: { type: IncidentType | null; className?: string }) {
  const Icon = TYPE_ICON[type ?? "other"];
  return <Icon aria-hidden className={className ?? "size-4"} />;
}
