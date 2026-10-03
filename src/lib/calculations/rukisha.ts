import type {
  LoanAccountRow,
  RepaymentRow,
  TransactionRow,
  WalletRow,
  SavingsAccountRow,
} from "@/types/database";
import { DEFAULT_OVERDUE_DAYS } from "./constants";

/**
 * Sum of outstanding balances across active loan accounts.
 * Edge case: no active loans -> 0 (a sum over an empty set is correctly 0, not N/A).
 */
export function calculatePortfolioValue(loans: LoanAccountRow[]): number {
  return loans
    .filter((l) => l.status === "active")
    .reduce((sum, l) => sum + l.outstandingBalance, 0);
}

/** Distinct borrowers with an active loan account. */
export function calculateActiveBorrowers(loans: LoanAccountRow[]): number {
  const active = loans.filter((l) => l.status === "active");
  return new Set(active.map((l) => l.borrowerId)).size;
}

/**
 * Loans overdue beyond the threshold / total loans, blended across all products.
 * Edge case: no loans at all -> null (N/A), not a divide-by-zero.
 */
export function calculateDefaultRate(loans: LoanAccountRow[]): number | null {
  if (loans.length === 0) return null;
  const overdue = loans.filter((l) => l.daysOverdue > DEFAULT_OVERDUE_DAYS).length;
  return overdue / loans.length;
}

/** Default rate, grouped by loan product. Edge case: a product with no loans is omitted, not shown as 0%. */
export function calculateDefaultRateByProduct(loans: LoanAccountRow[]): Record<string, number> {
  const byProduct = new Map<string, LoanAccountRow[]>();
  for (const loan of loans) {
    const list = byProduct.get(loan.product) ?? [];
    list.push(loan);
    byProduct.set(loan.product, list);
  }
  const result: Record<string, number> = {};
  for (const [product, productLoans] of byProduct) {
    const rate = calculateDefaultRate(productLoans);
    if (rate !== null) result[product] = rate;
  }
  return result;
}

/**
 * Repayments received / repayments scheduled, for the rows passed in.
 * Edge case: nothing scheduled yet -> null (N/A), not a divide-by-zero.
 */
export function calculateRepaymentRate(repayments: RepaymentRow[]): number | null {
  const scheduled = repayments.reduce((sum, r) => sum + r.amountDue, 0);
  if (scheduled === 0) return null;
  const received = repayments.reduce((sum, r) => sum + r.amountPaid, 0);
  return received / scheduled;
}

/** Count of merchant payments and transfers in the rows passed in. */
export function calculateTransactionVolume(transactions: TransactionRow[]): number {
  return transactions.length;
}

/** Sum of transaction amounts in the rows passed in. */
export function calculateTransactionValue(transactions: TransactionRow[]): number {
  return transactions.reduce((sum, t) => sum + t.amount, 0);
}

/** Distinct wallets with at least one transaction in the rows passed in. */
export function calculateActiveWallets(wallets: WalletRow[]): number {
  return wallets.filter((w) => w.status === "active").length;
}

/** Transaction value / transaction volume. Edge case: zero transactions -> null (N/A). */
export function calculateAvgTransactionSize(transactions: TransactionRow[]): number | null {
  if (transactions.length === 0) return null;
  return calculateTransactionValue(transactions) / transactions.length;
}

/** Sum of goal-based savings balances. */
export function calculateGoalBasedSavings(savings: SavingsAccountRow[]): number {
  return savings
    .filter((s) => s.savingsType === "goal_based")
    .reduce((sum, s) => sum + s.balance, 0);
}

/** Sum of pension-linked savings balances, and the distinct contributor count that feeds the Group Connection layer. */
export function calculatePensionLinkedSavings(savings: SavingsAccountRow[]): {
  total: number;
  contributors: number;
} {
  const pensionLinked = savings.filter((s) => s.savingsType === "pension_linked");
  return {
    total: pensionLinked.reduce((sum, s) => sum + s.balance, 0),
    contributors: new Set(pensionLinked.map((s) => s.accountHolderId)).size,
  };
}

/** Distinct savers across both savings products. */
export function calculateActiveSavers(savings: SavingsAccountRow[]): number {
  return new Set(savings.map((s) => s.accountHolderId)).size;
}

/** (Goal-based + pension-linked balance) / Portfolio Value. Edge case: Portfolio Value is 0 -> null (N/A). */
export function calculateSavingsToLoanRatio(
  totalSavings: number,
  portfolioValue: number,
): number | null {
  if (portfolioValue === 0) return null;
  return totalSavings / portfolioValue;
}
