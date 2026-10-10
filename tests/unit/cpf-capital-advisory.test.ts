/**
 * Phase 6 Section A — cpf-capital-advisory.ts unit tests (U-32 through U-40).
 */
import { describe, test, expect } from "vitest";
import {
  getLatestUnitNav,
  calculateReitAum,
  calculateDistributionYield,
  calculateAverageDealSize,
  calculateWeightedAvgProfitRate,
  calculateSubscriptionRate,
  calculateUnitHolders,
} from "@/lib/calculations/cpf-capital-advisory";
import { nav, holding, distribution, issuance } from "./fixtures";

describe("cpf-capital-advisory.ts calculations", () => {
  test("U-32: getLatestUnitNav — empty history returns null", () => {
    expect(getLatestUnitNav([])).toBeNull();
  });

  test("U-33: getLatestUnitNav — multiple periods returns latest", () => {
    const history = [
      nav({ period: "2025-11", navPerUnit: 20.0 }),
      nav({ period: "2026-01", navPerUnit: 21.0 }),
      nav({ period: "2025-12", navPerUnit: 20.5 }),
    ];
    expect(getLatestUnitNav(history)).toBe(21.0);
  });

  test("U-34: calculateReitAum — latestNavPerUnit = 0 → 0 (no null guard)", () => {
    expect(calculateReitAum([holding({ unitBalance: 100 })], 0)).toBe(0);
  });

  test("U-35: calculateDistributionYield — unitPrice = 0 returns null", () => {
    expect(calculateDistributionYield(distribution({ unitPrice: 0 }))).toBeNull();
  });

  test("U-36: calculateAverageDealSize — dealCountYtd = 0 returns null", () => {
    expect(calculateAverageDealSize(1_000_000, 0)).toBeNull();
  });

  test("U-37: calculateWeightedAvgProfitRate — empty issuances (totalValue = 0) returns null", () => {
    expect(calculateWeightedAvgProfitRate([])).toBeNull();
  });

  test("U-38: calculateSubscriptionRate — amountOffered = 0 returns null", () => {
    expect(calculateSubscriptionRate(issuance({ amountOffered: 0 }))).toBeNull();
  });

  test("U-39: calculateSubscriptionRate — oversubscribed returns > 1.0 (valid)", () => {
    const iss = issuance({ amountOffered: 1_000_000, amountSubscribed: 1_180_000 });
    expect(calculateSubscriptionRate(iss)).toBeCloseTo(1.18);
  });

  test("U-40: calculateUnitHolders — duplicate holderIds counted once", () => {
    const h = [holding({ holderId: "a" }), holding({ holderId: "a" }), holding({ holderId: "b" })];
    expect(calculateUnitHolders(h)).toBe(2);
  });
});
