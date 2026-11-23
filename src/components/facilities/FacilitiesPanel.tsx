import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Building, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FACILITY_LABEL, FACILITY_TYPES, type Facility, type FacilityType } from "@/lib/facilities/constants";
import { saveFacility } from "@/lib/facilities/facilities.functions";
import { facilitiesQuery, facilityKeys } from "@/lib/facilities/queries";
import { FacilityMarkerSwatch } from "./FacilityIcon";

interface Draft {
  id?: string;
  name: string;
  type: FacilityType;
  latitude: string;
  longitude: string;
  capacity: string;
  contact: string;
}

const EMPTY: Draft = { name: "", type: "shelter", latitude: "", longitude: "", capacity: "", contact: "" };

function errorMessage(err: unknown) {
  return err instanceof Error && err.message ? err.message : "Something went wrong. Please try again.";
}

function parseCoord(value: string, limit: number): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && Math.abs(n) <= limit ? n : null;
}

/** Admins only: add and edit the shelters, hospitals and relief camps shown on the Live Map. */
export function FacilitiesPanel() {
  const queryClient = useQueryClient();
  const { data, isPending, isError } = useQuery(facilitiesQuery());
  const save = useServerFn(saveFacility);
  const [draft, setDraft] = useState<Draft>(EMPTY);

  const lat = parseCoord(draft.latitude, 90);
  const lng = parseCoord(draft.longitude, 180);
  const capacityValue = draft.capacity.trim() === "" ? null : Number(draft.capacity);
  const capacityOk = capacityValue === null || (Number.isInteger(capacityValue) && capacityValue >= 0);
  const valid = draft.name.trim() !== "" && lat !== null && lng !== null && capacityOk;

  const saveMutation = useMutation({
    mutationFn: () =>
      save({
        data: {
          ...(draft.id ? { id: draft.id } : {}),
          name: draft.name,
          type: draft.type,
          latitude: lat!,
          longitude: lng!,
          capacity: capacityValue,
          contact: draft.contact.trim() || null,
        },
      }),
    onSuccess: () => {
      toast.success(draft.id ? "Facility updated" : "Facility added");
      setDraft(EMPTY);
      return queryClient.invalidateQueries({ queryKey: facilityKeys.all });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const edit = (f: Facility) =>
    setDraft({
      id: f.id,
      name: f.name,
      type: f.type,
      latitude: String(f.latitude),
      longitude: String(f.longitude),
      capacity: f.capacity == null ? "" : String(f.capacity),
      contact: f.contact ?? "",
    });

  return (
    <section className="rounded-md border bg-surface p-4 sm:p-5" aria-labelledby="facilities-heading">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-md bg-secondary">
          <Building aria-hidden className="size-4 text-primary" />
        </span>
        <div className="min-w-0">
          <h2 id="facilities-heading" className="font-bold tracking-tight">
            Shelters and hospitals
          </h2>
          <p className="text-sm text-muted-foreground">
            Shown on the Live Map when the shelters and hospitals layer is turned on.
          </p>
        </div>
      </div>

      <form
        className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) saveMutation.mutate();
        }}
      >
        <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
          <Label htmlFor="fac-name">Name</Label>
          <Input
            id="fac-name"
            value={draft.name}
            maxLength={120}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="Community hall, Mylapore"
            required
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <span className="text-sm font-medium" id="fac-type-label">
            Type
          </span>
          <div className="flex flex-wrap gap-1.5" role="group" aria-labelledby="fac-type-label">
            {FACILITY_TYPES.map((t) => (
              <Button
                key={t}
                type="button"
                size="sm"
                variant={draft.type === t ? "default" : "outline"}
                aria-pressed={draft.type === t}
                onClick={() => setDraft({ ...draft, type: t })}
              >
                {FACILITY_LABEL[t]}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fac-lat">Latitude</Label>
          <Input
            id="fac-lat"
            inputMode="decimal"
            className="font-mono"
            value={draft.latitude}
            onChange={(e) => setDraft({ ...draft, latitude: e.target.value })}
            placeholder="13.0475"
            aria-invalid={draft.latitude !== "" && lat === null}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fac-lng">Longitude</Label>
          <Input
            id="fac-lng"
            inputMode="decimal"
            className="font-mono"
            value={draft.longitude}
            onChange={(e) => setDraft({ ...draft, longitude: e.target.value })}
            placeholder="80.2397"
            aria-invalid={draft.longitude !== "" && lng === null}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fac-capacity">Capacity (optional)</Label>
          <Input
            id="fac-capacity"
            inputMode="numeric"
            value={draft.capacity}
            onChange={(e) => setDraft({ ...draft, capacity: e.target.value })}
            placeholder="300"
            aria-invalid={!capacityOk}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
          <Label htmlFor="fac-contact">Contact (optional)</Label>
          <Input
            id="fac-contact"
            value={draft.contact}
            maxLength={120}
            onChange={(e) => setDraft({ ...draft, contact: e.target.value })}
            placeholder="044 1234 5678"
          />
        </div>
        <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-3">
          <Button type="submit" disabled={saveMutation.isPending || !valid}>
            {saveMutation.isPending && <Loader2 aria-hidden className="size-4 animate-spin" />}
            {draft.id ? "Save changes" : "Add facility"}
          </Button>
          {draft.id && (
            <Button type="button" variant="ghost" onClick={() => setDraft(EMPTY)}>
              Cancel edit
            </Button>
          )}
        </div>
      </form>

      {isPending ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 aria-hidden className="size-4 animate-spin" /> Loading facilities…
        </p>
      ) : isError ? (
        <p className="mt-4 text-sm text-sev-critical">Facilities could not be loaded.</p>
      ) : (
        <ul className="mt-4 divide-y divide-border rounded-md border bg-background/40" aria-label="Facilities">
          {(data ?? []).map((f) => (
            <li key={f.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
              <FacilityMarkerSwatch type={f.type} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{f.name}</p>
                <p className="text-xs text-muted-foreground">
                  {FACILITY_LABEL[f.type]}
                  {f.capacity != null && ` · capacity ${f.capacity}`}
                  {f.contact && ` · ${f.contact}`}
                  {" · "}
                  <span className="font-mono">
                    {f.latitude.toFixed(4)}, {f.longitude.toFixed(4)}
                  </span>
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => edit(f)} aria-label={`Edit ${f.name}`}>
                <Pencil aria-hidden className="size-3.5" /> Edit
              </Button>
            </li>
          ))}
          {(data ?? []).length === 0 && <li className="px-3 py-4 text-sm text-muted-foreground">No facilities yet.</li>}
        </ul>
      )}
    </section>
  );
}
