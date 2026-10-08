import type {
  LoanAccountRow,
  RepaymentRow,
  TransactionRow,
  WalletRow,
  SavingsAccountRow,
  Subsidiary,
} from "@/types/database";
import { runSelect, runSelectIn } from "./helpers";

function mapLoanAccount(r: Record<string, unknown>): LoanAccountRow {
  return {
    id: r.id as string,
    subsidiaryId: r.subsidiary_id as Subsidiary,
    borrowerId: r.borrower_id as string,
    product: r.product as LoanAccountRow["product"],
    outstandingBalance: Number(r.outstanding_balance),
    daysOverdue: Number(r.days_overdue),
    status: r.status as LoanAccountRow["status"],
    originationDate: (r.origination_date as string) ?? new Date().toISOString(),
  };
}

function mapRepayment(r: Record<string, unknown>): RepaymentRow {
  return {
    id: r.id as string,
    loanAccountId: r.loan_account_id as string,
    amountDue: Number(r.amount_due),
    amountPaid: Number(r.amount_paid),
    dueDate: r.due_date as string,
    paidDate: (r.paid_date as string) ?? null,
  };
}

function mapTransaction(r: Record<string, unknown>): TransactionRow {
  return {
    id: r.id as string,
    subsidiaryId: r.subsidiary_id as Subsidiary,
    walletId: r.wallet_id as string,
    type: r.type as TransactionRow["type"],
    amount: Number(r.amount),
    createdAt: r.created_at as string,
  };
}

function mapWallet(r: Record<string, unknown>): WalletRow {
  return {
    id: r.id as string,
    subsidiaryId: r.subsidiary_id as Subsidiary,
    status: r.status as WalletRow["status"],
    lastTransactionAt: (r.last_transaction_at as string) ?? null,
    openedDate: (r.opened_date as string) ?? new Date().toISOString(),
  };
}

function mapSavingsAccount(r: Record<string, unknown>): SavingsAccountRow {
  return {
    id: r.id as string,
    subsidiaryId: r.subsidiary_id as Subsidiary,
    accountHolderId: r.account_holder_id as string,
    savingsType: r.savings_type as SavingsAccountRow["savingsType"],
    balance: Number(r.balance),
    openedDate: (r.opened_date as string) ?? new Date().toISOString(),
  };
}

export const SUBSIDIARY_RUKISHA: Subsidiary = "rukisha";

export function getLoanAccounts(
  subsidiaryId: Subsidiary = SUBSIDIARY_RUKISHA,
): Promise<LoanAccountRow[]> {
  return runSelect("loan_account", (q) => q.eq("subsidiary_id", subsidiaryId), mapLoanAccount);
}

export function getRepayments(loanAccountIds: string[]): Promise<RepaymentRow[]> {
  return runSelectIn("repayment", "loan_account_id", loanAccountIds, (q) => q, mapRepayment);
}

export function getTransactions(
  subsidiaryId: Subsidiary = SUBSIDIARY_RUKISHA,
  periodStart?: string,
): Promise<TransactionRow[]> {
  return runSelect(
    "transaction",
    (q) =>
      periodStart
        ? q.eq("subsidiary_id", subsidiaryId).gte("created_at", periodStart)
        : q.eq("subsidiary_id", subsidiaryId),
    mapTransaction,
  );
}

export function getWallets(subsidiaryId: Subsidiary = SUBSIDIARY_RUKISHA): Promise<WalletRow[]> {
  return runSelect("wallet", (q) => q.eq("subsidiary_id", subsidiaryId), mapWallet);
}

export function getSavingsAccounts(
  subsidiaryId: Subsidiary = SUBSIDIARY_RUKISHA,
): Promise<SavingsAccountRow[]> {
  return runSelect(
    "savings_account",
    (q) => q.eq("subsidiary_id", subsidiaryId),
    mapSavingsAccount,
  );
}
