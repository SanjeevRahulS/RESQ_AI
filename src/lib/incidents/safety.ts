import type { IncidentType } from "./constants";

/** Immediate, plain-language safety actions shown to the reporter after they submit. */
export const SAFETY_STEPS: Record<IncidentType, string[]> = {
  flood: [
    "Move to higher ground or an upper floor now.",
    "Do not walk or drive through flood water.",
    "Switch off electricity at the main switch if you can do it safely.",
    "Stay away from drains, canals and fallen power lines.",
  ],
  fire: [
    "Get everyone out and stay out.",
    "Stay low under smoke and cover your nose and mouth.",
    "Do not use lifts.",
    "Call 101 once you are outside.",
  ],
  earthquake: [
    "Drop, take cover under sturdy furniture and hold on until the shaking stops.",
    "Stay away from windows and heavy objects that can fall.",
    "When it stops, go to an open area away from buildings and wires.",
    "Expect aftershocks.",
  ],
  medical: [
    "Call 108 for an ambulance.",
    "Keep the person still and check that they are breathing.",
    "Press firmly on heavy bleeding with a clean cloth.",
    "Do not give food or water to someone who is unconscious.",
  ],
  collapse: [
    "Move away from the damaged structure and do not go back inside.",
    "Do not try to lift heavy debris yourself. Wait for rescue teams.",
    "If you smell gas, do not light matches or use switches.",
    "Keep others away from the area.",
  ],
  other: [
    "Move away from the danger to a safe place.",
    "Keep others away from the area.",
    "Follow instructions from police and responders.",
    "Call 112 if the situation gets worse.",
  ],
};

export function safetyStepsFor(type: IncidentType | null): string[] {
  return SAFETY_STEPS[type ?? "other"];
}

export const EMERGENCY_NUMBERS = [
  { number: "112", label: "Emergency" },
  { number: "108", label: "Ambulance" },
  { number: "101", label: "Fire" },
] as const;
