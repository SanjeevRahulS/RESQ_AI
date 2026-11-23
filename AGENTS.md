<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- Incident reads and dashboard actions are server functions behind `requireStaff` (`src/lib/auth/staff-middleware.ts`), querying as the user so RLS (`is_staff`) also applies; only `submitReport`/`confirmReport` and photo upload slots are public — anonymous reporting must keep working while incident data stays staff-only.
- Staff roles live in `public.user_roles` (admin, responder) checked via security-definer `has_role`/`is_staff`; roles are granted only from the backend, never by sign-up — prevents privilege escalation.
- Staff pages (map, dashboard) live under `src/routes/_authenticated/` (client-only gate, redirects to `/auth`); the event-log actor is the signed-in email from the token, never client input.
- Triage thresholds and queue/stat logic live as pure functions in `src/lib/incidents/rules.ts`, `filters.ts` and `stats.ts`, covered by `src/test/incident-rules.test.ts` — change rules there, not inline in components.
- Report photos are in a private bucket with no browser policies: uploads use server-issued signed upload slots and viewing uses server-signed URLs for photos attached to an incident — the workspace blocks public buckets and anonymous uploads must stay confined.
- Leaflet is browser-only: map components are `React.lazy` modules rendered inside `<ClientOnly>`, and `.leaflet-container` is isolated so its panes never cover the header or dialogs.
