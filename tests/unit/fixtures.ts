/**
 * Deterministic fixtures for Phase 6 unit tests. All dates are injected via
 * `FIXED_NOW` (2026-06-30) so period-window tests are reproducible regardless
 * of the real system clock.
 */
import type {
  LoanAccountRow,
  RepaymentRow,
  TransactionRow,
  WalletRow,
  SavingsAccountRow,
  PensionSchemeRow,
  SchemeMemberRow,
  ContributionRow,
  WithdrawalRow,
  TrustAccountRow,
  TrustBeneficiaryRow,
  AgencyMandateRow,
  AgencyTransactionRow,
  FeeLedgerRow,
  ReitHoldingRow,
  ReitNavHistoryRow,
  ReitDistributionRow,
  DealRow,
  IssuanceRow,
  PensionLinkSummaryRow,
} from "@/types/database";

export const FIXED_NOW = new Date("2026-06-30T12:00:00.000Z");

export function loan(partial: Partial<LoanAccountRow> = {}): LoanAccountRow {
  return {
    id: "l-" + Math.random().toString(36).slice(2, 8),
    subsidiaryId: "rukisha",
    borrowerId: "b-1",
    product: "personal",
    outstandingBalance: 10_000,
    daysOverdue: 0,
    status: "active",
    originationDate: "2026-01-15",
    ...partial,
  };
}

export function repayment(partial: Partial<RepaymentRow> = {}): RepaymentRow {
  return {
    id: "r-" + Math.random().toString(36).slice(2, 8),
    loanAccountId: "l-1",
    amountDue: 1000,
    amountPaid: 1000,
    dueDate: "2026-06-01",
    paidDate: "2026-06-01",
    ...partial,
  };
}

export function tx(partial: Partial<TransactionRow> = {}): TransactionRow {
  return {
    id: "t-" + Math.random().toString(36).slice(2, 8),
    subsidiaryId: "rukisha",
    walletId: "w-1",
    type: "merchant_payment",
    amount: 500,
    createdAt: "2026-06-15",
    ...partial,
  };
}

export function wallet(partial: Partial<WalletRow> = {}): WalletRow {
  return {
    id: "w-" + Math.random().toString(36).slice(2, 8),
    subsidiaryId: "rukisha",
    status: "active",
    lastTransactionAt: "2026-06-15",
    openedDate: "2026-01-10",
    ...partial,
  };
}

export function savings(partial: Partial<SavingsAccountRow> = {}): SavingsAccountRow {
  return {
    id: "s-" + Math.random().toString(36).slice(2, 8),
    subsidiaryId: "rukisha",
    accountHolderId: "h-1",
    savingsType: "goal_based",
    balance: 2000,
    openedDate: "2026-01-01",
    ...partial,
  };
}

export function scheme(partial: Partial<PensionSchemeRow> = {}): PensionSchemeRow {
  return {
    id: "sch-" + Math.random().toString(36).slice(2, 8),
    subsidiaryId: "cpf_financial_services",
    status: "active",
    openedDate: "2026-01-01",
    ...partial,
  };
}

export function member(partial: Partial<SchemeMemberRow> = {}): SchemeMemberRow {
  return {
    id: "m-" + Math.random().toString(36).slice(2, 8),
    pensionSchemeId: "sch-1",
    memberId: "mem-1",
    joinedDate: "2026-01-01",
    ...partial,
  };
}

export function contribution(partial: Partial<ContributionRow> = {}): ContributionRow {
  return {
    id: "c-" + Math.random().toString(36).slice(2, 8),
    pensionSchemeId: "sch-1",
    amount: 1_000_000,
    period: "2026-06",
    createdAt: "2026-06-10",
    ...partial,
  };
}

export function withdrawal(partial: Partial<WithdrawalRow> = {}): WithdrawalRow {
  return {
    id: "wd-" + Math.random().toString(36).slice(2, 8),
    pensionSchemeId: "sch-1",
    amount: 200_000,
    period: "2026-06",
    createdAt: "2026-06-15",
    ...partial,
  };
}

