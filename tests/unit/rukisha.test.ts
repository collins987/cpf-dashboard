/**
 * Phase 6 Section A — rukisha.ts unit tests (U-11 through U-23).
 */
import { describe, test, expect } from "vitest";
import {
  calculatePortfolioValue,
  calculateActiveBorrowers,
  calculateDefaultRate,
  calculateDefaultRateByProduct,
  calculateRepaymentRate,
  calculateAvgTransactionSize,
  calculateSavingsToLoanRatio,
  calculateGoalBasedSavings,
  calculateActiveSavers,
} from "@/lib/calculations/rukisha";
import { loan, repayment, tx, savings } from "./fixtures";

describe("rukisha.ts calculations", () => {
  test("U-11: calculatePortfolioValue — empty loans returns 0", () => {
    expect(calculatePortfolioValue([])).toBe(0);
  });

  test("U-12: calculatePortfolioValue — sums only active", () => {
    const loans = [
      loan({ status: "active", outstandingBalance: 100 }),
      loan({ status: "closed", outstandingBalance: 999 }),
      loan({ status: "written_off", outstandingBalance: 500 }),
      loan({ status: "active", outstandingBalance: 200 }),
    ];
    expect(calculatePortfolioValue(loans)).toBe(300);
  });

  test("U-13: calculateActiveBorrowers — duplicate borrowerIds counted once", () => {
    const loans = [
      loan({ status: "active", borrowerId: "b-1" }),
      loan({ status: "active", borrowerId: "b-1" }),
      loan({ status: "active", borrowerId: "b-2" }),
      loan({ status: "closed", borrowerId: "b-3" }),
    ];
    expect(calculateActiveBorrowers(loans)).toBe(2);
  });

  test("U-14: calculateDefaultRate — empty array returns null", () => {
    expect(calculateDefaultRate([])).toBeNull();
  });

  test("U-15: calculateDefaultRate — 10 loans, 0 overdue → 0", () => {
    const loans = Array.from({ length: 10 }, () => loan({ daysOverdue: 0 }));
    expect(calculateDefaultRate(loans)).toBe(0);
  });

  test("U-16: calculateDefaultRate — 10 loans, 3 overdue > 90 days → 0.3", () => {
    const loans = [
      ...Array.from({ length: 7 }, () => loan({ daysOverdue: 10 })),
      ...Array.from({ length: 3 }, () => loan({ daysOverdue: 120 })),
    ];
    expect(calculateDefaultRate(loans)).toBeCloseTo(0.3, 10);
  });

  test("U-17: calculateDefaultRateByProduct — product with no loans is omitted (not 0%)", () => {
    const loans = [loan({ product: "personal", daysOverdue: 100 })];
    const result = calculateDefaultRateByProduct(loans);
    expect(result).toHaveProperty("personal");
    expect(result).not.toHaveProperty("business");
    expect(result).not.toHaveProperty("asset_finance");
  });

  test("U-18: calculateRepaymentRate — scheduled = 0 returns null", () => {
    expect(calculateRepaymentRate([repayment({ amountDue: 0, amountPaid: 0 })])).toBeNull();
    expect(calculateRepaymentRate([])).toBeNull();
  });

  test("U-19: calculateRepaymentRate — received 800 of 1000 → 0.8", () => {
    const reps = [repayment({ amountDue: 1000, amountPaid: 800 })];
    expect(calculateRepaymentRate(reps)).toBeCloseTo(0.8);
  });

  test("U-20: calculateAvgTransactionSize — empty transactions returns null", () => {
    expect(calculateAvgTransactionSize([])).toBeNull();
  });

  test("U-21: calculateSavingsToLoanRatio — portfolioValue = 0 returns null", () => {
    expect(calculateSavingsToLoanRatio(1000, 0)).toBeNull();
  });

  test("U-22: calculateGoalBasedSavings — filters goal_based only", () => {
    const accts = [
      savings({ savingsType: "goal_based", balance: 100 }),
      savings({ savingsType: "pension_linked", balance: 999 }),
      savings({ savingsType: "goal_based", balance: 50 }),
    ];
    expect(calculateGoalBasedSavings(accts)).toBe(150);
  });

  test("U-23: calculateActiveSavers — duplicate holder ids counted once", () => {
    const accts = [
      savings({ accountHolderId: "h-1" }),
      savings({ accountHolderId: "h-1" }),
      savings({ accountHolderId: "h-2" }),
    ];
    expect(calculateActiveSavers(accts)).toBe(2);
  });

  // Supporting fixture usage keeps `tx` imported (used below) and demonstrates
  // a real avg transaction size calculation for a sanity assertion.
  test("U-20 extended: calculateAvgTransactionSize with transactions", () => {
    expect(calculateAvgTransactionSize([tx({ amount: 100 }), tx({ amount: 300 })])).toBe(200);
  });
});
