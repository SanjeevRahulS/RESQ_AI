import { useCallback, useState } from "react";

export type GeoState =
  | { status: "idle" }
  | { status: "locating" }
  | { status: "success"; latitude: number; longitude: number; accuracy: number }
  | { status: "error"; message: string };

const MESSAGES: Record<number, string> = {
  1: "Location permission was denied. Drag the pin on the map or type an address instead.",
  2: "Your location is unavailable right now. Drag the pin or type an address.",
  3: "Finding your location took too long. Drag the pin or type an address.",
};

export function useGeolocation() {
  const [state, setState] = useState<GeoState>({ status: "idle" });

  const locate = useCallback((): Promise<GeoState> => {
    return new Promise((resolve) => {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        const s: GeoState = { status: "error", message: "This browser can't share location. Drag the pin or type an address." };
        setState(s);
        resolve(s);
        return;
      }
      setState({ status: "locating" });
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const s: GeoState = {
            status: "success",
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };
          setState(s);
          resolve(s);
        },
        (err) => {
          const s: GeoState = { status: "error", message: MESSAGES[err.code] ?? "Could not get your location." };
          setState(s);
          resolve(s);
        },
        { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 },
      );
    });
  }, []);

  return { state, locate };
}
