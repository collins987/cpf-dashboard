import type { Period } from "@/lib/calculations/period";
import { getPeriodWindow, sumInWindow, periodDeltaPct } from "@/lib/calculations/period";

const MONTH_ABBR = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export interface MonthlyTrendResult {
  /** Real trailing-6-month bucketed totals, scaled 0-100 for the sparkline. */
  points: number[];
  monthLabels: string[];
  /** Per-period (MoM/QoQ/YTD) title prefix + summary value label + real delta + period-scoped chart points. */
  byPeriod: Record<
    Period,
    {
      titlePrefix: string;
      latestValueLabel: string;
      deltaPct: number | null;
      points: number[];
      monthLabels: string[];
    }
  >;
}

/**
 * Builds a genuine trailing-6-month trend from already-fetched rows that carry
 * a real date field (e.g. transaction.createdAt, deal.closeDate) — no new
 * Supabase query, just real aggregation of data the orchestration layer
 * already holds. Replaces syntheticTrend for every KPI where the backing
 * table actually has a date column.
 */
export function buildMonthlyTrend<T>(
  rows: T[],
  dateOf: (row: T) => string,
  valueOf: (row: T) => number,
  formatValue: (n: number) => string,
  now: Date = new Date(),
): MonthlyTrendResult {
  const months: { start: Date; end: Date; label: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const y = now.getUTCFullYear();
    const m = now.getUTCMonth() - i;
    const start = new Date(Date.UTC(y, m, 1));
    const end = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59));
    months.push({ start, end, label: MONTH_ABBR[start.getUTCMonth()] });
  }

  const totals = months.map((mo) => sumInWindow(rows, dateOf, valueOf, mo.start, mo.end));
  const max = Math.max(...totals, 1);
  const points = totals.map((t) => Math.round((t / max) * 100));

  const byPeriod = {} as MonthlyTrendResult["byPeriod"];
  for (const period of ["MoM", "QoQ", "YTD"] as Period[]) {
    const w = getPeriodWindow(period, now);
    const current = sumInWindow(rows, dateOf, valueOf, w.start, w.end);
    const prior = sumInWindow(rows, dateOf, valueOf, w.priorStart, w.priorEnd);

    // Build period-scoped chart buckets so the sparkline changes with the filter.
    // MoM → 4 weekly buckets within the month.
    // QoQ → 3 monthly buckets (one per month of the quarter).
    // YTD → one bucket per month from Jan to the current month.
    let periodBuckets: { start: Date; end: Date; label: string }[];
    if (period === "MoM") {
      // Split the month into 4 roughly-equal week-sized slices
      const msPerSlice = (w.end.getTime() - w.start.getTime()) / 4;
      periodBuckets = Array.from({ length: 4 }, (_, i) => {
        const s = new Date(w.start.getTime() + i * msPerSlice);
        const e = new Date(w.start.getTime() + (i + 1) * msPerSlice - 1);
        return { start: s, end: e, label: `W${i + 1}` };
      });
    } else if (period === "QoQ") {
      // 3 calendar months spanning the quarter
      periodBuckets = Array.from({ length: 3 }, (_, i) => {
        const baseMonth = w.start.getUTCMonth() + i;
        const y = w.start.getUTCFullYear() + Math.floor(baseMonth / 12);
        const m = baseMonth % 12;
        const s = new Date(Date.UTC(y, m, 1));
        const e = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59));
        return { start: s, end: e, label: MONTH_ABBR[m] };
      });
    } else {
      // YTD: one bucket per month Jan→current
      const yearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
      const monthCount = now.getUTCMonth() + 1;
      periodBuckets = Array.from({ length: monthCount }, (_, i) => {
        const s = new Date(Date.UTC(now.getUTCFullYear(), i, 1));
        const e = new Date(Date.UTC(now.getUTCFullYear(), i + 1, 0, 23, 59, 59));
        return { start: s, end: e, label: MONTH_ABBR[i] };
      });
      void yearStart; // suppress unused warning
    }

    const bucketTotals = periodBuckets.map((b) =>
      sumInWindow(rows, dateOf, valueOf, b.start, b.end),
    );
    const bucketMax = Math.max(...bucketTotals, 1);
    const periodPoints = bucketTotals.map((t) => Math.round((t / bucketMax) * 100));

    byPeriod[period] = {
      titlePrefix: w.label,
      latestValueLabel: formatValue(current),
      deltaPct: periodDeltaPct(current, prior),
      points: periodPoints,
      monthLabels: periodBuckets.map((b) => b.label),
    };
  }

  return { points, monthLabels: months.map((m) => m.label), byPeriod };
}

/** Turns a real deltaPct into the same {deltaLabel, deltaDirection} shape KpiTile already renders. */
export function formatPeriodDelta(
  deltaPct: number | null,
  period: Period,
): { deltaLabel: string; deltaDirection: "up" | "down" | "flat" } {
  if (deltaPct === null) return { deltaLabel: "N/A", deltaDirection: "flat" };
  const pct = Math.abs(deltaPct * 100);
  const suffix = period === "MoM" ? "MoM" : period === "QoQ" ? "QoQ" : "YTD";
  if (Math.abs(deltaPct) < 0.0005) return { deltaLabel: `0.0% ${suffix}`, deltaDirection: "flat" };
  const arrow = deltaPct > 0 ? "▲" : "▼";
  return {
    deltaLabel: `${arrow} ${pct.toFixed(1)}% ${suffix}`,
    deltaDirection: deltaPct > 0 ? "up" : "down",
  };
}

/** Builds the byPeriodDelta map for a Kpi from already-fetched dated rows. */
export function buildKpiPeriodDeltas<T>(
  rows: T[],
  dateOf: (row: T) => string,
  valueOf: (row: T) => number,
  now: Date = new Date(),
): Record<Period, { deltaLabel: string; deltaDirection: "up" | "down" | "flat" }> {
  const result = {} as Record<
    Period,
    { deltaLabel: string; deltaDirection: "up" | "down" | "flat" }
  >;
  for (const period of ["MoM", "QoQ", "YTD"] as Period[]) {
    const w = getPeriodWindow(period, now);
    const current = sumInWindow(rows, dateOf, valueOf, w.start, w.end);
    const prior = sumInWindow(rows, dateOf, valueOf, w.priorStart, w.priorEnd);
    result[period] = formatPeriodDelta(periodDeltaPct(current, prior), period);
  }
  return result;
}
