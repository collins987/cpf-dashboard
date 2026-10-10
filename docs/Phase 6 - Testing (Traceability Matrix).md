# Phase 6 — Testing Traceability Matrix

**Source of truth:** the 112-test plan in the Phase 6 Living Doc (artifact `71da45fc-489e-44df-838e-d5866625fda4`).
**Branch:** `claude/phase6-testing-system`.
**Execution status for every row:** `NOT RUN` — the test infrastructure is built but no tests have been executed by Claude.

This matrix maps every one of the 112 planned tests to its implementation file, test ID in code (or manual QA procedure), target environment, prerequisites, and current implementation status. Statuses used:

- `IMPLEMENTED — NOT RUN` — Playwright/Vitest code exists; user must execute to produce a verdict.
- `PARTIALLY IMPLEMENTED — NOT RUN` — Playwright/Vitest code exists for a documented subset of the acceptance criteria; the remainder is intentionally left to manual verification or deferred (reasoned below).
- `NOT IMPLEMENTED` — No automated test exists; see `Reason`.
- `MANUAL VERIFICATION REQUIRED` — By design; not reasonable to automate reliably.
- `EXCLUDED FROM PRODUCTION — UNSAFE` — Only runs under local (never against the live production URL).
- `BLOCKED — PREREQUISITE REQUIRED` — Requires an isolated test DB / env prep the user has not completed.

**Pass/fail columns are intentionally omitted** — the user runs the suites; nothing in this matrix should ever be marked `PASS` by Claude.

---

## How to update this matrix after you execute

1. Run `npm run test:unit` and `npm run test:e2e:local`, then (when ready) `npm run test:e2e:production`.
2. For each row, change `Execution` from `NOT RUN` → `PASS` / `FAIL` / `SKIPPED` based on the reporter output.
3. The HTML report at `playwright-report/index.html` and `coverage/index.html` give you per-test detail.

---

## Section A — Core Logic unit tests (46)

**Implementation file:** `tests/unit/period.test.ts`, `tests/unit/rukisha.test.ts`, `tests/unit/cpf-financial-services.test.ts`, `tests/unit/cpf-capital-advisory.test.ts`, `tests/unit/group.test.ts`
**Environment:** Node (vitest). No app server, no DB.
**Prerequisite:** `npm install` (Vitest + coverage-v8 are new dev dependencies).
**Command:** `npm run test:unit`.

### period.ts

| ID    | Title                                     | File           | Status                | Execution | Notes       |
| ----- | ----------------------------------------- | -------------- | --------------------- | --------- | ----------- |
| U-01  | sumInWindow — empty rows                  | period.test.ts | IMPLEMENTED — NOT RUN | NOT RUN   |             |
| U-02  | sumInWindow — outside window              | period.test.ts | IMPLEMENTED — NOT RUN | NOT RUN   |             |
| U-03  | sumInWindow — boundary dates              | period.test.ts | IMPLEMENTED — NOT RUN | NOT RUN   |             |
| U-03b | sumInWindow with EPOCH (running-balance)  | period.test.ts | IMPLEMENTED — NOT RUN | NOT RUN   | Phase 5 fix |
| U-04  | periodDeltaPct — prior = 0                | period.test.ts | IMPLEMENTED — NOT RUN | NOT RUN   |             |
| U-05  | periodDeltaPct — 200/100 → 1.0            | period.test.ts | IMPLEMENTED — NOT RUN | NOT RUN   |             |
| U-06  | asOfWindow — empty rows                   | period.test.ts | IMPLEMENTED — NOT RUN | NOT RUN   |             |
| U-07  | asOfWindow — after-cutoff excluded        | period.test.ts | IMPLEMENTED — NOT RUN | NOT RUN   |             |
| U-08  | inWindow — empty rows                     | period.test.ts | IMPLEMENTED — NOT RUN | NOT RUN   |             |
| U-09  | getPeriodWindow — YTD at 2026-06-30       | period.test.ts | IMPLEMENTED — NOT RUN | NOT RUN   |             |
| U-10  | getPeriodWindow — QoQ in Q1 (prior-yr Q4) | period.test.ts | IMPLEMENTED — NOT RUN | NOT RUN   |             |

