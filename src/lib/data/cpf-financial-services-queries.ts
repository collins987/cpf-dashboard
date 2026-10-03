import type {
  PensionSchemeRow,
  SchemeMemberRow,
  ContributionRow,
  WithdrawalRow,
  TrustAccountRow,
  TrustBeneficiaryRow,
  AgencyMandateRow,
  AgencyTransactionRow,
  FeeLedgerRow,
  Subsidiary,
} from "@/types/database";
import { runSelect } from "./helpers";

export const SUBSIDIARY_CPF_FS: Subsidiary = "cpf_financial_services";

const mapPensionScheme = (r: Record<string, unknown>): PensionSchemeRow => ({
  id: r.id as string,
  subsidiaryId: r.subsidiary_id as Subsidiary,
  status: r.status as PensionSchemeRow["status"],
});

const mapSchemeMember = (r: Record<string, unknown>): SchemeMemberRow => ({
  id: r.id as string,
  pensionSchemeId: r.pension_scheme_id as string,
  memberId: r.member_id as string,
});

const mapContribution = (r: Record<string, unknown>): ContributionRow => ({
  id: r.id as string,
  pensionSchemeId: r.pension_scheme_id as string,
  amount: Number(r.amount),
  period: r.period as string,
});

const mapWithdrawal = (r: Record<string, unknown>): WithdrawalRow => ({
  id: r.id as string,
  pensionSchemeId: r.pension_scheme_id as string,
  amount: Number(r.amount),
  period: r.period as string,
});

const mapTrustAccount = (r: Record<string, unknown>): TrustAccountRow => ({
  id: r.id as string,
  subsidiaryId: r.subsidiary_id as Subsidiary,
  trustAssetValue: Number(r.trust_asset_value),
  status: r.status as TrustAccountRow["status"],
});

const mapTrustBeneficiary = (r: Record<string, unknown>): TrustBeneficiaryRow => ({
  id: r.id as string,
  trustAccountId: r.trust_account_id as string,
  beneficiaryId: r.beneficiary_id as string,
});

const mapAgencyMandate = (r: Record<string, unknown>): AgencyMandateRow => ({
  id: r.id as string,
  subsidiaryId: r.subsidiary_id as Subsidiary,
  principalId: r.principal_id as string,
});

const mapAgencyTransaction = (r: Record<string, unknown>): AgencyTransactionRow => ({
  id: r.id as string,
  agencyMandateId: r.agency_mandate_id as string,
  amount: Number(r.amount),
  createdAt: r.created_at as string,
});

const mapFeeLedger = (r: Record<string, unknown>): FeeLedgerRow => ({
  id: r.id as string,
  subsidiaryId: r.subsidiary_id as Subsidiary,
  source: r.source as FeeLedgerRow["source"],
  feeAmount: Number(r.fee_amount),
  period: r.period as string,
});

export function getPensionSchemes(
  subsidiaryId: Subsidiary = SUBSIDIARY_CPF_FS,
): Promise<PensionSchemeRow[]> {
  return runSelect("pension_scheme", (q) => q.eq("subsidiary_id", subsidiaryId), mapPensionScheme);
}

export function getSchemeMembers(pensionSchemeIds: string[]): Promise<SchemeMemberRow[]> {
  if (pensionSchemeIds.length === 0) return Promise.resolve([]);
  return runSelect(
    "scheme_member",
    (q) => q.in("pension_scheme_id", pensionSchemeIds),
    mapSchemeMember,
  );
}

export function getContributions(
  pensionSchemeIds: string[],
  period?: string,
): Promise<ContributionRow[]> {
  if (pensionSchemeIds.length === 0) return Promise.resolve([]);
  return runSelect(
    "contribution",
    (q) =>
      period
        ? q.in("pension_scheme_id", pensionSchemeIds).eq("period", period)
        : q.in("pension_scheme_id", pensionSchemeIds),
    mapContribution,
  );
}

export function getWithdrawals(
  pensionSchemeIds: string[],
  period?: string,
): Promise<WithdrawalRow[]> {
  if (pensionSchemeIds.length === 0) return Promise.resolve([]);
  return runSelect(
    "withdrawal",
    (q) =>
      period
        ? q.in("pension_scheme_id", pensionSchemeIds).eq("period", period)
        : q.in("pension_scheme_id", pensionSchemeIds),
    mapWithdrawal,
  );
}

export function getTrustAccounts(
  subsidiaryId: Subsidiary = SUBSIDIARY_CPF_FS,
): Promise<TrustAccountRow[]> {
  return runSelect("trust_account", (q) => q.eq("subsidiary_id", subsidiaryId), mapTrustAccount);
}

export function getTrustBeneficiaries(trustAccountIds: string[]): Promise<TrustBeneficiaryRow[]> {
  if (trustAccountIds.length === 0) return Promise.resolve([]);
  return runSelect(
    "trust_beneficiary",
    (q) => q.in("trust_account_id", trustAccountIds),
    mapTrustBeneficiary,
  );
}

export function getAgencyMandates(
  subsidiaryId: Subsidiary = SUBSIDIARY_CPF_FS,
): Promise<AgencyMandateRow[]> {
  return runSelect("agency_mandate", (q) => q.eq("subsidiary_id", subsidiaryId), mapAgencyMandate);
}

export function getAgencyTransactions(agencyMandateIds: string[]): Promise<AgencyTransactionRow[]> {
  if (agencyMandateIds.length === 0) return Promise.resolve([]);
  return runSelect(
    "agency_transaction",
    (q) => q.in("agency_mandate_id", agencyMandateIds),
    mapAgencyTransaction,
  );
}

export function getFeeLedger(
  subsidiaryId: Subsidiary = SUBSIDIARY_CPF_FS,
  period?: string,
): Promise<FeeLedgerRow[]> {
  return runSelect(
    "fee_ledger",
    (q) =>
      period
        ? q.eq("subsidiary_id", subsidiaryId).eq("period", period)
        : q.eq("subsidiary_id", subsidiaryId),
    mapFeeLedger,
  );
}
