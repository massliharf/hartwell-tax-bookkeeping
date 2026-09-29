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