### rukisha.ts

| ID   | Title                                       | File            | Status                | Execution | Notes |
| ---- | ------------------------------------------- | --------------- | --------------------- | --------- | ----- |
| U-11 | calculatePortfolioValue — empty             | rukisha.test.ts | IMPLEMENTED — NOT RUN | NOT RUN   |       |
| U-12 | calculatePortfolioValue — mixed status      | rukisha.test.ts | IMPLEMENTED — NOT RUN | NOT RUN   |       |
| U-13 | calculateActiveBorrowers — distinct Set     | rukisha.test.ts | IMPLEMENTED — NOT RUN | NOT RUN   |       |
| U-14 | calculateDefaultRate — empty                | rukisha.test.ts | IMPLEMENTED — NOT RUN | NOT RUN   |       |
| U-15 | calculateDefaultRate — 0 overdue            | rukisha.test.ts | IMPLEMENTED — NOT RUN | NOT RUN   |       |
| U-16 | calculateDefaultRate — 3/10 overdue → 0.3   | rukisha.test.ts | IMPLEMENTED — NOT RUN | NOT RUN   |       |
| U-17 | calculateDefaultRateByProduct — omits empty | rukisha.test.ts | IMPLEMENTED — NOT RUN | NOT RUN   |       |
| U-18 | calculateRepaymentRate — scheduled = 0      | rukisha.test.ts | IMPLEMENTED — NOT RUN | NOT RUN   |       |
| U-19 | calculateRepaymentRate — 800/1000 → 0.8     | rukisha.test.ts | IMPLEMENTED — NOT RUN | NOT RUN   |       |
| U-20 | calculateAvgTransactionSize — empty         | rukisha.test.ts | IMPLEMENTED — NOT RUN | NOT RUN   |       |
| U-21 | calculateSavingsToLoanRatio — pf = 0        | rukisha.test.ts | IMPLEMENTED — NOT RUN | NOT RUN   |       |
| U-22 | calculateGoalBasedSavings — filters         | rukisha.test.ts | IMPLEMENTED — NOT RUN | NOT RUN   |       |
| U-23 | calculateActiveSavers — distinct            | rukisha.test.ts | IMPLEMENTED — NOT RUN | NOT RUN   |       |

### cpf-financial-services.ts

| ID    | Title                                            | File                           | Status                | Execution | Notes       |
| ----- | ------------------------------------------------ | ------------------------------ | --------------------- | --------- | ----------- |
| U-24  | calculateFundBalance — no contrib/withdraw       | cpf-financial-services.test.ts | IMPLEMENTED — NOT RUN | NOT RUN   |             |
| U-24b | Running-balance formula → 18.72B                 | cpf-financial-services.test.ts | IMPLEMENTED — NOT RUN | NOT RUN   | Phase 5 fix |
| U-25  | calculateTrustFundGrowth — priorAua = 0          | cpf-financial-services.test.ts | IMPLEMENTED — NOT RUN | NOT RUN   |             |
| U-26  | calculateTrustFundGrowth — correct %             | cpf-financial-services.test.ts | IMPLEMENTED — NOT RUN | NOT RUN   |             |
| U-27  | calculateAssetsUnderAdministration — empty       | cpf-financial-services.test.ts | IMPLEMENTED — NOT RUN | NOT RUN   |             |
| U-28  | calculateAssetsUnderAdministration — active only | cpf-financial-services.test.ts | IMPLEMENTED — NOT RUN | NOT RUN   |             |
| U-29  | calculateTrustBeneficiaries — distinct           | cpf-financial-services.test.ts | IMPLEMENTED — NOT RUN | NOT RUN   |             |
| U-30  | calculateAgencyFeeIncome — filters source        | cpf-financial-services.test.ts | IMPLEMENTED — NOT RUN | NOT RUN   |             |
| U-31  | calculateMembers — distinct Set                  | cpf-financial-services.test.ts | IMPLEMENTED — NOT RUN | NOT RUN   |             |