export function trust(partial: Partial<TrustAccountRow> = {}): TrustAccountRow {
  return {
    id: "tr-" + Math.random().toString(36).slice(2, 8),
    subsidiaryId: "cpf_financial_services",
    trustAssetValue: 100_000_000,
    status: "active",
    openedDate: "2026-01-01",
    ...partial,
  };
}

export function trustBen(partial: Partial<TrustBeneficiaryRow> = {}): TrustBeneficiaryRow {
  return {
    id: "tb-" + Math.random().toString(36).slice(2, 8),
    trustAccountId: "tr-1",
    beneficiaryId: "ben-1",
    addedDate: "2026-01-01",
    ...partial,
  };
}

export function mandate(partial: Partial<AgencyMandateRow> = {}): AgencyMandateRow {
  return {
    id: "a-" + Math.random().toString(36).slice(2, 8),
    subsidiaryId: "cpf_financial_services",
    principalId: "p-1",
    startedDate: "2026-01-01",
    ...partial,
  };
}

export function agencyTx(partial: Partial<AgencyTransactionRow> = {}): AgencyTransactionRow {
  return {
    id: "at-" + Math.random().toString(36).slice(2, 8),
    agencyMandateId: "a-1",
    amount: 50_000,
    createdAt: "2026-06-01",
    ...partial,
  };
}

export function fee(partial: Partial<FeeLedgerRow> = {}): FeeLedgerRow {
  return {
    id: "f-" + Math.random().toString(36).slice(2, 8),
    subsidiaryId: "cpf_financial_services",
    source: "agency",
    feeAmount: 10_000,
    period: "2026-06",
    createdAt: "2026-06-01",
    ...partial,
  };
}

export function holding(partial: Partial<ReitHoldingRow> = {}): ReitHoldingRow {
  return {
    id: "h-" + Math.random().toString(36).slice(2, 8),
    subsidiaryId: "cpf_capital_advisory",
    holderId: "hd-1",
    unitBalance: 100,
    acquiredDate: "2026-01-01",
    ...partial,
  };
}

export function nav(partial: Partial<ReitNavHistoryRow> = {}): ReitNavHistoryRow {
  return {
    id: "n-" + Math.random().toString(36).slice(2, 8),
    subsidiaryId: "cpf_capital_advisory",
    period: "2026-06",
    navPerUnit: 21.85,
    ...partial,
  };
}

export function distribution(partial: Partial<ReitDistributionRow> = {}): ReitDistributionRow {
  return {
    id: "d-" + Math.random().toString(36).slice(2, 8),
    subsidiaryId: "cpf_capital_advisory",
    period: "2026-06",
    distributionPerUnit: 2.14,
    unitPrice: 21.85,
    ...partial,
  };
}

export function deal(partial: Partial<DealRow> = {}): DealRow {
  return {
    id: "dl-" + Math.random().toString(36).slice(2, 8),
    subsidiaryId: "cpf_capital_advisory",
    dealType: "structured_finance",
    dealValue: 1_000_000_000,
    advisoryFee: 20_000_000,
    closeDate: "2026-06-01",
    ...partial,
  };
}

export function issuance(partial: Partial<IssuanceRow> = {}): IssuanceRow {
  return {
    id: "iss-" + Math.random().toString(36).slice(2, 8),
    subsidiaryId: "cpf_capital_advisory",
    instrumentType: "sukuk",
    instrumentCode: "LNZ-SK-01",
    issuanceValue: 2_100_000_000,
    profitRate: 0.1090,
    amountOffered: 2_190_000_000,
    amountSubscribed: 2_100_000_000 * 0.96,
    issueDate: "2026-03-01",
    ...partial,
  };
}

export function linkSummary(partial: Partial<PensionLinkSummaryRow> = {}): PensionLinkSummaryRow {
  return {
    id: "ls-" + Math.random().toString(36).slice(2, 8),
    period: "2026-06",
    linkedSaversPct: 0.396,
    linkedSaversCount: 38_200,
    aumDeployedPct: 0.22,
    returnsCreditedPct: 0.087,
    ...partial,
  };
}
