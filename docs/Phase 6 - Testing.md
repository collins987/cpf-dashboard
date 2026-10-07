# Phase 6 — Testing

## Objective

Lock in Phase 5's shipped behavior with automated tests at three layers, wired into CI so no future change can regress the acceptance surface silently. No product behavior added.

## Layers under test

| Layer                       | Target code                  | Tool                                   | Where                                            |
| --------------------------- | ---------------------------- | -------------------------------------- | ------------------------------------------------ |
| Core Logic (pure)           | `src/lib/calculations/*.ts`  | Vitest                                 | `tests/unit/calculations/*.test.ts`              |
| Orchestration (shape)       | `src/lib/orchestration/*.ts` | Vitest + mocked `@/lib/data/*-queries` | `tests/unit/orchestration/orchestration.test.ts` |
| Entry / Interface (browser) | `DashboardShell` + children  | Playwright                             | `tests/phase5-acceptance.spec.ts`                |

## Phase 2 edge cases explicitly covered

Each one has at least one named test case in `tests/unit/calculations/`:

- `calculateDefaultRate` — no loans → `null` (not divide-by-zero)
- `calculateRepaymentRate` — nothing scheduled → `null`
- `calculateAvgTransactionSize` — zero transactions → `null`
- `calculateSavingsToLoanRatio` — portfolio = 0 → `null`
- `calculateDefaultRateByProduct` — a product with no loans is omitted (not reported as 0%)
- `calculateTrustFundGrowth` — prior AUA = 0 → `null`
- `calculateAverageDealSize` — zero deals → `null`
- `calculateWeightedAvgProfitRate` — no issuances or all zero-value → `null`
- `calculateSubscriptionRate` — amount offered = 0 → `null`
- `getLatestUnitNav` / `getLatestPensionLinkSummary` — empty history → `null`
- Sum-over-empty-set functions (portfolio value, group totals, savings sums, agency totals) — explicit `[] → 0` assertions

## How to run locally

```bash
# Unit tests (fast, no DB, no browser)
npm test
npm run test:watch
npm run test:coverage        # ≥95% lines over src/lib/calculations

# Browser acceptance (full Playwright suite — needs Supabase reachable)
npm run test:e2e             # alias for npx playwright test
npx playwright test --headed # watch each test open
npx playwright show-report   # inspect last run

# Full CI pipeline mirrored locally
npm run format:check && npm run lint && npm run build && npm test && npx playwright test
```

The Playwright suite auto-starts `next dev` on port 3000 (see `playwright.config.ts`); override with `PLAYWRIGHT_BASE_URL=https://<preview>.vercel.app` to target a deployed preview.

## Financial sanity test — independence from the production calc path

The one data-dependent assertion (`Rukisha Portfolio Value matches the independently seeded expectation`) uses the externally-known seeded value — not a value computed from `src/lib/calculations/`. If a defect ever crept into both the calculation and the seed script in matching ways, this test would **not** be fooled; a mismatch between the dashboard-displayed value and the independent expectation surfaces as a failure.

Current expected value: **`KES 164.74M`** (established in the Phase 5 acceptance evidence against the ≤900-rows-per-table seed strategy from commit `b73743b`).

If the seed is intentionally regenerated and the value changes, update `EXPECTED_RUKISHA_PORTFOLIO_VALUE` in `tests/phase5-acceptance.spec.ts` with the new independently-known value.

## CI gates

`.github/workflows/ci.yml` runs:

```
format:check → lint → build → vitest → playwright
```

The build step is unchanged from Phase 5. Vitest and Playwright are additive and gate every push/PR to `main`.

## Manual QA checklist

The Execution Plan calls out these edge cases that are **not** fully reproducible from static test data. Run them against the Vercel preview whenever the data layer, seed, or Supabase connection changes:

- [ ] A filter choice that returns zero rows — pillar still renders with "N/A"/"0" tiles, no console error.
- [ ] A loan that has no repayments yet — Repayment Rate shows "N/A", not "0.0%" or `NaN`.
- [ ] A pension scheme with no contributions this period — Fund Balance tile still renders; Contributions tile shows "KES 0".
- [ ] Alerts bell opens, inside clicks don't close, outside clicks close (regression-covered by Playwright #8, #9).
- [ ] YTD selected on first paint (regression-covered by Playwright #7).
- [ ] Mobile 375×812 and 390×844 — no horizontal overflow, hamburger reaches every tab (regression-covered by Playwright #10).

## What Phase 6 did **not** change

- No file under `src/**` was modified.
- No calculation, orchestration, data-access, formatter, or component logic was touched.
- No Supabase schema change.
- No seed-strategy change (still ≤900 rows per table from commit `b73743b`).
- No new product features (routing, search, export, filters, auth, profile, dynamic deltas, etc.) — all remain explicitly out of scope per Phase 1 scope note and HANDOFF §7.
