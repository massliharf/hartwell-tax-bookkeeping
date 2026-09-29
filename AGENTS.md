<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project brief

- Read and follow `PROJECT_BRIEF.md` at the project root at the start of every
  request — it is the source of truth for scope, business rules, service data,
  privacy constraints, and brand. When a request conflicts with it, flag the
  conflict instead of silently overriding it.
  _Why: this is a real client project (Patel Tax & Bookkeeping); the rules there
  (instant booking, never ask for an SSN, `getNow()` for all time logic) are
  non-negotiable and must survive every session._
- Brand primitives live in src/components/brand (ReadyRing, DocumentStack, Reveal); service data in src/lib/services.ts — single source for prices/hours.
- All DB tables are owner-only via RLS (is_owner()); clients act only through token-validated server functions in src/lib/portal.functions.ts using the admin client.
- Time logic on the server uses getNow() in src/lib/clock.server.ts (real time + settings.demo_time_offset_minutes).
- Automations live in src/lib/automations.server.ts; every message goes through sendMessage() in src/lib/email.server.ts, which claims a unique messages.dedupe_key before sending. _Why: the 15-min job and immediate triggers can overlap; nothing may send twice._
- The 15-min pg_cron job calls /api/public/cron/automations on the published URL with the token from public.automation_config (service-role only). _Why: agent can't place LOVABLE_CRON_SECRET into SQL._
