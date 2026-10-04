# Project Handoff — CPF Group Analytics Dashboard

**Read this file first, before touching any code.** It's written the way a senior developer
would brief whoever picks this project up next — what exists, why it's built this way, what's
actually verified vs. assumed, and exactly what's left. Everything stated as fact below has
been checked (build/lint/type-check run, or a file read) as of 2026-10-04 — don't take it on
faith if you're about to make a decision that depends on it; re-verify first.

## 1. What this project is

A prototype multi-subsidiary analytics dashboard for **CPF Group**, covering three business
lines — **Rukisha** (digital wallet/lending), **CPF Financial Services** (pensions, trust,
agency), and **CPF Capital & Advisory** (capital markets, REITs) — built for a CPF Group
finance manager to compare business lines in one place. It's a **two-week academic/portfolio
build** (a Data & AI Unit "Dashboard & Data Product Build" exercise), not a production system:
no real authentication, no live data feed, dummy data only. That scope boundary was a
deliberate decision, not an oversight — see `docs/Phase 1 - Planning (Scope Note).docx`.

## 2. Read in this order

The `docs/` folder is the source of truth. Don't improvise architecture or scope — it's
already decided and documented. Read in this order:

1. `wk 7 - Dashboard & Data Product Build .pdf` — the assignment brief (the actual ask).
2. `Week 7 & 8 Workplan.pdf` — the original subsidiary/tech-stack scope.
3. `SDLC Document.pdf`, `Core Design Principles.pdf`, `Clean Coding Practices.pdf` — the
   standards every phase below is built against. Cited by section number throughout the code
   comments (e.g. "Core Design Principles §8") — those citations are real, not decorative.
4. `Software Design Document (SDD) Template.pdf` — the required template Phase 3 follows
   exactly.
5. `Week 7 & 8 Execution Plan.docx` — the 8-phase plan everything below maps to.
6. `Phase 1 - Planning (Scope Note).docx` → `Phase 2 - Analysis...docx` →
   `Phase 3 - Design (Software Design Document).docx` → `Phase 4 - Environment and CI-CD.docx`
   → `Phase 5 - Development.docx` — read in order. Each is a record of what was actually done,
   not just planned — Phase 4 and 5 in particular mark pending items explicitly with a ○
   symbol. **Phase 5's doc was written partway through development and is now stale** — the
   Orchestration and UI layers it marks "not started" are in fact done (§5 below is current;
   trust this file over that one for current status, but the doc is still correct history for
   what Phase 5 covers).

## 3. Architecture — four layers, bottom-up

Matches the Phase 3 SDD §3/§4 exactly. Each layer depends only on the one below it.

```
Entry/Interface   src/components/*.tsx + src/app/            (React/Next.js, mostly client)
Orchestration      src/lib/orchestration/*.ts                 (Server-side, per-view functions)
Core Logic         src/lib/calculations/*.ts                  (pure functions, zero I/O)
Infrastructure     src/lib/data/*.ts                           (Supabase adapter + typed queries)
```

**Core Logic** (`src/lib/calculations/`) — one pure function per KPI, all 36 from
`Phase 2 - Analysis.docx` §1. Every function has a one-line docstring stating its formula and
its degrade-gently edge case (e.g. `calculateDefaultRate` returns `null`, never throws, when
there are no loans). These are genuinely pure — no Supabase import anywhere in this folder —
so they're unit-testable with a plain input/output pair. **No tests exist yet** (see §6).

**Infrastructure/Data** (`src/lib/data/`) — `supabase-client.ts` is the single Adapter; every
other file is typed query functions (`getLoanAccounts`, `getContributions`, etc.) that map
snake_case Postgres rows to the camelCase types in `src/types/database.ts`. **This layer has
never run against a real database** — Supabase isn't provisioned yet (see §5, §6). It
type-checks and the query shape is correct, but it is unverified against live Postgres.

**Orchestration** (`src/lib/orchestration/`) — one file per subsidiary plus `group.ts`, each
pulling rows through the Core Logic functions and shaping results into the view-model types in
`view-models.ts`. **Currently reads from `src/lib/fixtures/`, not the Infrastructure/Data
layer** — see §5 for exactly what that means and what to do about it.

**Entry/Interface** (`src/components/`, `src/app/page.tsx`) — `page.tsx` is a Server Component
that calls all four orchestration functions and passes the results to `DashboardShell.tsx`, a
client component holding all interactive state (active tab, nav-open, alerts-open, period).
Sub-components: `KpiTile`, `TrendChart`, `BulletChart`, `PillarSection`, `GroupSection`,
`AboutSection`. Styling is global CSS (`src/app/globals.css`), not CSS Modules or Tailwind —
deliberate, matches the KISS/YAGNI calls made throughout (see Phase 3 SDD §2).

## 4. Current status, honestly

