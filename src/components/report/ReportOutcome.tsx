import { useEffect, useRef } from "react";
import { CheckCircle2, Link2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ReportOutcome({ outcome, onReset }: { outcome: "received" | "linked"; onReset: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus(), []);
  const linked = outcome === "linked";
  const Icon = linked ? Link2 : CheckCircle2;
  return (
    <div role="status" className="flex flex-col items-center gap-4 rounded-xl border bg-surface px-6 py-12 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-sev-low/15 text-sev-low">
        <Icon aria-hidden className="size-8" />
      </span>
      <h2 ref={headingRef} tabIndex={-1} className="text-2xl font-bold tracking-tight outline-none">
        {linked ? "Your report was linked to an existing incident" : "Your report was received"}
      </h2>
      <p className="max-w-md text-muted-foreground">
        Responders have been notified. If you are in danger, move to safety and call your local emergency number.
      </p>
      <Button onClick={onReset} variant="secondary" size="lg">
        Submit another report
      </Button>
    </div>
  );
}
