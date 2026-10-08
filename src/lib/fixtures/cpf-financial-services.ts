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
} from "@/types/database";
import { seededRandom, uuid, randomInt, randomFloat } from "./random";

const rand = seededRandom(2002);

export const pensionSchemes: PensionSchemeRow[] = Array.from({ length: 40 }, () => ({
  id: uuid(rand),
  subsidiaryId: "cpf_financial_services",
  status: "active",
  openedDate: "2025-10-01",
}));

export const schemeMembers: SchemeMemberRow[] = pensionSchemes.flatMap((scheme) =>
  Array.from({ length: randomInt(rand, 15, 60) }, () => ({
    id: uuid(rand),
    pensionSchemeId: scheme.id,
    memberId: uuid(rand),
    joinedDate: "2025-10-01",
  })),
);

export const contributions: ContributionRow[] = pensionSchemes.map((scheme) => ({
  id: uuid(rand),
  pensionSchemeId: scheme.id,
  amount: randomFloat(rand, 500_000, 12_000_000),
  period: "2026-06",
}));

export const withdrawals: WithdrawalRow[] = pensionSchemes
  .filter(() => rand() < 0.6)
  .map((scheme) => ({
    id: uuid(rand),
    pensionSchemeId: scheme.id,
    amount: randomFloat(rand, 0, 3_000_000),
    period: "2026-06",
  }));

export const trustAccounts: TrustAccountRow[] = Array.from({ length: 58 }, () => ({
  id: uuid(rand),
  subsidiaryId: "cpf_financial_services",
  trustAssetValue: randomFloat(rand, 20_000_000, 400_000_000),
  status: "active",
  openedDate: "2025-10-01",
}));

export const trustBeneficiaries: TrustBeneficiaryRow[] = trustAccounts.flatMap((trust) =>
  Array.from({ length: randomInt(rand, 20, 100) }, () => ({
    id: uuid(rand),
    trustAccountId: trust.id,
    beneficiaryId: uuid(rand),
    addedDate: "2025-10-01",
  })),
);

export const agencyMandates: AgencyMandateRow[] = Array.from({ length: 24 }, () => ({
  id: uuid(rand),
  subsidiaryId: "cpf_financial_services",
  principalId: uuid(rand),
  startedDate: "2025-10-01",
}));

export const agencyTransactions: AgencyTransactionRow[] = agencyMandates.flatMap((mandate) =>
  Array.from({ length: randomInt(rand, 80, 200) }, () => ({
    id: uuid(rand),
    agencyMandateId: mandate.id,
    amount: randomFloat(rand, 1_000, 150_000),
    createdAt: "2026-06-10",
  })),
);

export const feeLedger: FeeLedgerRow[] = Array.from({ length: 120 }, () => ({
  id: uuid(rand),
  subsidiaryId: "cpf_financial_services",
  source: "agency",
  feeAmount: randomFloat(rand, 10_000, 800_000),
  period: "2026-06",
}));