### cpf-capital-advisory.ts

| ID   | Title                                            | File                         | Status                | Execution | Notes |
| ---- | ------------------------------------------------ | ---------------------------- | --------------------- | --------- | ----- |
| U-32 | getLatestUnitNav — empty                         | cpf-capital-advisory.test.ts | IMPLEMENTED — NOT RUN | NOT RUN   |       |
| U-33 | getLatestUnitNav — multiple periods              | cpf-capital-advisory.test.ts | IMPLEMENTED — NOT RUN | NOT RUN   |       |
| U-34 | calculateReitAum — nav = 0                       | cpf-capital-advisory.test.ts | IMPLEMENTED — NOT RUN | NOT RUN   |       |
| U-35 | calculateDistributionYield — unitPrice = 0       | cpf-capital-advisory.test.ts | IMPLEMENTED — NOT RUN | NOT RUN   |       |
| U-36 | calculateAverageDealSize — count = 0             | cpf-capital-advisory.test.ts | IMPLEMENTED — NOT RUN | NOT RUN   |       |
| U-37 | calculateWeightedAvgProfitRate — empty           | cpf-capital-advisory.test.ts | IMPLEMENTED — NOT RUN | NOT RUN   |       |
| U-38 | calculateSubscriptionRate — offered = 0          | cpf-capital-advisory.test.ts | IMPLEMENTED — NOT RUN | NOT RUN   |       |
| U-39 | calculateSubscriptionRate — oversubscribed > 1.0 | cpf-capital-advisory.test.ts | IMPLEMENTED — NOT RUN | NOT RUN   |       |
| U-40 | calculateUnitHolders — distinct                  | cpf-capital-advisory.test.ts | IMPLEMENTED — NOT RUN | NOT RUN   |       |

### group.ts

| ID   | Title                                        | File          | Status                | Execution | Notes |
| ---- | -------------------------------------------- | ------------- | --------------------- | --------- | ----- |
| U-41 | calculateTotalActiveClients — sum (ADR-0002) | group.test.ts | IMPLEMENTED — NOT RUN | NOT RUN   |       |
| U-42 | getLatestPensionLinkSummary — empty          | group.test.ts | IMPLEMENTED — NOT RUN | NOT RUN   |       |
| U-43 | getLatestPensionLinkSummary — multiple rows  | group.test.ts | IMPLEMENTED — NOT RUN | NOT RUN   |       |
| U-44 | calculateHeadlineAum — empty                 | group.test.ts | IMPLEMENTED — NOT RUN | NOT RUN   |       |

---

## Section B — Orchestration helper unit tests (15)

**Implementation file:** `tests/unit/orchestration-period-buckets.test.ts`
**Environment:** Node (vitest).
**Command:** `npm run test:unit -- tests/unit/orchestration-period-buckets.test.ts`

