import { Check, Loader2 } from "lucide-react";

import { STATUS_LABEL, WORKFLOW_STATUSES, type IncidentStatus } from "@/lib/incidents/constants";
import { cn } from "@/lib/utils";

type WorkflowStatus = (typeof WORKFLOW_STATUSES)[number];

interface Props {
  status: IncidentStatus;
  pending: WorkflowStatus | null;
  onChange: (status: WorkflowStatus) => void;
}

/** New → Verified → Dispatched → Resolved. Any step can be chosen; each change is logged. */
export function StatusWorkflow({ status, pending, onChange }: Props) {
  const currentIdx = WORKFLOW_STATUSES.indexOf(status as WorkflowStatus);
  return (
    <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Status workflow">
      {WORKFLOW_STATUSES.map((s, idx) => {
        const current = s === status;
        const done = currentIdx > idx;
        return (
          <li key={s}>
            <button
              type="button"
              onClick={() => onChange(s)}
              disabled={current || pending !== null}
              aria-pressed={current}
              aria-label={current ? `${STATUS_LABEL[s]} (current status)` : `Set status to ${STATUS_LABEL[s]}`}
              className={cn(
                "flex w-full items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-sm font-medium transition-colors",
                current && "border-primary bg-primary text-primary-foreground",
                !current && done && "border-primary/40 text-foreground",
                !current && !done && "text-muted-foreground hover:border-primary hover:text-foreground",
                "disabled:cursor-default",
                pending !== null && !current && "opacity-60",
              )}
            >
              {pending === s ? (
                <Loader2 aria-hidden className="size-4 animate-spin" />
              ) : done || current ? (
                <Check aria-hidden className="size-4" />
              ) : (
                <span aria-hidden className="text-xs tabular-nums">
                  {idx + 1}
                </span>
              )}
              {STATUS_LABEL[s]}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
