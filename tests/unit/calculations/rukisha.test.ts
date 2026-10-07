import { describe, it, expect } from "vitest";
import {
  calculatePortfolioValue,
  calculateActiveBorrowers,
  calculateDefaultRate,
  calculateDefaultRateByProduct,
  calculateRepaymentRate,
  calculateTransactionVolume,
  calculateTransactionValue,
  calculateActiveWallets,
  calculateAvgTransactionSize,
  calculateGoalBasedSavings,
  calculatePensionLinkedSavings,
  calculateActiveSavers,
  calculateSavingsToLoanRatio,
} from "@/lib/calculations/rukisha";
import type {
  LoanAccountRow,
  RepaymentRow,
  TransactionRow,
  WalletRow,
  SavingsAccountRow,
} from "@/types/database";

const loan = (over: Partial<LoanAccountRow> = {}): LoanAccountRow => ({
  id: "L",
  subsidiaryId: "rukisha",
  borrowerId: "B",
  product: "personal",
  outstandingBalance: 1000,
  daysOverdue: 0,
  status: "active",
  ...over,
});

const repayment = (over: Partial<RepaymentRow> = {}): RepaymentRow => ({
  id: "R",
  loanAccountId: "L",
  amountDue: 100,
  amountPaid: 100,
  dueDate: "2026-01-01",
  paidDate: "2026-01-02",
  ...over,
});

const txn = (over: Partial<TransactionRow> = {}): TransactionRow => ({
  id: "T",
  subsidiaryId: "rukisha",
  walletId: "W",
  type: "merchant_payment",
  amount: 100,
  createdAt: "2026-01-01",
  ...over,
});

const wallet = (over: Partial<WalletRow> = {}): WalletRow => ({
  id: "W",
  subsidiaryId: "rukisha",
  status: "active",
  lastTransactionAt: "2026-01-01",
  ...over,
});

const savings = (over: Partial<SavingsAccountRow> = {}): SavingsAccountRow => ({
  id: "S",
  subsidiaryId: "rukisha",
  accountHolderId: "H",
  savingsType: "goal_based",
  balance: 1000,
  ...over,
});

describe("calculatePortfolioValue", () => {
  it("sums outstanding balances of active loans only", () => {
    expect(
      calculatePortfolioValue([
        loan({ outstandingBalance: 500 }),
        loan({ outstandingBalance: 300, status: "closed" }),
        loan({ outstandingBalance: 200, status: "written_off" }),
        loan({ outstandingBalance: 100 }),
      ]),
    ).toBe(600);
  });

  it("empty set → 0 (not null, sum over empty is 0)", () => {
    expect(calculatePortfolioValue([])).toBe(0);
  });

  it("all closed → 0", () => {
    expect(calculatePortfolioValue([loan({ status: "closed" })])).toBe(0);
  });
});

describe("calculateActiveBorrowers", () => {
  it("counts distinct borrowers across active loans", () => {
    expect(
      calculateActiveBorrowers([
        loan({ borrowerId: "a" }),
        loan({ borrowerId: "a" }),
        loan({ borrowerId: "b" }),
        loan({ borrowerId: "c", status: "closed" }),
      ]),
    ).toBe(2);
  });

  it("empty set → 0", () => {
    expect(calculateActiveBorrowers([])).toBe(0);
  });
});

describe("calculateDefaultRate", () => {
  it("overdue > 90 days / total, blended across products", () => {
    expect(
      calculateDefaultRate([
        loan({ daysOverdue: 100 }),
        loan({ daysOverdue: 10 }),
        loan({ daysOverdue: 0 }),
        loan({ daysOverdue: 0 }),
      ]),
    ).toBeCloseTo(0.25, 5);
  });

  it("no loans → null (edge case: avoid 0/0)", () => {
    expect(calculateDefaultRate([])).toBeNull();
  });

  it("exactly 90 days is NOT a default (strict > 90)", () => {
    expect(calculateDefaultRate([loan({ daysOverdue: 90 })])).toBe(0);
  });
});