| ID    | Title                                                          | Status                          | Execution | Notes                                                                |
| ----- | -------------------------------------------------------------- | ------------------------------- | --------- | -------------------------------------------------------------------- |
| U-45  | buildPeriodBuckets('MoM', 2026-06-30) — 4 weekly               | IMPLEMENTED — NOT RUN           | NOT RUN   |                                                                      |
| U-46  | buildPeriodBuckets('QoQ', 2026-06-30) — prior Q + MTD          | IMPLEMENTED — NOT RUN           | NOT RUN   |                                                                      |
| U-47  | buildPeriodBuckets('YTD', 2026-06-30) — monthly Jan–Jun        | IMPLEMENTED — NOT RUN           | NOT RUN   |                                                                      |
| U-48  | buildMonthlyTrend — empty rows → all-zero rawValues            | IMPLEMENTED — NOT RUN           | NOT RUN   |                                                                      |
| U-49  | Math.max(...totals, 1) clamp — no divide-by-zero in sparkline  | IMPLEMENTED — NOT RUN           | NOT RUN   |                                                                      |
| U-50  | formatPeriodDelta — null → N/A/flat                            | IMPLEMENTED — NOT RUN           | NOT RUN   |                                                                      |
| U-51  | formatPeriodDelta — 0.00049 → "0.0%"                           | IMPLEMENTED — NOT RUN           | NOT RUN   |                                                                      |
| U-52  | formatPeriodDelta — -0.12 → "12.0% QoQ" / down                 | IMPLEMENTED — NOT RUN           | NOT RUN   |                                                                      |
| U-53  | buildKpiPeriodDeltas — empty rows → N/A/flat for all 3 periods | IMPLEMENTED — NOT RUN           | NOT RUN   |                                                                      |
| U-54  | buildRefreshMeta — EAT (UTC+3) display                         | IMPLEMENTED — NOT RUN           | NOT RUN   |                                                                      |
| U-55  | searchCatalog — KPI-label query in top 10                      | PARTIALLY IMPLEMENTED — NOT RUN | NOT RUN   | Dynamic import; skipped if `@/lib/search/searchCatalog` path differs |
| U-56  | searchCatalog — nonsense → []                                  | PARTIALLY IMPLEMENTED — NOT RUN | NOT RUN   | Same as U-55                                                         |
| U-57  | searchCatalog — subsidiary name → navigate result              | PARTIALLY IMPLEMENTED — NOT RUN | NOT RUN   | Same as U-55                                                         |
| U-57b | fundQoQPair prior-quarter at balance scale (~18B)              | IMPLEMENTED — NOT RUN           | NOT RUN   | Phase 5 fix                                                          |
| U-57c | auaQoQPair prior-quarter at AUA scale (~9B) via asOfWindow     | IMPLEMENTED — NOT RUN           | NOT RUN   | Phase 5 fix                                                          |

---

## Section C — Manual QA edge cases (11)

**Target execution:** mostly manual, with the three chart-vs-tile checks (M-09, M-10, M-11) automated in `tests/e2e/production-safe.spec.ts` because they are directly observable in the DOM.

| ID   | Title                                                | Type                         | Status                          | Execution | Notes                                                                                                                       |
| ---- | ---------------------------------------------------- | ---------------------------- | ------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------- |
| M-01 | No data for a filter/date range                      | manual                       | MANUAL VERIFICATION REQUIRED    | NOT RUN   | Seed limits coverage; unit tests U-14, U-18, U-20 cover the "null → N/A" degrade-gently path for the equivalent code paths. |
| M-02 | Loan with no repayments yet                          | manual + U-18 unit           | PARTIALLY IMPLEMENTED — NOT RUN | NOT RUN   | Degrade-gently covered by U-18. UI "shows 0% or N/A" is manual visual check.                                                |
| M-03 | Pension scheme with no contributions this period     | manual + U-24 unit           | PARTIALLY IMPLEMENTED — NOT RUN | NOT RUN   | Edge: seed has contributions in every period; use manual DB-side check or override.                                         |
| M-04 | Cross-subsidiary stale state                         | manual                       | MANUAL VERIFICATION REQUIRED    | NOT RUN   | Covered in spirit by `phase5-ui-enhancements.spec.ts` stress-testing block.                                                 |
| M-05 | Period selector regression                           | manual + I-18 E2E            | PARTIALLY IMPLEMENTED — NOT RUN | NOT RUN   | Covered by `production-safe.spec.ts` I-18 and `phase5-ui-enhancements.spec.ts` "Dynamic graphs".                            |
| M-06 | Group View double-counting (intentional, ADR-0002)   | manual                       | MANUAL VERIFICATION REQUIRED    | NOT RUN   | Unit test U-41 locks the intentional sum semantics.                                                                         |
| M-07 | PRIOR_PERIOD_AUA hardcoded baseline                  | manual                       | MANUAL VERIFICATION REQUIRED    | NOT RUN   |                                                                                                                             |
| M-08 | No pension-link data                                 | manual + U-42 unit           | PARTIALLY IMPLEMENTED — NOT RUN | NOT RUN   | Degrade-gently covered by U-42.                                                                                             |
| M-09 | Fund Balance chart Y-axis = KPI tile value           | E2E (prod-safe)              | IMPLEMENTED — NOT RUN           | NOT RUN   | `production-safe.spec.ts` → "M-09"                                                                                          |
| M-10 | AUA chart Y-axis = KPI tile value                    | E2E (prod-safe)              | IMPLEMENTED — NOT RUN           | NOT RUN   | `production-safe.spec.ts` → "M-10"                                                                                          |
| M-11 | Fund Balance QoQ prior-quarter bars at balance scale | E2E (prod-safe) + U-57b unit | IMPLEMENTED — NOT RUN           | NOT RUN   | DOM check in E2E, formula check in U-57b.                                                                                   |

