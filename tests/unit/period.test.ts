/**
 * Phase 6 Section A — period.ts unit tests (U-01 through U-10, U-03b).
 */
import { describe, test, expect } from "vitest";
import {
  sumInWindow,
  periodDeltaPct,
  asOfWindow,
  inWindow,
  getPeriodWindow,
} from "@/lib/calculations/period";
import { FIXED_NOW } from "./fixtures";

type Row = { d: string; v: number };
const d = (date: string, v: number): Row => ({ d: date, v });
const dateOf = (r: Row) => r.d;
const valueOf = (r: Row) => r.v;

describe("period.ts", () => {
  test("U-01: sumInWindow — empty rows returns 0", () => {
    expect(
      sumInWindow<Row>([], dateOf, valueOf, new Date("2026-01-01"), new Date("2026-12-31")),
    ).toBe(0);
  });

  test("U-02: sumInWindow — rows outside window excluded", () => {
    const rows = [d("2025-01-01", 10), d("2027-01-01", 20)];
    expect(sumInWindow(rows, dateOf, valueOf, new Date("2026-01-01"), new Date("2026-12-31"))).toBe(
      0,
    );
  });

  test("U-03: sumInWindow — boundary dates included on both endpoints", () => {
    const start = new Date("2026-06-01T00:00:00Z");
    const end = new Date("2026-06-30T23:59:59Z");
    const rows = [d("2026-06-01T00:00:00Z", 5), d("2026-06-30T23:59:59Z", 7)];
    expect(sumInWindow(rows, dateOf, valueOf, start, end)).toBe(12);
  });

  test("U-03b: sumInWindow with EPOCH start — cumulative lifetime sum (running-balance pattern)", () => {
    const EPOCH = new Date(0);
    const bucketEnd = new Date("2026-03-31T23:59:59Z");
    const rows = [
      d("2024-01-01", 100),
      d("2025-06-15", 200),
      d("2026-03-01", 50),
      d("2026-04-15", 999),
    ];
    expect(sumInWindow(rows, dateOf, valueOf, EPOCH, bucketEnd)).toBe(350);
  });

  test("U-04: periodDeltaPct — prior = 0 returns null (divide-by-zero guard)", () => {
    expect(periodDeltaPct(100, 0)).toBeNull();
  });

  test("U-05: periodDeltaPct — current 200, prior 100 → 1.0", () => {
    expect(periodDeltaPct(200, 100)).toBe(1.0);
  });

  test("U-06: asOfWindow — empty rows returns []", () => {
    expect(asOfWindow<Row>([], dateOf, new Date("2026-01-01"))).toEqual([]);
  });

  test("U-07: asOfWindow — rows after cutoff excluded", () => {
    const rows = [d("2026-01-01", 1), d("2026-07-01", 2)];
    const result = asOfWindow(rows, dateOf, new Date("2026-06-30"));
    expect(result).toHaveLength(1);
    expect(result[0].v).toBe(1);
  });

  test("U-08: inWindow — empty rows returns []", () => {
    expect(inWindow<Row>([], dateOf, new Date("2026-01-01"), new Date("2026-12-31"))).toEqual([]);
  });

  test("U-09: getPeriodWindow — YTD at 2026-06-30 → start Jan 1 2026", () => {
    const w = getPeriodWindow("YTD", FIXED_NOW);
    expect(w.start.toISOString()).toBe("2026-01-01T00:00:00.000Z");
    expect(w.end).toEqual(FIXED_NOW);
    expect(w.label).toBe("YTD");
  });

  test("U-10: getPeriodWindow — QoQ at 2026-02-15 → priorQStart in prior-year Q4", () => {
    const feb2026 = new Date("2026-02-15T12:00:00Z");
    const w = getPeriodWindow("QoQ", feb2026);
    // Current quarter = Q1 2026 (month 0). Prior quarter = Q4 2025 (month -3 of 2026 = Oct 2025).
    expect(w.priorStart.getUTCFullYear()).toBe(2025);
    expect(w.priorStart.getUTCMonth()).toBe(9); // October
  });
});
