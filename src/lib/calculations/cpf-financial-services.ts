import type {
  ContributionRow,
  WithdrawalRow,
  PensionSchemeRow,
  SchemeMemberRow,
  TrustAccountRow,
  TrustBeneficiaryRow,
  AgencyMandateRow,
  AgencyTransactionRow,
  FeeLedgerRow,
} from "@/types/database";

/** Sum of contributions received in the rows passed in (already period-filtered by the caller). */
export function calculateMemberContributions(contributions: ContributionRow[]): number {
  return contributions.reduce((sum, c) => sum + c.amount, 0);
}

/**
 * opening + contributions − withdrawals + investment returns — the standard
 * pension fund roll-forward.
 */
export function calculateFundBalance(
  openingBalance: number,
  contributions: ContributionRow[],
  withdrawals: WithdrawalRow[],
  investmentReturns: number,
): number {
  const totalContributions = contributions.reduce((sum, c) => sum + c.amount, 0);
  const totalWithdrawals = withdrawals.reduce((sum, w) => sum + w.amount, 0);
  return openingBalance + totalContributions - totalWithdrawals + investmentReturns;
}

/** Distinct active pension schemes. */
export function calculateActiveSchemes(schemes: PensionSchemeRow[]): number {
  return schemes.filter((s) => s.status === "active").length;
}

/** Distinct members across the scheme-membership rows passed in. */
export function calculateMembers(members: SchemeMemberRow[]): number {
  return new Set(members.map((m) => m.memberId)).size;
}

/** Sum of trust asset values across active trusts. */
export function calculateAssetsUnderAdministration(trusts: TrustAccountRow[]): number {
  return trusts.filter((t) => t.status === "active").reduce((sum, t) => sum + t.trustAssetValue, 0);
}

/** Distinct active trusts. */
export function calculateNumberOfTrusts(trusts: TrustAccountRow[]): number {
  return trusts.filter((t) => t.status === "active").length;
}

/** Distinct beneficiaries across the trust-beneficiary rows passed in. */
export function calculateTrustBeneficiaries(beneficiaries: TrustBeneficiaryRow[]): number {
  return new Set(beneficiaries.map((b) => b.beneficiaryId)).size;
}

/**
 * (current period AUA − prior period AUA) / prior period AUA.
 * Edge case: a trust with no activity this period is included at 0 change, not excluded —
 * zero is a valid input to this formula, not a reason to omit the trust.
 * Edge case: prior AUA is 0 -> null (N/A), not a divide-by-zero.
 */
export function calculateTrustFundGrowth(currentAua: number, priorAua: number): number | null {
  if (priorAua === 0) return null;
  return (currentAua - priorAua) / priorAua;
}

/** Sum of agency transaction amounts. */
export function calculateAgencyTransactionValue(transactions: AgencyTransactionRow[]): number {
  return transactions.reduce((sum, t) => sum + t.amount, 0);
}

/** Count of agency transactions. */
export function calculateAgencyTransactionVolume(transactions: AgencyTransactionRow[]): number {
  return transactions.length;
}

/** Distinct principals under an agency mandate. */
export function calculatePrincipalsServed(mandates: AgencyMandateRow[]): number {
  return new Set(mandates.map((m) => m.principalId)).size;
}

/** Sum of fees earned on agency transactions. */
export function calculateAgencyFeeIncome(feeLedger: FeeLedgerRow[]): number {
  return feeLedger.filter((f) => f.source === "agency").reduce((sum, f) => sum + f.feeAmount, 0);
}