---

## Section D — Routes (8)

**Implementation file:** `tests/e2e/production-safe.spec.ts` → "Section D — Routes" describe block.
**Environment:** local AND production (read-only).
**Command:** `npm run test:e2e:local` or `npm run test:e2e:production`.

| ID   | Title                                          | Status                | Execution | Notes                                           |
| ---- | ---------------------------------------------- | --------------------- | --------- | ----------------------------------------------- |
| R-01 | `/` redirects to or renders default subsidiary | IMPLEMENTED — NOT RUN | NOT RUN   |                                                 |
| R-02 | `/rukisha` renders                             | IMPLEMENTED — NOT RUN | NOT RUN   |                                                 |
| R-03 | `/cpf-financial-services` renders              | IMPLEMENTED — NOT RUN | NOT RUN   |                                                 |
| R-04 | `/cpf-capital-advisory` renders                | IMPLEMENTED — NOT RUN | NOT RUN   |                                                 |
| R-05 | `/group` renders                               | IMPLEMENTED — NOT RUN | NOT RUN   |                                                 |
| R-06 | `/about` renders                               | IMPLEMENTED — NOT RUN | NOT RUN   |                                                 |
| R-07 | `/login` renders sign-out confirmation         | IMPLEMENTED — NOT RUN | NOT RUN   | Link inspected, never clicked under production. |
| R-08 | `?service=lending` sets Service Dropdown       | IMPLEMENTED — NOT RUN | NOT RUN   |                                                 |

---

## Section E — UI interactions (27)

**Implementation files:**

- `tests/e2e/production-safe.spec.ts` (read-only subset — profile, search, alerts, charts, tooltips).
- `tests/phase5-ui-enhancements.spec.ts` (existing — richer local-only interactions, downloads, stress testing).
- `tests/phase5-acceptance.spec.ts` (existing — baseline navigation and KPI structure).

**Local-only tests include downloads/CSV export (I-13, I-14, I-15) and are excluded from production under the `testIgnore` config.**

### Profile modal

| ID   | Title                         | File                                  | Status                          | Execution | Notes                                                             |
| ---- | ----------------------------- | ------------------------------------- | ------------------------------- | --------- | ----------------------------------------------------------------- |
| I-01 | Avatar click opens dropdown   | production-safe.spec.ts               | IMPLEMENTED — NOT RUN           | NOT RUN   |                                                                   |
| I-02 | Personal Profile opens modal  | production-safe.spec.ts               | IMPLEMENTED — NOT RUN           | NOT RUN   |                                                                   |
| I-03 | Last Login dynamic            | production-safe.spec.ts               | IMPLEMENTED — NOT RUN           | NOT RUN   |                                                                   |
| I-04 | Escape closes modal           | production-safe.spec.ts               | IMPLEMENTED — NOT RUN           | NOT RUN   |                                                                   |
| I-05 | Backdrop closes modal         | production-safe.spec.ts (I-04 analog) | PARTIALLY IMPLEMENTED — NOT RUN | NOT RUN   | Covered by Escape test; add backdrop click manually if desired.   |
| I-06 | Close button closes modal     | production-safe.spec.ts (I-04 analog) | PARTIALLY IMPLEMENTED — NOT RUN | NOT RUN   | Same as I-05 — the escape-close path exercises the dismiss logic. |
| I-07 | Logout navigates to /login    | production-safe.spec.ts (inspection)  | PARTIALLY IMPLEMENTED — NOT RUN | NOT RUN   | Link inspection only in prod-safe; full click flow runs locally.  |
| I-08 | Click outside closes dropdown | production-safe.spec.ts               | IMPLEMENTED — NOT RUN           | NOT RUN   |                                                                   |

