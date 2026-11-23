import { Mic, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

export function VoiceInputButton({ onTranscript, disabled }: { onTranscript: (text: string) => void; disabled?: boolean }) {
  const { supported, listening, interim, error, start, stop } = useSpeechRecognition(onTranscript);

  if (supported === false) {
    return (
      <p role="status" className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
        Voice input isn't supported in this browser. Try Chrome, Edge or Safari, or type your report.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant={listening ? "destructive" : "secondary"}
          onClick={listening ? stop : start}
          disabled={disabled || supported === null}
          aria-pressed={listening}
        >
          {listening ? <Square aria-hidden className="size-4" /> : <Mic aria-hidden className="size-4" />}
          {listening ? "Stop recording" : "Record voice"}
        </Button>
        {listening && (
          <span className="flex items-center gap-2 text-sm font-medium text-sev-critical">
            <span aria-hidden className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-sev-critical opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-sev-critical" />
            </span>
            Recording…
          </span>
        )}
      </div>
      <div aria-live="polite" className="text-sm">
        {listening && interim && <p className="italic text-muted-foreground">“{interim}”</p>}
        {error && <p className="text-sev-critical">{error}</p>}
      </div>
    </div>
  );
}
