/**
 * Row types for every table in the Database Design (Phase 3 SDD §5).
 * Kept as plain types, not an ORM's generated types, so the Core Logic
 * layer can depend on them without depending on Supabase (Core Design
 * Principles §7 — mind the direction of dependencies).
 */

export type Subsidiary = "rukisha" | "cpf_financial_services" | "cpf_capital_advisory";

export type Period = "MoM" | "QoQ" | "YTD";

// ---------- Rukisha ----------

export interface LoanAccountRow {
  id: string;
  subsidiaryId: Subsidiary;
  borrowerId: string;
  product: "personal" | "business" | "asset_finance";
  outstandingBalance: number;
  daysOverdue: number;
  status: "active" | "closed" | "written_off";
}

export interface RepaymentRow {
  id: string;
  loanAccountId: string;
  amountDue: number;
  amountPaid: number;
  dueDate: string;
  paidDate: string | null;
}

export interface TransactionRow {
  id: string;
  subsidiaryId: Subsidiary;
  walletId: string;
  type: "merchant_payment" | "transfer";
  amount: number;
  createdAt: string;
}

export interface WalletRow {
  id: string;
  subsidiaryId: Subsidiary;
  status: "active" | "dormant";
  lastTransactionAt: string | null;
}

export interface SavingsAccountRow {
  id: string;
  subsidiaryId: Subsidiary;
  accountHolderId: string;
  savingsType: "goal_based" | "pension_linked";
  balance: number;
}

// ---------- CPF Financial Services ----------

export interface PensionSchemeRow {
  id: string;
  subsidiaryId: Subsidiary;
  status: "active" | "closed";
}

export interface SchemeMemberRow {
  id: string;
  pensionSchemeId: string;
  memberId: string;
}

export interface ContributionRow {
  id: string;
  pensionSchemeId: string;
  amount: number;
  period: string;
}

export interface WithdrawalRow {
  id: string;
  pensionSchemeId: string;
  amount: number;
  period: string;
}

export interface FundBalanceRow {
  id: string;
  pensionSchemeId: string;
  period: string;
  openingBalance: number;
  closingBalance: number;
  investmentReturns: number;
}

export interface TrustAccountRow {
  id: string;
  subsidiaryId: Subsidiary;
  trustAssetValue: number;
  status: "active" | "closed";
}

export interface TrustBeneficiaryRow {
  id: string;
  trustAccountId: string;
  beneficiaryId: string;
}

export interface AgencyMandateRow {
  id: string;
  subsidiaryId: Subsidiary;
  principalId: string;
}

export interface AgencyTransactionRow {
  id: string;
  agencyMandateId: string;
  amount: number;
  createdAt: string;
}

export interface FeeLedgerRow {
  id: string;
  subsidiaryId: Subsidiary;
  source: "agency";
  feeAmount: number;
  period: string;
}

// ---------- CPF Capital & Advisory ----------

export interface ReitHoldingRow {
  id: string;
  subsidiaryId: Subsidiary;
  holderId: string;
  unitBalance: number;
}

export interface ReitNavHistoryRow {
  id: string;
  subsidiaryId: Subsidiary;
  period: string;
  navPerUnit: number;
}

export interface ReitDistributionRow {
  id: string;
  subsidiaryId: Subsidiary;
  period: string;
  distributionPerUnit: number;
  unitPrice: number;
}

export interface DealRow {
  id: string;
  subsidiaryId: Subsidiary;
  dealType: "structured_finance";
  dealValue: number;
  advisoryFee: number;
  closeDate: string;
}

export interface IssuanceRow {
  id: string;
  subsidiaryId: Subsidiary;
  instrumentType: "sukuk" | "bond";
  instrumentCode: string;
  issuanceValue: number;
  profitRate: number;
  amountOffered: number;
  amountSubscribed: number;
  issueDate: string;
}

// ---------- Group ----------

export interface PensionLinkSummaryRow {
  id: string;
  period: string;
  linkedSaversPct: number;
  linkedSaversCount: number;
  aumDeployedPct: number;
  returnsCreditedPct: number;
}
