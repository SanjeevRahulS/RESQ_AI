// Browser-only (Leaflet). Loaded with React.lazy behind <ClientOnly>.
import "leaflet/dist/leaflet.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.Default.css";
import L from "leaflet";
import { forwardRef, useImperativeHandle, useRef } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";

import { DEFAULT_CENTER, SEVERITY_LABEL, TYPE_LABEL } from "@/lib/incidents/constants";
import type { Incident } from "@/lib/incidents/types";
import { FACILITY_LABEL, type Facility } from "@/lib/facilities/constants";
import { facilityIcon, severityIcon } from "./severityIcon";

export interface IncidentMapHandle {
  fitAll: () => void;
  locate: () => Promise<string | null>;
}

interface Props {
  incidents: Incident[];
  /** Shelters/hospitals layer; pass an empty list when the layer is off. */
  facilities: Facility[];
  freshIds: Set<string>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const IncidentMap = forwardRef<IncidentMapHandle, Props>(function IncidentMap(
  { incidents, facilities, freshIds, selectedId, onSelect },
  ref,
) {
  const mapRef = useRef<L.Map | null>(null);
  const meRef = useRef<L.CircleMarker | null>(null);

  useImperativeHandle(ref, () => ({
    fitAll: () => {
      const map = mapRef.current;
      if (!map) return;
      const pts = incidents.map((i) => [i.latitude!, i.longitude!] as [number, number]);
      if (pts.length === 0) return;
      if (pts.length === 1) map.setView(pts[0]!, 15);
      else map.fitBounds(L.latLngBounds(pts), { padding: [48, 48], maxZoom: 16 });
    },
    locate: () =>
      new Promise((resolve) => {
        if (!navigator.geolocation) return resolve("This browser can't share your location.");
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const map = mapRef.current;
            if (!map) return resolve(null);
            const ll: [number, number] = [pos.coords.latitude, pos.coords.longitude];
            meRef.current?.remove();
            meRef.current = L.circleMarker(ll, {
              radius: 8,
              color: "#0A1128",
              weight: 2,
              fillColor: "#7dd3fc",
              fillOpacity: 1,
            })
              .bindTooltip("You are here")
              .addTo(map);
            map.setView(ll, 15);
            resolve(null);
          },
          () => resolve("Couldn't get your location. Check location permission."),
          { enableHighAccuracy: true, timeout: 12_000 },
        );
      }),
  }));

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={12}
      ref={mapRef}
      className="h-full w-full"
      zoomControl
      aria-label="Map of active incidents"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MarkerClusterGroup chunkedLoading maxClusterRadius={45} showCoverageOnHover={false}>
        {incidents.map((incident) => {
          const label = `${SEVERITY_LABEL[incident.severity]} ${
            incident.incident_type ? TYPE_LABEL[incident.incident_type] : "incident"
          }${incident.address_text ? ` — ${incident.address_text}` : ""}`;
          return (
            <Marker
              key={incident.id}
              position={[incident.latitude!, incident.longitude!]}
              icon={severityIcon(incident.severity, freshIds.has(incident.id))}
              title={label}
              alt={label}
              zIndexOffset={incident.id === selectedId ? 1000 : 0}
              eventHandlers={{ click: () => onSelect(incident.id) }}
            />
          );
        })}
      </MarkerClusterGroup>
      {facilities.map((f) => (
        <Marker
          key={f.id}
          position={[f.latitude, f.longitude]}
          icon={facilityIcon(f.type)}
          title={`${FACILITY_LABEL[f.type]}: ${f.name}`}
          alt={`${FACILITY_LABEL[f.type]}: ${f.name}`}
          zIndexOffset={-500}
        >
          <Popup>
            <strong>{f.name}</strong>
            <br />
            {FACILITY_LABEL[f.type]}
            {f.capacity != null && ` · capacity ${f.capacity}`}
            {f.contact && (
              <>
                <br />
                Contact: {f.contact}
              </>
            )}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
});

export default IncidentMap;
