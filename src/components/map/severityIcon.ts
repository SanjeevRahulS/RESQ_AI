// Browser-only: builds Leaflet div icons. Imported only by lazily loaded map modules.
import L from "leaflet";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { SEVERITY_ICON, SEVERITY_VAR } from "@/components/incidents/SeverityBadge";
import type { Severity } from "@/lib/incidents/constants";
import { FACILITY_ICON } from "@/components/facilities/FacilityIcon";
import type { FacilityType } from "@/lib/facilities/constants";

const cache = new Map<string, L.DivIcon>();

export function severityIcon(severity: Severity, fresh = false): L.DivIcon {
  const key = `${severity}-${fresh}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const svg = renderToStaticMarkup(
    createElement(SEVERITY_ICON[severity], { size: 18, strokeWidth: 2.5, "aria-hidden": true }),
  );
  const icon = L.divIcon({
    className: "resq-marker",
    html: `<span class="resq-pin${fresh ? " resq-pin--fresh" : ""}" style="--pin-color:${SEVERITY_VAR[severity]}">${svg}</span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
  cache.set(key, icon);
  return icon;
}

export function reporterPinIcon(): L.DivIcon {
  return L.divIcon({
    className: "resq-marker",
    html: `<span class="resq-pin" style="--pin-color:var(--primary)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z"/><circle cx="12" cy="10" r="2.5"/></svg></span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

const facilityCache = new Map<FacilityType, L.DivIcon>();

/** Round light marker with a dark glyph — distinct from the square severity pins. */
export function facilityIcon(type: FacilityType): L.DivIcon {
  const hit = facilityCache.get(type);
  if (hit) return hit;
  const svg = renderToStaticMarkup(
    createElement(FACILITY_ICON[type], { size: 15, strokeWidth: 2.25, "aria-hidden": true }),
  );
  const icon = L.divIcon({
    className: "resq-marker",
    html: `<span class="resq-facility">${svg}</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
  facilityCache.set(type, icon);
  return icon;
}
