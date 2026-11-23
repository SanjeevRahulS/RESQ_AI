import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";

import { confirmReport, submitReport } from "@/lib/incidents/incidents.functions";
import { uploadReportPhotos } from "@/lib/incidents/photos";
import type { ExtractedFields } from "@/lib/incidents/types";
import { ConfirmationStep } from "./ConfirmationStep";
import { ReportForm, useDraftPersistence, type ReportDraft } from "./ReportForm";
import { ReportOutcome } from "./ReportOutcome";

const EMPTY: ReportDraft = { text: "", photos: [], position: null, address: "", phone: "" };

type Step =
  | { kind: "form" }
  | { kind: "review"; id: string; aiOk: boolean; extracted: ExtractedFields }
  | { kind: "done"; outcome: "received" | "linked" };

function message(err: unknown, fallback: string) {
  if (err instanceof Error && err.message && !err.message.startsWith("[")) return err.message;
  return fallback;
}

export function ReportFlow() {
  const [draft, setDraft] = useState<ReportDraft>(EMPTY);
  const [step, setStep] = useState<Step>({ kind: "form" });
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Uploaded photo paths are kept so a retry after a save failure doesn't re-upload.
  const [uploaded, setUploaded] = useState<{ files: File[]; paths: string[] } | null>(null);
  const clearDraft = useDraftPersistence(draft, setDraft);
  const submit = useServerFn(submitReport);
  const confirm = useServerFn(confirmReport);

  const handleSubmit = async () => {
    setBusy(true);
    setError(null);
    try {
      let paths: string[] = [];
      if (draft.photos.length) {
        if (uploaded && uploaded.files === draft.photos) {
          paths = uploaded.paths;
        } else {
          setStage("Uploading photos…");
          paths = await uploadReportPhotos(draft.photos);
          setUploaded({ files: draft.photos, paths });
        }
      }
      setStage("Analyzing report…");
      const result = await submit({
        data: {
          raw_text: draft.text.trim(),
          image_paths: paths,
          latitude: draft.position?.[0] ?? null,
          longitude: draft.position?.[1] ?? null,
          address_text: draft.address.trim() || null,
          contact_phone: draft.phone.trim() || null,
        },
      });
      clearDraft();
      setStep({ kind: "review", id: result.id, aiOk: result.aiOk, extracted: result.extracted });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(message(err, "We couldn't send your report. Check your connection and try again."));
    } finally {
      setBusy(false);
      setStage(null);
    }
  };

  const handleConfirm = async (fields: ExtractedFields) => {
    if (step.kind !== "review") return;
    setBusy(true);
    setError(null);
    try {
      const { outcome } = await confirm({ data: { id: step.id, fields } });
      setStep({ kind: "done", outcome });
    } catch (err) {
      setError(message(err, "We couldn't confirm your changes."));
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setDraft(EMPTY);
    setUploaded(null);
    setError(null);
    setStep({ kind: "form" });
  };

  if (step.kind === "done") return <ReportOutcome outcome={step.outcome} onReset={reset} />;
  if (step.kind === "review") {
    return (
      <ConfirmationStep
        aiOk={step.aiOk}
        initial={step.extracted}
        confirming={busy}
        error={error}
        onConfirm={handleConfirm}
      />
    );
  }
  return (
    <ReportForm
      draft={draft}
      onDraftChange={setDraft}
      onSubmit={handleSubmit}
      submitting={busy}
      submitStage={stage}
      error={error}
    />
  );
}
