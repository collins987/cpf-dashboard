import type { Period } from "@/lib/calculations/period";
import { getPeriodWindow, sumInWindow, periodDeltaPct } from "@/lib/calculations/period";
import type { QoQChartSide } from "./view-models";

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
  /** Per-period (MoM/QoQ/YTD) title prefix + summary value label + real delta + period-scoped chart data. */
  byPeriod: Record<
    Period,
    {
      titlePrefix: string;
      latestValueLabel: string;
      deltaPct: number | null;
      rawValues: number[];
      monthLabels: string[];
      quarterBoundaryLabel?: string;
      qoqPair?: { prior: QoQChartSide; current: QoQChartSide }; // QoQ only: split dual-chart data
    }
  >;
}

/** Returns the per-period chart buckets (same shape as used internally by buildMonthlyTrend). */
export function buildPeriodBuckets(
  period: Period,
  now: Date,
): { start: Date; end: Date; label: string }[] {
  if (period === "MoM") {
    const todayEnd = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59),
    );
    return Array.from({ length: 4 }, (_, i) => {
      const daysBack = (3 - i) * 7;
      const s = new Date(todayEnd.getTime() - (daysBack + 6) * 86_400_000);
      s.setUTCHours(0, 0, 0, 0);
      const e = new Date(todayEnd.getTime() - daysBack * 86_400_000);
      return { start: s, end: e, label: `W${i + 1}` };
    });
  }
  if (period === "QoQ") {
    const q = Math.floor(now.getUTCMonth() / 3);
    const priorQStart = q * 3 - 3;
    return [
      ...Array.from({ length: 3 }, (_, i) => {
        const baseMonth = priorQStart + i;
        const yr = now.getUTCFullYear() + Math.floor(baseMonth / 12);
        const mo = ((baseMonth % 12) + 12) % 12;
        const s = new Date(Date.UTC(yr, mo, 1));
        const e = new Date(Date.UTC(yr, mo + 1, 0, 23, 59, 59));
        return { start: s, end: e, label: MONTH_ABBR[mo] };
      }),
      {
        start: new Date(Date.UTC(now.getUTCFullYear(), q * 3, 1)),
        end: new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59),
        ),
        label: MONTH_ABBR[q * 3],
      },
    ];
  }
  // YTD
  const monthCount = now.getUTCMonth() + 1;
  return Array.from({ length: monthCount }, (_, i) => {
    const s = new Date(Date.UTC(now.getUTCFullYear(), i, 1));
    const e = new Date(Date.UTC(now.getUTCFullYear(), i + 1, 0, 23, 59, 59));
    return { start: s, end: e, label: MONTH_ABBR[i] };
  });
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
    // MoM → 4 weekly buckets within the current month (W1–W4).
    // QoQ → trailing 3 completed calendar months (avoids future-empty-month cliff).
    // YTD → one bucket per month Jan→current month.
    let periodBuckets: { start: Date; end: Date; label: string }[];
    if (period === "MoM") {
      // Trailing 4 completed calendar weeks ending today, so all buckets have real data.
      // Each week is 7 days; W4 ends at the end of today, W1 starts 28 days ago.
      const todayEnd = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59),
      );
      periodBuckets = Array.from({ length: 4 }, (_, i) => {
        const daysBack = (3 - i) * 7;
        const s = new Date(todayEnd.getTime() - (daysBack + 6) * 86_400_000);
        s.setUTCHours(0, 0, 0, 0);
        const e = new Date(todayEnd.getTime() - daysBack * 86_400_000);
        return { start: s, end: e, label: `W${i + 1}` };
      });
    } else if (period === "QoQ") {
      // 3 completed months of the prior quarter + the current quarter's month-to-date.
      // This mirrors what the "Q4 vs Q3" label promises: Q3 trend visible on the left,
      // Q4 in-progress on the right, separated by a boundary line in the chart.
      const q = Math.floor(now.getUTCMonth() / 3);
      const priorQStart = q * 3 - 3; // first month index of prior quarter (may be negative)
      periodBuckets = [
        // Prior quarter — 3 full calendar months
        ...Array.from({ length: 3 }, (_, i) => {
          const baseMonth = priorQStart + i;
          const yr = now.getUTCFullYear() + Math.floor(baseMonth / 12);
          const mo = ((baseMonth % 12) + 12) % 12;
          const s = new Date(Date.UTC(yr, mo, 1));
          const e = new Date(Date.UTC(yr, mo + 1, 0, 23, 59, 59));
          return { start: s, end: e, label: MONTH_ABBR[mo] };
        }),
        // Current quarter — first month to today (always has data)
        {
          start: new Date(Date.UTC(now.getUTCFullYear(), q * 3, 1)),
          end: new Date(
            Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59),
          ),
          label: MONTH_ABBR[q * 3],
        },
      ];
    } else {
      // YTD: one bucket per month Jan→current month
      const monthCount = now.getUTCMonth() + 1;
      periodBuckets = Array.from({ length: monthCount }, (_, i) => {
        const s = new Date(Date.UTC(now.getUTCFullYear(), i, 1));
        const e = new Date(Date.UTC(now.getUTCFullYear(), i + 1, 0, 23, 59, 59));
        return { start: s, end: e, label: MONTH_ABBR[i] };
      });
    }

    const bucketTotals = periodBuckets.map((b) =>
      sumInWindow(rows, dateOf, valueOf, b.start, b.end),
    );

    let qoqPair: { prior: QoQChartSide; current: QoQChartSide } | undefined;
    if (period === "QoQ") {
      const q = Math.floor(now.getUTCMonth() / 3);
      const priorQ = q === 0 ? 3 : q - 1;
      const priorYear = q === 0 ? now.getUTCFullYear() - 1 : now.getUTCFullYear();
      const curYear = now.getUTCFullYear();
      const priorQStartMonth = priorQ * 3; // 0-indexed month
      const priorQEndMonth = priorQStartMonth + 2;
      const curQStartMonth = q * 3;

      const FULL_MONTHS = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      const priorMonthAbbrs = [0, 1, 2].map(
        (i) => `${MONTH_ABBR[priorQStartMonth + i]} ${priorYear}`,
      );
      const curMonthLabel = `${MONTH_ABBR[now.getUTCMonth()]} ${curYear}`;

      const priorEnd = new Date(Date.UTC(priorYear, priorQEndMonth + 1, 0, 23, 59, 59));
      const priorRaw = [0, 1, 2].map((i) => {
        const ms = new Date(Date.UTC(priorYear, priorQStartMonth + i, 1));
        const me = new Date(Date.UTC(priorYear, priorQStartMonth + i + 1, 0, 23, 59, 59));
        return sumInWindow(rows, dateOf, valueOf, ms, me);
      });
      const curRaw = [
        sumInWindow(
          rows,
          dateOf,
          valueOf,
          new Date(Date.UTC(curYear, curQStartMonth, 1)),
          new Date(Date.UTC(curYear, now.getUTCMonth(), now.getUTCDate(), 23, 59, 59)),
        ),
      ];

      const priorQLabel = `Q${priorQ + 1} ${priorYear}`;
      const curQLabel = `Q${q + 1} ${curYear}`;
      const priorStart = new Date(Date.UTC(priorYear, priorQStartMonth, 1));

      qoqPair = {
        prior: {
          rawValues: priorRaw,
          monthLabels: priorMonthAbbrs,
          title: `${priorQLabel} — Prior Quarter`,
          dateRangeLabel: `${FULL_MONTHS[priorQStartMonth].slice(0, 3)} 1 – ${FULL_MONTHS[priorQEndMonth].slice(0, 3)} ${priorEnd.getUTCDate()}, ${priorYear} (Completed)`,
        },
        current: {
          rawValues: curRaw,
          monthLabels: [curMonthLabel],
          title: `${curQLabel} — Current Quarter`,
          dateRangeLabel: `${FULL_MONTHS[curQStartMonth].slice(0, 3)} 1 – ${FULL_MONTHS[now.getUTCMonth()].slice(0, 3)} ${now.getUTCDate()}, ${curYear}`,
          allQuarterMonthLabels: [0, 1, 2].map(
            (i) => `${MONTH_ABBR[curQStartMonth + i]} ${curYear}`,
          ),
        },
      };
      void priorStart; // used above implicitly via priorYear/month
    }

    byPeriod[period] = {
      titlePrefix: w.label,
      latestValueLabel: formatValue(current),
      deltaPct: periodDeltaPct(current, prior),
      rawValues: bucketTotals,
      monthLabels: periodBuckets.map((b) => b.label),
      ...(period === "QoQ" && {
        quarterBoundaryLabel: periodBuckets[periodBuckets.length - 1].label,
        qoqPair,
      }),
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