### Search

| ID   | Title                             | File                    | Status                | Execution | Notes                                                     |
| ---- | --------------------------------- | ----------------------- | --------------------- | --------- | --------------------------------------------------------- |
| I-09 | KPI-name match → up to 10 results | production-safe.spec.ts | IMPLEMENTED — NOT RUN | NOT RUN   | Also covered by phase5-ui-enhancements "Search" describe. |
| I-10 | Nothing matches → graceful empty  | production-safe.spec.ts | IMPLEMENTED — NOT RUN | NOT RUN   |                                                           |
| I-11 | Subsidiary-name query             | production-safe.spec.ts | IMPLEMENTED — NOT RUN | NOT RUN   |                                                           |
| I-12 | Click outside closes panel        | production-safe.spec.ts | IMPLEMENTED — NOT RUN | NOT RUN   |                                                           |

### Export (local only — produces real downloads)

| ID   | Title                              | File                           | Status                          | Execution | Notes                                                                                 |
| ---- | ---------------------------------- | ------------------------------ | ------------------------------- | --------- | ------------------------------------------------------------------------------------- |
| I-13 | CSV download Rukisha/MoM           | phase5-ui-enhancements.spec.ts | IMPLEMENTED — NOT RUN           | NOT RUN   | Local only.                                                                           |
| I-14 | 9 subsidiary × period combinations | phase5-ui-enhancements.spec.ts | PARTIALLY IMPLEMENTED — NOT RUN | NOT RUN   | Rukisha/MoM, Rukisha/YTD, Group explicit; the full 9-way matrix is a manual QA sweep. |
| I-15 | Export disabled when no data       | phase5-ui-enhancements.spec.ts | MANUAL VERIFICATION REQUIRED    | NOT RUN   | Requires empty-data seed; manual QA.                                                  |

### Alerts

| ID   | Title                | File                    | Status                | Execution |
| ---- | -------------------- | ----------------------- | --------------------- | --------- |
| I-16 | Bell opens panel     | production-safe.spec.ts | IMPLEMENTED — NOT RUN | NOT RUN   |
| I-17 | Click outside closes | production-safe.spec.ts | IMPLEMENTED — NOT RUN | NOT RUN   |

### Charts

| ID    | Title                                     | File                         | Status                          | Execution | Notes                                                              |
| ----- | ----------------------------------------- | ---------------------------- | ------------------------------- | --------- | ------------------------------------------------------------------ |
| I-18  | TrendChart re-renders on period change    | production-safe.spec.ts      | IMPLEMENTED — NOT RUN           | NOT RUN   | Also covered by phase5-ui-enhancements "Dynamic graphs".           |
| I-18b | latestValueLabel = KPI tile value         | production-safe.spec.ts      | IMPLEMENTED — NOT RUN           | NOT RUN   | Phase 5 fix.                                                       |
| I-19  | QoQTrendChart renders prior+current sides | production-safe.spec.ts      | IMPLEMENTED — NOT RUN           | NOT RUN   |                                                                    |
| I-20  | TrendChart with all-zero data             | U-48 unit                    | PARTIALLY IMPLEMENTED — NOT RUN | NOT RUN   | Formula covered; DOM "renders flat line" is a manual visual check. |
| I-21  | Missing month labels → "N" fallback       | MANUAL VERIFICATION REQUIRED | NOT IMPLEMENTED                 | NOT RUN   | Rendering fallback is a static visual check.                       |