| Phase                   | Status                                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 1 — Planning            | Done                                                                                                                      |
| 2 — Analysis            | Done                                                                                                                      |
| 3 — Design (SDD)        | Done — includes 2 ADRs and 4 rendered diagrams                                                                            |
| 4 — Environment & CI/CD | Code/tooling done and verified. **3 manual steps still pending** (see §5)                                                 |
| 5 — Development         | **All 4 layers exist and are wired end-to-end.** See §5 for exactly what "done" means here — it's real but has real gaps. |
| 6 — Testing             | Not started                                                                                                               |
| 7 — Deployment          | Not started (blocked on Phase 4's pending Vercel step)                                                                    |
| 8 — Documentation       | Not started (the 1-page design/architecture brief)                                                                        |

## 5. What "Phase 5 done" actually means — read this carefully

The app **builds, lints, type-checks, and renders real computed data** end-to-end right now.
That's genuine, verified (not assumed) — `npm run build`, `npx tsc --noEmit`, and `npm run
lint` all pass clean, and the rendered HTML was fetched and checked for real KPI values, not
just a blank shell. But three things are simplifications, not bugs, and you should know about
them before you touch this code:

1. **Data source is local fixtures, not Supabase.** `src/lib/fixtures/*.ts` contains
   deterministic (seeded-random) sample rows — a few hundred per table, not the full-scale
   dataset. Orchestration imports fixtures directly. The Infrastructure/Data layer
   (`src/lib/data/`) is fully built and correctly typed, but **nothing currently calls it**.
   Swapping fixtures for live data means changing the imports at the top of each
   `src/lib/orchestration/*.ts` file from `@/lib/fixtures/...` to the matching `@/lib/data/...`
   query functions, and awaiting them (orchestration functions aren't `async` yet — they will
   need to be once they call Supabase). This is a small, well-scoped change _because_ the
   layers were kept separate — that separation is the point, not an accident.

2. **Deltas (the "▲ 6.2% MoM" labels) are static placeholders**, hardcoded per KPI in each
   orchestration file. Computing real ones needs a prior-period dataset, which neither the
   fixtures nor `data/seed.py` currently generate. Flagged with a comment at the top of
   `src/lib/orchestration/rukisha.ts`.

3. **`data/seed.py` has full generation logic but has never been run against a real database**
   — `DATABASE_URL` doesn't exist yet because Supabase isn't provisioned. Don't assume its
   output has been validated; run it and inspect the result before trusting it.

**Three manual account steps are still outstanding** (none of these can be done by an AI
agent — they need your own credentials): create the GitHub repo and push, connect Vercel,
provision Supabase. Exact steps are in `README.md`, "One-time manual setup." Phase 5's
real-data work (item 1 above) is blocked on the Supabase step.

## 6. What remains — in order

1. **Finish the three manual Phase 4 steps** above — GitHub, Vercel, Supabase. Nothing past
   this point can be fully finished without them.
2. **Run `data/seed.py`** against the provisioned Supabase project; verify row counts and spot
   check a few aggregates against the Phase 2 reference figures.
3. **Swap Orchestration from fixtures to live data** (§5, item 1) — and decide how to handle
   the loading/error state this introduces (a Supabase call can fail or be slow in a way a
   fixture import never does; Core Design Principles' "degrade gently" applies here too, not
   just inside the calculation functions).
4. **Implement real deltas** — needs a prior-period query per KPI (likely a second call per
   orchestration function, or a single query returning both periods).
5. **Phase 6 — Testing**: unit tests for the Core Logic layer first (it's pure, so this is the
   cheapest, highest-value testing you can do — write one test per documented edge case in
   `Phase 2 - Analysis.docx` §1, e.g. zero-denominator cases). Then manual QA against the
   specific edge cases the Execution Plan names: no data for a filter, a loan with no
   repayments yet, a pension scheme with no contributions this period.
6. **Phase 7 — Deployment**: once Vercel is connected, confirm the hosted deployment matches
   what's tested locally, across all three subsidiary views and Group View.
7. **Phase 8 — Documentation**: write the required 1-page design/architecture brief (what was
   built, which SDLC phases were followed, where specific principles show up in the actual
   code — file/function names, not generalities). Finalize the SDD with any deviations found
   along the way.

## 7. Known, deliberate limitations (don't "fix" these without reading why first)

- **No authentication** — explicit Phase 1 scope decision, not an oversight.
- **Group Scorecard's "Total Active Clients" is a simple sum, not deduplicated** across
  subsidiaries — a documented trade-off from ADR-0002 (aggregate-level Group Connection
  linking, not per-customer matching). See Phase 3 SDD, Appendix B.
- **No caching layer** — deliberate (Phase 3 SDD §8), the data-access layer is isolated so one
  can be added later without touching the UI.
- **No state management library** — local component state only (KISS/YAGNI, Phase 3 SDD §4).

## 8. Before you commit anything

- `npm run build`, `npm run lint`, and `npx tsc --noEmit` must all pass — this is also what CI
  checks on every push/PR to `main`.
- The pre-commit hook (Husky + lint-staged) runs automatically; don't bypass it with
  `--no-verify`.
- Commit messages follow Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`) — already
  established in the git log, keep it consistent.
- If you add a new calculation function, give it the same docstring-as-contract treatment as
  the existing ones (formula + edge case, one line) — Core Design Principles §8 isn't
  optional precedent here, it's the house style.
