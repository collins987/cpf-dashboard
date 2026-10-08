import type {
  ReitHoldingRow,
  ReitNavHistoryRow,
  ReitDistributionRow,
  DealRow,
  IssuanceRow,
} from "@/types/database";
import { seededRandom, uuid, randomFloat } from "./random";

const rand = seededRandom(3003);

export const reitHoldings: ReitHoldingRow[] = Array.from({ length: 300 }, () => ({
  id: uuid(rand),
  subsidiaryId: "cpf_capital_advisory",
  holderId: uuid(rand),
  unitBalance: randomFloat(rand, 50, 20_000),
  acquiredDate: "2025-10-01",
}));

export const reitNavHistory: ReitNavHistoryRow[] = [
  { id: uuid(rand), subsidiaryId: "cpf_capital_advisory", period: "2026-01", navPerUnit: 20.1 },
  { id: uuid(rand), subsidiaryId: "cpf_capital_advisory", period: "2026-02", navPerUnit: 20.35 },
  { id: uuid(rand), subsidiaryId: "cpf_capital_advisory", period: "2026-03", navPerUnit: 20.7 },
  { id: uuid(rand), subsidiaryId: "cpf_capital_advisory", period: "2026-04", navPerUnit: 21.05 },
  { id: uuid(rand), subsidiaryId: "cpf_capital_advisory", period: "2026-05", navPerUnit: 21.4 },
  { id: uuid(rand), subsidiaryId: "cpf_capital_advisory", period: "2026-06", navPerUnit: 21.85 },
];

export const reitDistributions: ReitDistributionRow[] = [
  {
    id: uuid(rand),
    subsidiaryId: "cpf_capital_advisory",
    period: "2026-06",
    distributionPerUnit: 2.14,
    unitPrice: 21.85,
  },
];

export const deals: DealRow[] = Array.from({ length: 7 }, () => {
  const dealValue = randomFloat(rand, 800_000_000, 4_200_000_000);
  return {
    id: uuid(rand),
    subsidiaryId: "cpf_capital_advisory",
    dealType: "structured_finance",
    dealValue,
    advisoryFee: dealValue * randomFloat(rand, 0.015, 0.03),
    closeDate: "2026-05-15",
  };
});

export const issuances: IssuanceRow[] = [
  {
    id: uuid(rand),
    subsidiaryId: "cpf_capital_advisory",
    instrumentType: "sukuk",
    instrumentCode: "LNZ-SK-01",
    issuanceValue: 2_100_000_000,
    profitRate: 0.109,
    amountOffered: 2_190_000_000,
    amountSubscribed: 2_100_000_000 * 0.96,
    issueDate: "2026-02-01",
  },
  {
    id: uuid(rand),
    subsidiaryId: "cpf_capital_advisory",
    instrumentType: "sukuk",
    instrumentCode: "LNZ-SK-02",
    issuanceValue: 2_300_000_000,
    profitRate: 0.1125,
    amountOffered: 2_300_000_000,
    amountSubscribed: 2_300_000_000 * 1.04,
    issueDate: "2026-04-01",
  },
  {
    id: uuid(rand),
    subsidiaryId: "cpf_capital_advisory",
    instrumentType: "sukuk",
    instrumentCode: "LNZ-SK-KDF",
    issuanceValue: 2_400_000_000,
    profitRate: 0.115,
    amountOffered: 2_400_000_000,
    amountSubscribed: 2_400_000_000 * 1.18,
    issueDate: "2026-06-01",
  },
];
