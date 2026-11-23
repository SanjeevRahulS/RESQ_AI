# RESQ AI

AI-powered disaster response coordination demo. Three pages:

- **Report Emergency** (`/`) — anyone can report by text, voice (Web Speech API) or up to 3 photos, with GPS, a draggable map pin and an address field. AI extracts type, people affected, hazards, needs, severity and a summary; the reporter reviews and confirms. Reports are saved before AI runs, so nothing is lost if AI fails (saved as "Unclassified").
- **Live Map** (`/map`) — staff sign-in required. Leaflet + OpenStreetMap, clustered severity markers, filters, side panel / bottom sheet, live updates (background refresh every few seconds).
- **Command Dashboard** (`/dashboard`) — staff sign-in required. Stats, severity chart, triage queue (severity, then age), incident detail with status workflow (new → verified → dispatched → resolved) and editable severity, a full change log, and a "Needs review" tab to merge or keep suspected duplicates.

## Duplicate detection

After a report is confirmed, incidents of the same type within 300 m (Haversine) from the last 6 hours that are not resolved are compared by AI. Similarity ≥ 0.75 links the report and increments the original's report count; 0.5–0.75 flags it for review; below 0.5 it stays new. At 3 reports the original's severity rises one level. Reports are never deleted.

## Stack

TanStack Start (React 19, Vite), Tailwind v4, Lovable Cloud (database, private storage), Lovable AI Gateway via the AI SDK. All data reads, writes, AI calls and secrets go through server functions (`src/lib/incidents/*.functions.ts`, `src/lib/auth/staff.functions.ts`, `src/lib/ai/*.server.ts`); reporter phone numbers are never sent to the browser.

## Staff access

The Live Map and Command Dashboard need a staff account; reporting an emergency never does. There is no self-sign-up: an admin creates the account and picks a role (admin or responder) from the **Team access** panel on the dashboard. A signed-in account without a role sees "No command staff access". The last remaining admin can't be removed or demoted.

Demo sign-in: `command@resq.ai` / `ResqDemo2026!` (admin).

## Demo data

`drizzle/migrations/0000_seed_demo_incidents.sql` inserts 14 sample reports around Chennai — 2 critical, 3 high, 4 medium, 2 low, 1 unclassified — in every workflow status, including a flooded underpass that three people reported independently (its severity was raised by the duplicate rules) and one suspected duplicate waiting on the "Needs review" tab.

## Develop

```bash
bun install
bun run dev
bunx vitest run   # rule tests in src/test
```
