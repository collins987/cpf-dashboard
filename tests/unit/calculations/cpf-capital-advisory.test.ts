import { describe, it, expect } from "vitest";
import {
  calculateReitAum,
  calculateUnitHolders,
  getLatestUnitNav,
  calculateDistributionYield,
  calculateDealCountYtd,
  calculateDealValueYtd,
  calculateAverageDealSize,
  calculateAdvisoryFeeIncome,
  calculateIssuanceCountYtd,
  calculateIssuanceValueYtd,
  calculateWeightedAvgProfitRate,
  calculateSubscriptionRate,
} from "@/lib/calculations/cpf-capital-advisory";
import type {
  ReitHoldingRow,
  ReitNavHistoryRow,
  ReitDistributionRow,
  DealRow,
  IssuanceRow,
} from "@/types/database";

const holding = (over: Partial<ReitHoldingRow> = {}): ReitHoldingRow => ({
  id: "H",
  subsidiaryId: "cpf_capital_advisory",
  holderId: "P",
  unitBalance: 100,
  ...over,
});

const nav = (over: Partial<ReitNavHistoryRow> = {}): ReitNavHistoryRow => ({
  id: "N",
  subsidiaryId: "cpf_capital_advisory",
  period: "2026-01",
  navPerUnit: 20,
  ...over,
});

const dist = (over: Partial<ReitDistributionRow> = {}): ReitDistributionRow => ({
  id: "D",
  subsidiaryId: "cpf_capital_advisory",
  period: "2026-06",
  distributionPerUnit: 1,
  unitPrice: 20,
  ...over,
});

const deal = (over: Partial<DealRow> = {}): DealRow => ({
  id: "DL",
  subsidiaryId: "cpf_capital_advisory",
  dealType: "structured_finance",
  dealValue: 1_000_000,
  advisoryFee: 10_000,
  closeDate: "2026-01-01",
  ...over,
});

const issuance = (over: Partial<IssuanceRow> = {}): IssuanceRow => ({
  id: "I",
  subsidiaryId: "cpf_capital_advisory",
  instrumentType: "sukuk",
  instrumentCode: "LNZ-SK-01",
  issuanceValue: 1_000_000,
  profitRate: 0.1,
  amountOffered: 1_000_000,
  amountSubscribed: 1_000_000,
  issueDate: "2026-01-01",
  ...over,
});

describe("REITs", () => {
  it("calculateReitAum = total units × latest NAV", () => {
    expect(
      calculateReitAum([holding({ unitBalance: 100 }), holding({ unitBalance: 50 })], 20),
    ).toBe(3000);
    expect(calculateReitAum([], 20)).toBe(0);
  });

  it("calculateUnitHolders = distinct holder count", () => {
    expect(
      calculateUnitHolders([
        holding({ holderId: "a" }),
        holding({ holderId: "a" }),
        holding({ holderId: "b" }),
      ]),
    ).toBe(2);
    expect(calculateUnitHolders([])).toBe(0);
  });

  it("getLatestUnitNav picks the row with the max period string", () => {
    expect(
      getLatestUnitNav([
        nav({ period: "2026-01", navPerUnit: 10 }),
        nav({ period: "2026-06", navPerUnit: 30 }),
        nav({ period: "2026-03", navPerUnit: 20 }),
      ]),
    ).toBe(30);
  });

  it("getLatestUnitNav: no history → null (edge case)", () => {
    expect(getLatestUnitNav([])).toBeNull();
  });

  it("calculateDistributionYield = per-unit / price; price=0 → null (edge case)", () => {
    expect(calculateDistributionYield(dist({ distributionPerUnit: 2, unitPrice: 20 }))).toBe(0.1);
    expect(calculateDistributionYield(dist({ unitPrice: 0 }))).toBeNull();
  });
});

describe("Deals YTD", () => {
  it("count = length, value = sum, fees = sum of advisoryFee", () => {
    const d = [
      deal({ dealValue: 500, advisoryFee: 50 }),
      deal({ dealValue: 500, advisoryFee: 25 }),
    ];
    expect(calculateDealCountYtd(d)).toBe(2);
    expect(calculateDealValueYtd(d)).toBe(1000);
    expect(calculateAdvisoryFeeIncome(d)).toBe(75);
    expect(calculateDealCountYtd([])).toBe(0);
    expect(calculateDealValueYtd([])).toBe(0);
    expect(calculateAdvisoryFeeIncome([])).toBe(0);
  });

  it("calculateAverageDealSize: value / count; count=0 → null (edge case)", () => {
    expect(calculateAverageDealSize(1_000, 4)).toBe(250);
    expect(calculateAverageDealSize(0, 0)).toBeNull();
  });
});

describe("Issuances YTD", () => {
  it("count / value sums", () => {
    const i = [issuance({ issuanceValue: 1000 }), issuance({ issuanceValue: 2000 })];
    expect(calculateIssuanceCountYtd(i)).toBe(2);
    expect(calculateIssuanceValueYtd(i)).toBe(3000);
    expect(calculateIssuanceCountYtd([])).toBe(0);
    expect(calculateIssuanceValueYtd([])).toBe(0);
  });

  it("weighted avg profit rate weighted by issuance value", () => {
    expect(
      calculateWeightedAvgProfitRate([
        issuance({ issuanceValue: 1000, profitRate: 0.1 }),
        issuance({ issuanceValue: 3000, profitRate: 0.2 }),
      ]),
    ).toBeCloseTo((1000 * 0.1 + 3000 * 0.2) / 4000, 6);
  });

  it("weighted avg: no issuances → null (edge case)", () => {
    expect(calculateWeightedAvgProfitRate([])).toBeNull();
    expect(calculateWeightedAvgProfitRate([issuance({ issuanceValue: 0 })])).toBeNull();
  });

  it("subscription rate = subscribed / offered; offered=0 → null (edge case)", () => {
    expect(
      calculateSubscriptionRate(issuance({ amountOffered: 1000, amountSubscribed: 1180 })),
    ).toBeCloseTo(1.18, 5);
    expect(calculateSubscriptionRate(issuance({ amountOffered: 0 }))).toBeNull();
  });
});
