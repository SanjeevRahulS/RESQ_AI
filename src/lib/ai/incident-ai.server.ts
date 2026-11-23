// Server-only: AI extraction and duplicate comparison through the Lovable AI Gateway.
// Never import this file from client code; server functions load it with a dynamic import.
import { createOpenAI } from "@ai-sdk/openai";
import { APICallError, jsonSchema, NoObjectGeneratedError, Output, streamText, type ModelMessage } from "ai";

import { INCIDENT_TYPES, SEVERITIES } from "@/lib/incidents/constants";
import type { ExtractedFields } from "@/lib/incidents/types";
import { limitWords } from "@/lib/incidents/rules";
import { createLovableAiGatewayRunIdFetch } from "./run-id";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6.1-sol";

export class AiUnavailableError extends Error {
  constructor(
    message: string,
    readonly status: number | undefined,
  ) {
    super(message);
    this.name = "AiUnavailableError";
  }
}

function createProvider() {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new AiUnavailableError("AI is not configured on the server.", 401);
  const runIdFetch = createLovableAiGatewayRunIdFetch();
  return createOpenAI({
    baseURL: GATEWAY_URL,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });
}

const providerOptions = {
  openai: {
    forceReasoning: true,
    reasoningEffort: "low",
    reasoningSummary: "auto",
    store: false,
    include: ["reasoning.encrypted_content"],
  },
} as const;

/** Streams a structured-output call and returns the parsed object, mapping failures to AiUnavailableError. */
async function runStructured<T>(instructions: string, messages: ModelMessage[], schema: object): Promise<T> {
  const provider = createProvider();
  try {
    const result = streamText({
      model: provider.responses(MODEL),
      instructions,
      messages,
      output: Output.object({ schema: jsonSchema<T>(schema as never) }),
      providerOptions,
    });
    // Drain the stream so errors surface, then read the validated object.
    for await (const _ of result.textStream) {
      // consumed server-side; only the final object is used
    }
    return (await result.output) as T;
  } catch (error) {
    if (error instanceof AiUnavailableError) throw error;
    if (APICallError.isInstance(error)) {
      throw new AiUnavailableError(error.message, error.statusCode);
    }
    if (NoObjectGeneratedError.isInstance(error)) {
      throw new AiUnavailableError("The AI returned an invalid result.", undefined);
    }
    const message = error instanceof Error ? error.message : "Unknown AI error";
    throw new AiUnavailableError(message, undefined);
  }
}

const EXTRACTION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "incident_type",
    "people_affected",
    "hazards",
    "needs",
    "severity",
    "severity_reason",
    "confidence",
    "summary",
  ],
  properties: {
    incident_type: { type: ["string", "null"], enum: [...INCIDENT_TYPES, null] },
    people_affected: { type: ["integer", "null"] },
    hazards: { type: "array", items: { type: "string" } },
    needs: { type: "array", items: { type: "string" } },
    severity: { type: "string", enum: [...SEVERITIES] },
    severity_reason: { type: "string" },
    confidence: { type: "number" },
    summary: { type: "string" },
  },
};

const EXTRACTION_INSTRUCTIONS = `You triage emergency reports for a disaster response command center.
Extract structured facts from ONE citizen report (text and any attached photos).

Strict rules:
- Use ONLY information stated in the report text or clearly visible in the photos. Never invent, assume or embellish details.
- If a field is not stated, use null (or an empty list for hazards/needs). people_affected is null unless a number or clear count is given.
- incident_type: one of flood, fire, earthquake, medical, collapse, other. Use null only if there is no indication at all.
- hazards: short phrases for dangers described (e.g. "strong current", "gas leak").
- needs: short phrases for help explicitly requested or obviously required by what is described (e.g. "ambulance", "boat rescue").
- severity:
  - critical: immediate threat to life — people trapped, unconscious/not breathing, fire with people inside, mass casualties.
  - high: serious danger or injuries, spreading hazard, many people displaced, urgent but not immediately fatal.
  - medium: single injury or contained hazard needing a response soon.
  - low: property damage or obstruction with no reported injuries or danger to life.
- severity_reason: exactly one sentence citing facts from the report.
- confidence: 0 to 1, how sure you are given how much detail the report contains.
- summary: a neutral summary of at most 25 words, only facts from the report.`;

