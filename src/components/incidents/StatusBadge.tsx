import { STATUS_LABEL, type IncidentStatus } from "@/lib/incidents/constants";
import { cn } from "@/lib/utils";

const STYLE: Record<IncidentStatus, string> = {
  new: "text-status-new border-status-new/50",
  verified: "text-status-verified border-status-verified/50",
  dispatched: "text-status-dispatched border-status-dispatched/50",
  resolved: "text-status-resolved border-status-resolved/50",
  needs_review: "text-status-review border-status-review/50",
};

export function StatusBadge({ status, className }: { status: IncidentStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-xs font-medium",
        STYLE[status],
        className,
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {STATUS_LABEL[status]}
    </span>
  );
}
