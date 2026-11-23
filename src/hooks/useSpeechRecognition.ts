import { useCallback, useEffect, useRef, useState } from "react";

// Minimal typings for the Web Speech API (not in lib.dom for all browsers).
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const ERROR_MESSAGES: Record<string, string> = {
  "not-allowed": "Microphone access was blocked. Allow it in your browser settings, or type instead.",
  "service-not-allowed": "Voice input is not allowed in this browser. Please type your report.",
  "no-speech": "No speech was detected. Try again and speak clearly.",
  "audio-capture": "No microphone was found.",
  network: "Voice recognition needs an internet connection.",
};

/**
 * Browser speech-to-text. `onFinal` receives each finalized phrase; `interim` shows
 * the in-progress phrase. `supported` is null until checked after hydration.
 */
export function useSpeechRecognition(onFinal: (text: string) => void) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const onFinalRef = useRef(onFinal);
  onFinalRef.current = onFinal;

  useEffect(() => {
    setSupported(getCtor() !== null);
    return () => recRef.current?.abort();
  }, []);

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor) {
      setSupported(false);
      return;
    }
    setError(null);
    const rec = new Ctor();
    rec.lang = navigator.language || "en-IN";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let pending = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]!;
        if (r.isFinal) onFinalRef.current(r[0].transcript.trim());
        else pending += r[0].transcript;
      }
      setInterim(pending);
    };
    rec.onerror = (e) => {
      if (e.error !== "aborted") setError(ERROR_MESSAGES[e.error] ?? `Voice input error: ${e.error}`);
    };
    rec.onend = () => {
      setListening(false);
      setInterim("");
    };
    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setError("Voice input could not start. Please try again.");
    }
  }, []);

  const stop = useCallback(() => {
    recRef.current?.stop();
  }, []);

  return { supported, listening, interim, error, start, stop };
}
