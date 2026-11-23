import { Hospital, House, Tent, type LucideIcon } from "lucide-react";

import type { FacilityType } from "@/lib/facilities/constants";

export const FACILITY_ICON: Record<FacilityType, LucideIcon> = {
  shelter: House,
  hospital: Hospital,
  relief_camp: Tent,
};

/** Round light marker with a dark glyph, so facilities never look like (square) incident pins. */
export function FacilityMarkerSwatch({ type }: { type: FacilityType }) {
  const Icon = FACILITY_ICON[type];
  return (
    <span className="grid size-6 place-items-center rounded-full border-2 border-background bg-foreground text-background ring-1 ring-foreground">
      <Icon aria-hidden className="size-3.5" strokeWidth={2.25} />
    </span>
  );
}
