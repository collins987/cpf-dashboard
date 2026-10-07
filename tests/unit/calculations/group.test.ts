import { describe, it, expect } from "vitest";
import {
  calculateHeadlineAum,
  calculateTotalGroupAum,
  calculateTotalActiveClients,
  calculateGroupTransactionValue,
  getLatestPensionLinkSummary,
  calculateAumDeployedValue,
} from "@/lib/calculations/group";
import type { PensionLinkSummaryRow } from "@/types/database";

const link = (over: Partial<PensionLinkSummaryRow> = {}): PensionLinkSummaryRow => ({
  id: "L",
  period: "2026-06",
  linkedSaversPct: 0.1,
  linkedSaversCount: 10,
  aumDeployedPct: 0.2,
  returnsCreditedPct: 0.05,
  ...over,
});

describe("calculateHeadlineAum", () => {
  it("sums all components", () => {
    expect(calculateHeadlineAum([100, 200, 300])).toBe(600);
  });
  it("empty → 0", () => expect(calculateHeadlineAum([])).toBe(0));
});

describe("calculateTotalGroupAum / TotalActiveClients", () => {
  it("sums headline AUMs across subsidiaries", () => {
    expect(
      calculateTotalGroupAum([
        { headlineAum: 100, activeClients: 0 },
        { headlineAum: 200, activeClients: 0 },
      ]),
    ).toBe(300);
    expect(calculateTotalGroupAum([])).toBe(0);
  });

  it("sums active clients (simple sum, documented not-deduplicated per ADR-0002)", () => {
    expect(
      calculateTotalActiveClients([
        { headlineAum: 0, activeClients: 10 },
        { headlineAum: 0, activeClients: 20 },
      ]),
    ).toBe(30);
    expect(calculateTotalActiveClients([])).toBe(0);
  });
});

describe("calculateGroupTransactionValue", () => {
  it("sums all contributed subsidiary values", () => {
    expect(calculateGroupTransactionValue([100, 200, 300])).toBe(600);
    expect(calculateGroupTransactionValue([])).toBe(0);
  });
});

describe("getLatestPensionLinkSummary", () => {
  it("picks the row with the max period string", () => {
    expect(
      getLatestPensionLinkSummary([
        link({ period: "2026-01" }),
        link({ period: "2026-06", linkedSaversCount: 999 }),
        link({ period: "2026-03" }),
      ])?.linkedSaversCount,
    ).toBe(999);
  });

  it("no rows → null (edge case)", () => {
    expect(getLatestPensionLinkSummary([])).toBeNull();
  });
});

describe("calculateAumDeployedValue", () => {
  it("fund balance × AUM deployed pct", () => {
    expect(calculateAumDeployedValue(1_000, 0.25)).toBe(250);
    expect(calculateAumDeployedValue(0, 0.25)).toBe(0);
    expect(calculateAumDeployedValue(1_000, 0)).toBe(0);
  });
});
