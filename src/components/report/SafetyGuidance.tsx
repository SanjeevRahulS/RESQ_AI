import { Phone, ShieldCheck } from "lucide-react";

import { TYPE_LABEL, type IncidentType } from "@/lib/incidents/constants";
import { EMERGENCY_NUMBERS, safetyStepsFor } from "@/lib/incidents/safety";

export function SafetyGuidance({ type }: { type: IncidentType | null }) {
  const steps = safetyStepsFor(type);
  return (
    <section aria-labelledby="safety-heading" className="rounded-md border bg-surface p-5 text-left">
      <h2 id="safety-heading" className="flex items-center gap-2 text-lg font-semibold">
        <ShieldCheck aria-hidden className="size-5 text-primary" />
        Stay safe right now
      </h2>
      {type && type !== "other" && <p className="label-caps mt-1">{TYPE_LABEL[type]}</p>}
      <ol className="mt-3 space-y-2">
        {steps.map((step, i) => (
          <li key={step} className="flex gap-3">
            <span className="font-mono text-sm text-muted-foreground">{i + 1}.</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      <ul className="mt-4 flex flex-wrap gap-2 border-t pt-4" aria-label="Emergency numbers">
        {EMERGENCY_NUMBERS.map(({ number, label }) => (
          <li key={number}>
            <a
              href={`tel:${number}`}
              className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              <Phone aria-hidden className="size-4 text-primary" />
              {label} <span className="font-mono">{number}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
