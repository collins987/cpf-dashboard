/**
 * Period-window calculation for MoM/QoQ/YTD — pure, deterministic, derived
 * from the current date (never hard-coded). Core Logic layer: no I/O.
 */

export type Period = "MoM" | "QoQ" | "YTD";

export interface PeriodWindow {
  start: Date;
  end: Date;
  priorStart: Date;
  priorEnd: Date;
  label: string;
}

/** The calendar window a period button represents, and the matching prior window for a delta. */
export function getPeriodWindow(period: Period, now: Date): PeriodWindow {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();

  if (period === "MoM") {
    const start = new Date(Date.UTC(y, m, 1));
    const priorStart = new Date(Date.UTC(y, m - 1, 1));
    const priorEnd = new Date(Date.UTC(y, m, 0, 23, 59, 59));
    return { start, end: now, priorStart, priorEnd, label: "Monthly" };
  }

  if (period === "QoQ") {
    const q = Math.floor(m / 3);
    const start = new Date(Date.UTC(y, q * 3, 1));
    const priorStart = new Date(Date.UTC(y, (q - 1) * 3, 1));
    const priorEnd = new Date(Date.UTC(y, q * 3, 0, 23, 59, 59));
    return { start, end: now, priorStart, priorEnd, label: "Quarterly" };
  }

  // YTD
  const start = new Date(Date.UTC(y, 0, 1));
  const priorStart = new Date(Date.UTC(y - 1, 0, 1));
  const priorEnd = new Date(Date.UTC(y - 1, 11, 31, 23, 59, 59));
  return { start, end: now, priorStart, priorEnd, label: "YTD" };
}

/** Sum of valueOf(row) for rows whose dateOf(row) falls within [start, end]. */
export function sumInWindow<T>(
  rows: T[],
  dateOf: (row: T) => string,
  valueOf: (row: T) => number,
  start: Date,
  end: Date,
): number {
  return rows.reduce((sum, row) => {
    const d = new Date(dateOf(row));
    if (d >= start && d <= end) return sum + valueOf(row);
    return sum;
  }, 0);
}

/** Percentage change from prior to current; prior=0 -> null (edge case, avoid divide-by-zero). */
export function periodDeltaPct(current: number, prior: number): number | null {
  if (prior === 0) return null;
  return (current - prior) / prior;
}
