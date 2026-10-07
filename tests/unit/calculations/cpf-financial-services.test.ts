import { describe, it, expect } from "vitest";
import {
  calculateMemberContributions,
  calculateFundBalance,
  calculateActiveSchemes,
  calculateMembers,
  calculateAssetsUnderAdministration,
  calculateNumberOfTrusts,
  calculateTrustBeneficiaries,
  calculateTrustFundGrowth,
  calculateAgencyTransactionValue,
  calculateAgencyTransactionVolume,
  calculatePrincipalsServed,
  calculateAgencyFeeIncome,
} from "@/lib/calculations/cpf-financial-services";
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

const contribution = (over: Partial<ContributionRow> = {}): ContributionRow => ({
  id: "C",
  pensionSchemeId: "S",
  amount: 1000,
  period: "2026-06",
  ...over,
});

const withdrawal = (over: Partial<WithdrawalRow> = {}): WithdrawalRow => ({
  id: "W",
  pensionSchemeId: "S",
  amount: 500,
  period: "2026-06",
  ...over,
});

const scheme = (over: Partial<PensionSchemeRow> = {}): PensionSchemeRow => ({
  id: "S",
  subsidiaryId: "cpf_financial_services",
  status: "active",
  ...over,
});

const member = (over: Partial<SchemeMemberRow> = {}): SchemeMemberRow => ({
  id: "M",
  pensionSchemeId: "S",
  memberId: "P",
  ...over,
});

const trust = (over: Partial<TrustAccountRow> = {}): TrustAccountRow => ({
  id: "T",
  subsidiaryId: "cpf_financial_services",
  trustAssetValue: 1000,
  status: "active",
  ...over,
});

const beneficiary = (over: Partial<TrustBeneficiaryRow> = {}): TrustBeneficiaryRow => ({
  id: "B",
  trustAccountId: "T",
  beneficiaryId: "P",
  ...over,
});

const mandate = (over: Partial<AgencyMandateRow> = {}): AgencyMandateRow => ({
  id: "AM",
  subsidiaryId: "cpf_financial_services",
  principalId: "P",
  ...over,
});

const agencyTxn = (over: Partial<AgencyTransactionRow> = {}): AgencyTransactionRow => ({
  id: "AT",
  agencyMandateId: "AM",
  amount: 100,
  createdAt: "2026-01-01",
  ...over,
});

const fee = (over: Partial<FeeLedgerRow> = {}): FeeLedgerRow => ({
  id: "F",
  subsidiaryId: "cpf_financial_services",
  source: "agency",
  feeAmount: 50,
  period: "2026-06",
  ...over,
});

describe("calculateMemberContributions", () => {
  it("sums contribution amounts", () => {
    expect(
      calculateMemberContributions([contribution({ amount: 100 }), contribution({ amount: 200 })]),
    ).toBe(300);
  });
  it("empty → 0", () => expect(calculateMemberContributions([])).toBe(0));
});

describe("calculateFundBalance", () => {
  it("opening + contributions - withdrawals + returns", () => {
    expect(
      calculateFundBalance(
        10_000,
        [contribution({ amount: 1000 })],
        [withdrawal({ amount: 500 })],
        200,
      ),
    ).toBe(10_700);
  });

  it("no contributions/withdrawals → opening + returns", () => {
    expect(calculateFundBalance(10_000, [], [], 100)).toBe(10_100);
  });

  it("can go negative if withdrawals exceed opening + contributions", () => {
    expect(calculateFundBalance(100, [], [withdrawal({ amount: 500 })], 0)).toBe(-400);
  });
});

describe("calculateActiveSchemes / Members", () => {
  it("counts active schemes only", () => {
    expect(calculateActiveSchemes([scheme(), scheme({ status: "closed" }), scheme()])).toBe(2);
    expect(calculateActiveSchemes([])).toBe(0);
  });

  it("members = distinct memberId across membership rows", () => {
    expect(
      calculateMembers([
        member({ memberId: "a" }),
        member({ memberId: "a" }),
        member({ memberId: "b" }),
      ]),
    ).toBe(2);
    expect(calculateMembers([])).toBe(0);
  });
});

describe("calculateAssetsUnderAdministration / NumberOfTrusts / Beneficiaries", () => {
  it("AUA sums active trust values only", () => {
    expect(
      calculateAssetsUnderAdministration([
        trust({ trustAssetValue: 500 }),
        trust({ trustAssetValue: 300, status: "closed" }),
        trust({ trustAssetValue: 200 }),
      ]),
    ).toBe(700);
    expect(calculateAssetsUnderAdministration([])).toBe(0);
  });

  it("number of trusts = active only", () => {
    expect(calculateNumberOfTrusts([trust(), trust({ status: "closed" })])).toBe(1);
  });

  it("beneficiaries = distinct beneficiaryId", () => {
    expect(
      calculateTrustBeneficiaries([
        beneficiary({ beneficiaryId: "a" }),
        beneficiary({ beneficiaryId: "a" }),
        beneficiary({ beneficiaryId: "b" }),
      ]),
    ).toBe(2);
    expect(calculateTrustBeneficiaries([])).toBe(0);
  });
});

describe("calculateTrustFundGrowth", () => {
  it("(current - prior) / prior", () => {
    expect(calculateTrustFundGrowth(1100, 1000)).toBeCloseTo(0.1, 5);
  });

  it("prior = 0 → null (edge case)", () => {
    expect(calculateTrustFundGrowth(1000, 0)).toBeNull();
  });

  it("current < prior yields negative growth", () => {
    expect(calculateTrustFundGrowth(900, 1000)).toBeCloseTo(-0.1, 5);
  });
});

describe("Agency calcs", () => {
  it("transaction value = sum, volume = count", () => {
    expect(
      calculateAgencyTransactionValue([agencyTxn({ amount: 50 }), agencyTxn({ amount: 150 })]),
    ).toBe(200);
    expect(calculateAgencyTransactionVolume([agencyTxn(), agencyTxn(), agencyTxn()])).toBe(3);
    expect(calculateAgencyTransactionValue([])).toBe(0);
    expect(calculateAgencyTransactionVolume([])).toBe(0);
  });

  it("principals served = distinct principalId", () => {
    expect(
      calculatePrincipalsServed([
        mandate({ principalId: "a" }),
        mandate({ principalId: "a" }),
        mandate({ principalId: "b" }),
      ]),
    ).toBe(2);
    expect(calculatePrincipalsServed([])).toBe(0);
  });

  it("agency fee income filters source=agency", () => {
    expect(calculateAgencyFeeIncome([fee({ feeAmount: 10 }), fee({ feeAmount: 20 })])).toBe(30);
    expect(calculateAgencyFeeIncome([])).toBe(0);
  });
});
