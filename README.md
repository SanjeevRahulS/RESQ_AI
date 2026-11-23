# RESQ AI

AI-powered disaster response coordination demo. Three pages:

- **Report Emergency** (`/`) — anyone can report by text, voice (Web Speech API) or up to 3 photos, with GPS, a draggable map pin and an address field. AI extracts type, people affected, hazards, needs, severity and a summary; the reporter reviews and confirms. Reports are saved before AI runs, so nothing is lost if AI fails (saved as "Unclassified").
- **Live Map** (`/map`) — Leaflet + OpenStreetMap, clustered severity markers, filters, side panel / bottom sheet, live updates (background refresh every few seconds).
- **Command Dashboard** (`/dashboard`) — stats, severity chart, triage queue (severity, then age), incident detail with status workflow (new → verified → dispatched → resolved) and editable severity, a full change log, and a "Needs review" tab to merge or keep suspected duplicates.

## Duplicate detection

After a report is confirmed, incidents of the same type within 300 m (Haversine) from the last 6 hours that are not resolved are compared by AI. Similarity ≥ 0.75 links the report and increments the original's report count; 0.5–0.75 flags it for review; below 0.5 it stays new. At 3 reports the original's severity rises one level. Reports are never deleted.

## Stack

TanStack Start (React 19, Vite), Tailwind v4, Lovable Cloud (database, private storage), Lovable AI Gateway via the AI SDK. All data reads, writes, AI calls and secrets go through server functions (`src/lib/incidents/*.functions.ts`, `src/lib/ai/*.server.ts`); reporter phone numbers are never sent to the browser.

## Develop

```bash
bun install
bun run dev
bunx vitest run   # rule tests in src/test
```

This demo has no login: the dashboard is open and every change records the operator name entered on the dashboard. Add authentication before real-world use.