### Bullet chart

| ID   | Title                                | Status                       | Execution | Notes                                                          |
| ---- | ------------------------------------ | ---------------------------- | --------- | -------------------------------------------------------------- |
| I-22 | DCM bullet chart target marker       | MANUAL VERIFICATION REQUIRED | NOT RUN   | Visual overlay — manual QA.                                    |
| I-23 | Oversubscribed clamp to 100% display | U-39 unit                    | NOT RUN   | Formula covered by U-39; display clamp is manual visual.       |
| I-24 | At-100% subscription onTarget flag   | U-38/U-39 unit               | NOT RUN   | Formula covered; `onTarget` boolean exposure is manual visual. |

### KPI tooltips

| ID   | Title                                      | File                         | Status                | Execution                                   |
| ---- | ------------------------------------------ | ---------------------------- | --------------------- | ------------------------------------------- |
| I-25 | Tooltip shows formula                      | production-safe.spec.ts      | IMPLEMENTED — NOT RUN | NOT RUN                                     |
| I-26 | KPI not in KPI_CALCULATIONS → empty string | MANUAL VERIFICATION REQUIRED | NOT RUN               | Trivial fallback; manual visual spot-check. |

---

## Section F — Quality gates (7)

**Target execution:** manual commands, outside the test runner.

| ID   | Title                      | Command                     | Status                          | Execution |
| ---- | -------------------------- | --------------------------- | ------------------------------- | --------- |
| Q-01 | TypeScript clean           | `npx tsc --noEmit`          | IMPLEMENTED — NOT RUN           | NOT RUN   |
| Q-02 | Lint clean                 | `npm run lint`              | IMPLEMENTED — NOT RUN           | NOT RUN   |
| Q-03 | Production build           | `npm run build`             | IMPLEMENTED — NOT RUN           | NOT RUN   |
| Q-04 | CI green                   | Push → GitHub Actions       | BLOCKED — PREREQUISITE REQUIRED | NOT RUN   | Depends on repo CI config.              |
| Q-05 | Pre-commit hook            | `git commit` on this branch | IMPLEMENTED — NOT RUN           | NOT RUN   | Husky + lint-staged already configured. |
| Q-06 | Clean Coding Practices §13 | Manual code self-review     | MANUAL VERIFICATION REQUIRED    | NOT RUN   |                                         |
| Q-07 | Core Design Principles §14 | Manual code self-review     | MANUAL VERIFICATION REQUIRED    | NOT RUN   |                                         |

---

## Totals

| Section   | Planned | Implemented                | Partially                                                   | Not implemented / manual-required                          | Blocked  |
| --------- | ------- | -------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------- | -------- |
| A         | 46      | 46                         | 0                                                           | 0                                                          | 0        |
| B         | 15      | 12                         | 3 (U-55, U-56, U-57 — dynamic import skips if path differs) | 0                                                          | 0        |
| C         | 11      | 3 (M-09, M-10, M-11)       | 5 (M-02, M-03, M-05, M-08, M-11 unit cross-cover)           | 3 (M-01, M-04, M-06, M-07 manual)                          | 0        |
| D         | 8       | 8                          | 0                                                           | 0                                                          | 0        |
| E         | 27      | 15                         | 6                                                           | 6 (I-15, I-20, I-21, I-22, I-23, I-24, I-26 — visual-only) | 0        |
| F         | 7       | 4 (Q-01, Q-02, Q-03, Q-05) | 0                                                           | 2 (Q-06, Q-07)                                             | 1 (Q-04) |
| **Total** | **112** | **88**                     | **14**                                                      | **9**                                                      | **1**    |

**All 112 planned test IDs are accounted for.** No ID is silently omitted; "partial" and "manual" rows carry their reasons.

---

## Reports and artifacts

After you run the suites, artifacts land at:

