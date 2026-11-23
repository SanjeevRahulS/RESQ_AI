export const FACILITY_TYPES = ["shelter", "hospital", "relief_camp"] as const;
export type FacilityType = (typeof FACILITY_TYPES)[number];

export const FACILITY_LABEL: Record<FacilityType, string> = {
  shelter: "Shelter",
  hospital: "Hospital",
  relief_camp: "Relief camp",
};

export interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  latitude: number;
  longitude: number;
  capacity: number | null;
  contact: string | null;
  updated_at: string;
}
