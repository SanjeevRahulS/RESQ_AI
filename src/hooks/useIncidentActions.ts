import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { deleteIncident, resolveReview, updateIncident } from "@/lib/incidents/incidents.functions";
import { incidentKeys } from "@/lib/incidents/queries";
import type { IncidentStatus, Severity } from "@/lib/incidents/constants";

type WorkflowStatus = Exclude<IncidentStatus, "needs_review">;

function errorMessage(err: unknown) {
  return err instanceof Error && err.message ? err.message : "Something went wrong. Please try again.";
}

export function useIncidentActions() {
  const queryClient = useQueryClient();
  const update = useServerFn(updateIncident);
  const review = useServerFn(resolveReview);
  const remove = useServerFn(deleteIncident);
  const refresh = () => queryClient.invalidateQueries({ queryKey: incidentKeys.all });

  const updateMutation = useMutation({
    mutationFn: (vars: { id: string; status?: WorkflowStatus; severity?: Severity }) =>
      update({ data: vars }),
    onSuccess: (res, vars) => {
      if (res.changed) toast.success(vars.status ? "Status updated" : "Severity updated");
      return refresh();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const reviewMutation = useMutation({
    mutationFn: (vars: { id: string; action: "merge" | "keep" }) => review({ data: vars }),
    onSuccess: (_res, vars) => {
      toast.success(vars.action === "merge" ? "Merged into existing incident" : "Kept as a separate incident");
      return refresh();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (vars: { id: string }) => remove({ data: vars }),
    onSuccess: () => {
      toast.success("Report deleted");
      return refresh();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return { updateMutation, reviewMutation, deleteMutation };
}
