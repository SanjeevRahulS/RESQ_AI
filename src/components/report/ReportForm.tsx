import { useEffect, useState } from "react";
import { AlertTriangle, Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LocationField } from "./LocationField";
import { PhotoPicker } from "./PhotoPicker";
import { VoiceInputButton } from "./VoiceInputButton";

export interface ReportDraft {
  text: string;
  photos: File[];
  position: [number, number] | null;
  address: string;
  phone: string;
}

const DRAFT_KEY = "resq-report-draft";

interface Props {
  draft: ReportDraft;
  onDraftChange: (draft: ReportDraft) => void;
  onSubmit: () => void;
  submitting: boolean;
  submitStage: string | null;
  error: string | null;
}

/** Restores and persists the text parts of an unsent report so a failed send never loses it. */
export function useDraftPersistence(draft: ReportDraft, setDraft: (d: ReportDraft) => void) {
  const [restored, setRestored] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<ReportDraft>;
        setDraft({
          ...draft,
          text: parsed.text ?? "",
          address: parsed.address ?? "",
          phone: parsed.phone ?? "",
          position: parsed.position ?? null,
        });
      }
    } catch {
      // ignore unreadable drafts
    }
    setRestored(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!restored) return;
    const { text, address, phone, position } = draft;
    if (!text && !address && !phone && !position) localStorage.removeItem(DRAFT_KEY);
    else localStorage.setItem(DRAFT_KEY, JSON.stringify({ text, address, phone, position }));
  }, [draft, restored]);
  return () => localStorage.removeItem(DRAFT_KEY);
}

export function ReportForm({ draft, onDraftChange, onSubmit, submitting, submitStage, error }: Props) {
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [validation, setValidation] = useState<string | null>(null);
  const set = (patch: Partial<ReportDraft>) => onDraftChange({ ...draft, ...patch });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.text.trim() && draft.photos.length === 0) {
      setValidation("Describe what's happening or add at least one photo.");
      document.getElementById("report-text")?.focus();
      return;
    }
    if (draft.phone && !/^[+0-9 ()-]{6,30}$/.test(draft.phone.trim())) {
      setValidation("Enter a valid phone number, or leave it blank.");
      document.getElementById("report-phone")?.focus();
      return;
    }
    setValidation(null);
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6" aria-describedby="report-form-help">
      <p id="report-form-help" className="sr-only">
        All fields except the description or photos are optional.
      </p>

      <section className="space-y-3 rounded-md border bg-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="flex items-baseline gap-3">
            <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-sm border border-primary font-mono text-xs text-primary">1</span>
            <Label htmlFor="report-text" className="text-base font-semibold">
              Describe what is happening
            </Label>
          </div>
          <span className="font-mono text-xs text-muted-foreground">{draft.text.length}/5000</span>
        </div>
        <Textarea
          id="report-text"
          value={draft.text}
          onChange={(e) => set({ text: e.target.value })}
          rows={5}
          maxLength={5000}
          placeholder="Describe the emergency: what you see, how many people are affected, any injuries or dangers."
          className="text-base"
          disabled={submitting}
          aria-invalid={Boolean(validation) && !draft.text.trim() && draft.photos.length === 0}
        />
        <VoiceInputButton
          disabled={submitting}
          onTranscript={(t) => onDraftChange({ ...draft, text: draft.text ? `${draft.text.trimEnd()} ${t}` : t })}
        />
      </section>
      <section className="space-y-2 rounded-md border bg-surface p-4 sm:p-5">
        <Label htmlFor="report-phone" className="text-base font-semibold">
          Contact phone <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="report-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={draft.phone}
          onChange={(e) => set({ phone: e.target.value })}
          placeholder="+91 98765 43210"
          maxLength={30}
          disabled={submitting}
        />
        <p className="text-xs text-muted-foreground">Your contact number is only shown to authorized responders.</p>
      </section>
      <section className="space-y-3 rounded-md border bg-surface p-4 sm:p-5">
        <div className="flex items-baseline gap-3">
          <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-sm border border-primary font-mono text-xs text-primary">2</span>
          <h2 className="text-base font-semibold">Location</h2>
        </div>
        <LocationField
          position={draft.position}
          onPositionChange={(position) => set({ position })}
          address={draft.address}
          onAddressChange={(address) => set({ address })}
          disabled={submitting}
        />
      </section>
      <section className="space-y-3 rounded-md border bg-surface p-4 sm:p-5">
        <div className="flex items-baseline gap-3">
          <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-sm border border-primary font-mono text-xs text-primary">3</span>
          <h2 className="text-base font-semibold">Photos <span className="font-normal text-muted-foreground">(optional)</span></h2>
        </div>
        <PhotoPicker files={draft.photos} onChange={(photos) => set({ photos })} onError={setPhotoError} disabled={submitting} />
        {photoError && (
          <p role="alert" className="text-sm text-sev-high">
            {photoError}
          </p>
        )}
      </section>
      <section className="space-y-2 border-t pt-6">
        <div className="flex items-baseline gap-3">
          <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-sm border border-primary font-mono text-xs text-primary">4</span>
          <h2 className="text-base font-semibold">Review and send</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          After sending, you can check the automated summary of your report and correct it before it reaches responders.
        </p>
      </section>
      <div aria-live="assertive" className="space-y-2">
        {(validation || error) && (
          <div role="alert" className="flex gap-2 rounded-md border border-sev-critical/60 bg-sev-critical/10 p-3 text-sm">
            <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0 text-sev-critical" />
            <div>
              <p className="font-medium">{validation ?? error}</p>
              {error && !validation && (
                <p className="mt-1 text-muted-foreground">Your report is still here. Press Send report to try again.</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 -mx-3 border-t bg-background px-3 py-3 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
        <Button type="submit" size="lg" className="h-12 w-full text-base font-semibold" disabled={submitting}>
          {submitting ? <Loader2 aria-hidden className="size-5 animate-spin" /> : <Send aria-hidden className="size-5" />}
          {submitting ? (submitStage ?? "Sending…") : "Send report"}
        </Button>
      </div>
    </form>
  );
}