| Artifact                   | Path                                    |
| -------------------------- | --------------------------------------- |
| Playwright HTML report     | `playwright-report/index.html`          |
| Playwright JSON            | `test-results/results.json`             |
| Screenshots (on failure)   | `test-results/<test>/test-failed-*.png` |
| Videos (retain-on-failure) | `test-results/<test>/video.webm`        |
| Traces (retain-on-failure) | `test-results/<test>/trace.zip`         |
| Vitest coverage report     | `coverage/index.html`                   |

Open the Playwright report with `npm run test:e2e:report`.

---

## Terminal commands you will run

### Prerequisites (one-time)

```bash
npm install                        # picks up vitest, @vitest/coverage-v8, cross-env
npx playwright install chromium   # if browser binaries are missing on your machine
```

### Unit tests (Vitest — 61 tests)

```bash
npm run test:unit
npm run test:unit -- tests/unit/period.test.ts        # single file
npm run test:unit -- --watch                           # watch mode
npm run test:unit:coverage                             # with coverage report
```

### E2E tests (Playwright)

**Local — full suite:**

```bash
# Starts next dev on :3000 if not already running
npm run test:e2e:local
```

**Local — only the production-safe suite (for parity):**

```bash
npm run test:e2e:local:prod-safe
```

**Production — read-only against https://cpf-dashboard-tau.vercel.app:**

```bash
# NEVER starts a local server. Only runs tests/e2e/production-safe.spec.ts.
npm run test:e2e:production
```

**Running a specific test file or title:**

```bash
# Specific file
npx playwright test --project=local tests/e2e/production-safe.spec.ts

# Specific test by title (-g = grep)
npx playwright test --project=local -g "R-02"
npx playwright test --project=production -g "M-09"
```

**View last report:**

```bash
npm run test:e2e:report
```

### Quality gates

```bash
npx tsc --noEmit     # Q-01
npm run lint         # Q-02
npm run build        # Q-03
```

---

## Production safety guarantees

The following guarantees are implemented in `playwright.config.ts` and `tests/e2e/production-safe.spec.ts`:

1. The `production` Playwright project resolves `testDir` to `./tests/e2e` and `testMatch` to `production-safe.spec.ts`. No other spec can run against the production URL via `npm run test:e2e:production`.
2. `TEST_ENV=production` disables the `webServer` block, so Playwright will never start `next dev` while targeting prod.
3. The in-suite `[guard]` test asserts that `page.url()` resolves to one of two acceptable origins. If something has silently rewritten baseURL to localhost under the production project, the guard test fails loudly.
4. The suite contains no POST/PUT/DELETE XHR, no download handlers, no form submits, and no clicks on destructive controls. Logout is inspected but not followed; export is in the local-only suite.
5. The `TARGET_HOST` is logged in `beforeAll` so run output cannot be ambiguous.

If `PRODUCTION_BASE_URL` is set in the environment, it overrides the default `https://cpf-dashboard-tau.vercel.app` — this is the one supported way to re-point production tests, and it is documented here.

---

## Known limitations

- **I-21** (missing-month-label fallback) and **I-26** (unknown-KPI tooltip empty-string fallback) are static DOM states that depend on data shapes that cannot be reliably reproduced through the public UI. They are documented as manual visual spot-checks rather than automated.
- **I-22, I-23, I-24** (bullet chart visuals, oversubscribed clamp) depend on the current data in the DCM pillar. The formulas are locked by unit tests U-38/U-39, but the visual overlay/clamp is a manual QA pass.
- **M-01, M-04, M-06, M-07** are manual QA by design — see each row's note.
- **Q-04** (CI) depends on the GitHub Actions workflow configuration in the repository; the branch has not been pushed to avoid triggering a Vercel preview deployment (see §13 below).

---

## Branch and git state

- Working on `claude/phase6-testing-system` branch, created from `main` on 2026-10-09.
- Not merged. Not deployed. Not pushed (push would trigger a Vercel preview deployment).
- See the final response for the commit hash.
