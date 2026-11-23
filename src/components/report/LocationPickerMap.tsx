// Browser-only (Leaflet). Loaded with React.lazy behind <ClientOnly>.
import "leaflet/dist/leaflet.css";
import type L from "leaflet";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";

import { reporterPinIcon } from "@/components/map/severityIcon";

interface Props {
  position: [number, number];
  onChange: (lat: number, lng: number) => void;
}

function Recenter({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(position, Math.max(map.getZoom(), 15), { animate: true });
  }, [map, position]);
  return null;
}

function ClickToMove({ onChange }: Pick<Props, "onChange">) {
  useMapEvents({ click: (e) => onChange(e.latlng.lat, e.latlng.lng) });
  return null;
}

export default function LocationPickerMap({ position, onChange }: Props) {
  const icon = useMemo(() => reporterPinIcon(), []);
  return (
    <MapContainer center={position} zoom={15} scrollWheelZoom={false} className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter position={position} />
      <ClickToMove onChange={onChange} />
      <Marker
        position={position}
        draggable
        icon={icon}
        title="Incident location — drag to adjust"
        alt="Incident location pin"
        eventHandlers={{
          dragend: (e) => {
            const ll = (e.target as L.Marker).getLatLng();
            onChange(ll.lat, ll.lng);
          },
        }}
      />
    </MapContainer>
  );
}