export interface ImageInput {
  dataUrl: string;
}

export async function extractIncident(input: {
  rawText: string;
  addressText: string | null;
  images: ImageInput[];
}): Promise<ExtractedFields> {
  const text = [
    `Report text: """${input.rawText || "(no text provided)"}"""`,
    input.addressText ? `Reporter-entered address: ${input.addressText}` : null,
    input.images.length ? `${input.images.length} photo(s) attached.` : "No photos attached.",
  ]
    .filter(Boolean)
    .join("\n");

  const content: Array<{ type: "text"; text: string } | { type: "image"; image: URL }> = [
    { type: "text", text },
    ...input.images.map((img) => ({ type: "image" as const, image: new URL(img.dataUrl) })),
  ];

  const raw = await runStructured<{
    incident_type: ExtractedFields["incident_type"];
    people_affected: number | null;
    hazards: string[];
    needs: string[];
    severity: (typeof SEVERITIES)[number];
    severity_reason: string;
    confidence: number;
    summary: string;
  }>(EXTRACTION_INSTRUCTIONS, [{ role: "user", content }], EXTRACTION_SCHEMA);

  return normalizeExtraction(raw);
}

export function normalizeExtraction(raw: {
  incident_type: string | null;
  people_affected: number | null;
  hazards: string[];
  needs: string[];
  severity: string;
  severity_reason: string | null;
  confidence: number | null;
  summary: string | null;
}): ExtractedFields {
  const type = (INCIDENT_TYPES as readonly string[]).includes(raw.incident_type ?? "")
    ? (raw.incident_type as ExtractedFields["incident_type"])
    : null;
  const severity = (SEVERITIES as readonly string[]).includes(raw.severity)
    ? (raw.severity as ExtractedFields["severity"])
    : "unclassified";
  const clean = (list: string[]) =>
    Array.from(new Set((list ?? []).map((s) => s.trim()).filter(Boolean))).slice(0, 10);
  return {
    incident_type: type,
    people_affected:
      typeof raw.people_affected === "number" && Number.isFinite(raw.people_affected) && raw.people_affected >= 0
        ? Math.round(raw.people_affected)
        : null,
    hazards: clean(raw.hazards),
    needs: clean(raw.needs),
    severity,
    severity_reason: raw.severity_reason?.trim() || null,
    confidence:
      typeof raw.confidence === "number" ? Math.max(0, Math.min(1, raw.confidence)) : null,
    summary: raw.summary ? limitWords(raw.summary, 25) : null,
  };
}

const COMPARE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["is_duplicate", "similarity", "reason"],
  properties: {
    is_duplicate: { type: "boolean" },
    similarity: { type: "number" },
    reason: { type: "string" },
  },
};

const COMPARE_INSTRUCTIONS = `You compare two emergency reports that are already known to be the same incident type, within 300 metres and 6 hours of each other.
Decide whether they describe the SAME real-world incident.
- similarity: 0 to 1, how likely they are the same incident based on the details.
- is_duplicate: true only if you are confident they are the same incident. If uncertain, is_duplicate must be false.
- reason: one short sentence. Do not quote phone numbers or personal details.`;

export async function compareIncidents(a: string, b: string) {
  const raw = await runStructured<{ is_duplicate: boolean; similarity: number; reason: string }>(
    COMPARE_INSTRUCTIONS,
    [{ role: "user", content: `Report A: ${a}\n\nReport B: ${b}` }],
    COMPARE_SCHEMA,
  );
  return {
    is_duplicate: Boolean(raw.is_duplicate),
    similarity: Math.max(0, Math.min(1, Number(raw.similarity) || 0)),
    reason: (raw.reason ?? "").trim().slice(0, 300),
  };
}
