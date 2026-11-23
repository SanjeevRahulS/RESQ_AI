import { CircleCheck, CircleHelp, OctagonAlert, TriangleAlert, CircleAlert, type LucideIcon } from "lucide-react";

import { SEVERITY_LABEL, type Severity } from "@/lib/incidents/constants";
import { cn } from "@/lib/utils";

export const SEVERITY_ICON: Record<Severity, LucideIcon> = {
  critical: OctagonAlert,
  high: TriangleAlert,
  medium: CircleAlert,
  low: CircleCheck,
  unclassified: CircleHelp,
};

/** Tailwind classes per severity: text, border and tinted background. */
export const SEVERITY_STYLE: Record<Severity, string> = {
  critical: "text-sev-critical border-sev-critical/60 bg-sev-critical/15",
  high: "text-sev-high border-sev-high/60 bg-sev-high/15",
  medium: "text-sev-medium border-sev-medium/60 bg-sev-medium/15",
  low: "text-sev-low border-sev-low/60 bg-sev-low/15",
  unclassified: "text-sev-unclassified border-sev-unclassified/50 bg-sev-unclassified/10",
};

/** CSS variable for map pins and charts. */
export const SEVERITY_VAR: Record<Severity, string> = {
  critical: "var(--sev-critical)",
  high: "var(--sev-high)",
  medium: "var(--sev-medium)",
  low: "var(--sev-low)",
  unclassified: "var(--sev-unclassified)",
};

export function SeverityBadge({
  severity,
  size = "md",
  className,
}: {
  severity: Severity;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const Icon = SEVERITY_ICON[severity];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-md border font-semibold uppercase tracking-wide",
        size === "sm" && "px-1.5 py-0.5 text-[13px]",
        size === "md" && "px-2 py-1 text-xs",
        size === "lg" && "px-3 py-1.5 text-sm",
        SEVERITY_STYLE[severity],
        className,
      )}
    >
      <Icon aria-hidden className={size === "lg" ? "size-4" : "size-3.5"} />
      <span>{SEVERITY_LABEL[severity]}</span>
    </span>
  );
}