describe("calculateDefaultRateByProduct", () => {
  it("groups by product and omits products with no loans", () => {
    const r = calculateDefaultRateByProduct([
      loan({ product: "personal", daysOverdue: 100 }),
      loan({ product: "personal", daysOverdue: 0 }),
      loan({ product: "business", daysOverdue: 0 }),
    ]);
    expect(r.personal).toBeCloseTo(0.5, 5);
    expect(r.business).toBe(0);
    expect("asset_finance" in r).toBe(false);
  });

  it("empty set → empty object", () => {
    expect(calculateDefaultRateByProduct([])).toEqual({});
  });
});

describe("calculateRepaymentRate", () => {
  it("sum(paid) / sum(due)", () => {
    expect(
      calculateRepaymentRate([
        repayment({ amountDue: 100, amountPaid: 90 }),
        repayment({ amountDue: 100, amountPaid: 100 }),
      ]),
    ).toBeCloseTo(0.95, 5);
  });

  it("nothing scheduled → null (edge case: avoid 0/0)", () => {
    expect(calculateRepaymentRate([])).toBeNull();
    expect(calculateRepaymentRate([repayment({ amountDue: 0, amountPaid: 0 })])).toBeNull();
  });

  it("overpaid returns > 1", () => {
    expect(calculateRepaymentRate([repayment({ amountDue: 100, amountPaid: 110 })])).toBeCloseTo(
      1.1,
      5,
    );
  });
});

describe("calculateTransactionVolume / Value / AvgSize", () => {
  it("volume = count", () => {
    expect(calculateTransactionVolume([txn(), txn(), txn()])).toBe(3);
    expect(calculateTransactionVolume([])).toBe(0);
  });

  it("value = sum of amounts", () => {
    expect(calculateTransactionValue([txn({ amount: 50 }), txn({ amount: 150 })])).toBe(200);
    expect(calculateTransactionValue([])).toBe(0);
  });

  it("avg size = value / volume; zero txns → null (edge case)", () => {
    expect(calculateAvgTransactionSize([txn({ amount: 100 }), txn({ amount: 200 })])).toBe(150);
    expect(calculateAvgTransactionSize([])).toBeNull();
  });
});

describe("calculateActiveWallets", () => {
  it("counts only active (not dormant) wallets", () => {
    expect(calculateActiveWallets([wallet(), wallet({ status: "dormant" }), wallet()])).toBe(2);
    expect(calculateActiveWallets([])).toBe(0);
  });
});

describe("calculateGoalBasedSavings / PensionLinkedSavings / ActiveSavers / SavingsToLoanRatio", () => {
  it("goal_based sums only goal_based balances", () => {
    expect(
      calculateGoalBasedSavings([
        savings({ savingsType: "goal_based", balance: 500 }),
        savings({ savingsType: "pension_linked", balance: 1000 }),
      ]),
    ).toBe(500);
  });

  it("pension_linked returns total + distinct contributors", () => {
    const r = calculatePensionLinkedSavings([
      savings({ savingsType: "pension_linked", balance: 100, accountHolderId: "x" }),
      savings({ savingsType: "pension_linked", balance: 200, accountHolderId: "x" }),
      savings({ savingsType: "pension_linked", balance: 300, accountHolderId: "y" }),
      savings({ savingsType: "goal_based", balance: 999, accountHolderId: "z" }),
    ]);
    expect(r.total).toBe(600);
    expect(r.contributors).toBe(2);
  });

  it("pension_linked empty → {total:0, contributors:0}", () => {
    expect(calculatePensionLinkedSavings([])).toEqual({ total: 0, contributors: 0 });
  });

  it("active savers = distinct holders across both types", () => {
    expect(
      calculateActiveSavers([
        savings({ accountHolderId: "a" }),
        savings({ accountHolderId: "a", savingsType: "pension_linked" }),
        savings({ accountHolderId: "b" }),
      ]),
    ).toBe(2);
    expect(calculateActiveSavers([])).toBe(0);
  });

  it("savings-to-loan ratio = savings / portfolio; portfolio=0 → null (edge case)", () => {
    expect(calculateSavingsToLoanRatio(5000, 10000)).toBe(0.5);
    expect(calculateSavingsToLoanRatio(0, 0)).toBeNull();
    expect(calculateSavingsToLoanRatio(100, 0)).toBeNull();
  });
});
