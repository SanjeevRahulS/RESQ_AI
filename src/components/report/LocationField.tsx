import { lazy, Suspense } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { Crosshair, Loader2, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGeolocation } from "@/hooks/useGeolocation";
import { DEFAULT_CENTER } from "@/lib/incidents/constants";

const LocationPickerMap = lazy(() => import("./LocationPickerMap"));

interface Props {
  position: [number, number] | null;
  onPositionChange: (pos: [number, number] | null) => void;
  address: string;
  onAddressChange: (v: string) => void;
  disabled?: boolean;
}

function MapFallback() {
  return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading map…</div>;
}

export function LocationField({ position, onPositionChange, address, onAddressChange, disabled }: Props) {
  const { state, locate } = useGeolocation();

  const useMyLocation = async () => {
    const result = await locate();
    if (result.status === "success") onPositionChange([result.latitude, result.longitude]);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="secondary" onClick={useMyLocation} disabled={disabled || state.status === "locating"}>
          {state.status === "locating" ? (
            <Loader2 aria-hidden className="size-4 animate-spin" />
          ) : (
            <Crosshair aria-hidden className="size-4" />
          )}
          Use my current location
        </Button>
        {!position && (
          <Button type="button" variant="ghost" onClick={() => onPositionChange(DEFAULT_CENTER)} disabled={disabled}>
            <MapPin aria-hidden className="size-4" /> Place pin manually
          </Button>
        )}
      </div>
      <div aria-live="polite" className="text-sm">
        {state.status === "success" && (
          <p className="text-sev-low">Location found (±{Math.round(state.accuracy)} m). Drag the pin if it's off.</p>
        )}
        {state.status === "error" && <p className="text-sev-high">{state.message}</p>}
      </div>

      {position && (
        <div className="space-y-1.5">
          <div className="h-56 overflow-hidden rounded-lg border sm:h-64">
            <ClientOnly fallback={<MapFallback />}>
              <Suspense fallback={<MapFallback />}>
                <LocationPickerMap position={position} onChange={(lat, lng) => onPositionChange([lat, lng])} />
              </Suspense>
            </ClientOnly>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>
              Pin: {position[0].toFixed(5)}, {position[1].toFixed(5)} — drag the pin or tap the map to correct it.
            </span>
            <button
              type="button"
              className="rounded underline underline-offset-2 hover:text-foreground"
              onClick={() => onPositionChange(null)}
              disabled={disabled}
            >
              Remove pin
            </button>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="report-address">Address or landmark</Label>
        <Input
          id="report-address"
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          placeholder="e.g. Near Velachery bus stop, Chennai"
          maxLength={300}
          autoComplete="street-address"
          disabled={disabled}
        />
      </div>
    </div>
  );
}
