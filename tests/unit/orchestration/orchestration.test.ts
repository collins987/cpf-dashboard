import { describe, it, expect, vi, beforeEach } from "vitest";
import type {
  LoanAccountRow,
  RepaymentRow,
  WalletRow,
  TransactionRow,
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

// ---- Mock data-layer modules so no Supabase client is required ----

vi.mock("@/lib/data/rukisha-queries", () => {
  const loan: LoanAccountRow = {
    id: "L1",
    subsidiaryId: "rukisha",
    borrowerId: "B1",
    product: "personal",
    outstandingBalance: 500,
    daysOverdue: 0,
    status: "active",
  };
  const rep: RepaymentRow = {
    id: "R1",
    loanAccountId: "L1",
    amountDue: 100,
    amountPaid: 95,
    dueDate: "2026-06-01",
    paidDate: "2026-06-02",
  };
  const w: WalletRow = {
    id: "W1",
    subsidiaryId: "rukisha",
    status: "active",
    lastTransactionAt: "2026-06-10",
  };
  const t: TransactionRow = {
    id: "T1",
    subsidiaryId: "rukisha",
    walletId: "W1",
    type: "merchant_payment",
    amount: 200,
    createdAt: "2026-06-10",
  };
  const sg: SavingsAccountRow = {
    id: "S1",
    subsidiaryId: "rukisha",
    accountHolderId: "H1",
    savingsType: "goal_based",
    balance: 300,
  };
  const sp: SavingsAccountRow = { ...sg, id: "S2", savingsType: "pension_linked", balance: 400 };
  return {
    getLoanAccounts: vi.fn(async () => [loan]),
    getRepayments: vi.fn(async () => [rep]),
    getWallets: vi.fn(async () => [w]),
    getTransactions: vi.fn(async () => [t]),
    getSavingsAccounts: vi.fn(async () => [sg, sp]),
  };
});

vi.mock("@/lib/data/cpf-financial-services-queries", () => {
  const ps: PensionSchemeRow = {
    id: "PS1",
    subsidiaryId: "cpf_financial_services",
    status: "active",
  };
  const sm: SchemeMemberRow = { id: "SM1", pensionSchemeId: "PS1", memberId: "M1" };
  const c: ContributionRow = { id: "C1", pensionSchemeId: "PS1", amount: 1000, period: "2026-06" };
  const wd: WithdrawalRow = { id: "W1", pensionSchemeId: "PS1", amount: 100, period: "2026-06" };
  const tr: TrustAccountRow = {
    id: "T1",
    subsidiaryId: "cpf_financial_services",
    trustAssetValue: 5000,
    status: "active",
  };
  const tb: TrustBeneficiaryRow = { id: "TB1", trustAccountId: "T1", beneficiaryId: "P1" };
  const am: AgencyMandateRow = {
    id: "AM1",
    subsidiaryId: "cpf_financial_services",
    principalId: "P1",
  };
  const at: AgencyTransactionRow = {
    id: "AT1",
    agencyMandateId: "AM1",
    amount: 250,
    createdAt: "2026-06-15",
  };
  const fl: FeeLedgerRow = {
    id: "F1",
    subsidiaryId: "cpf_financial_services",
    source: "agency",
    feeAmount: 25,
    period: "2026-06",
  };
  return {
    getPensionSchemes: vi.fn(async () => [ps]),
    getSchemeMembers: vi.fn(async () => [sm]),
    getContributions: vi.fn(async () => [c]),
    getWithdrawals: vi.fn(async () => [wd]),
    getTrustAccounts: vi.fn(async () => [tr]),
    getTrustBeneficiaries: vi.fn(async () => [tb]),
    getAgencyMandates: vi.fn(async () => [am]),
    getAgencyTransactions: vi.fn(async () => [at]),
    getFeeLedger: vi.fn(async () => [fl]),
  };
});

vi.mock("@/lib/data/cpf-capital-advisory-queries", () => {
  const h: ReitHoldingRow = {
    id: "H1",
    subsidiaryId: "cpf_capital_advisory",
    holderId: "P1",
    unitBalance: 100,
  };
  const n: ReitNavHistoryRow = {
    id: "N1",
    subsidiaryId: "cpf_capital_advisory",
    period: "2026-06",
    navPerUnit: 25,
  };
  const d: ReitDistributionRow = {
    id: "D1",
    subsidiaryId: "cpf_capital_advisory",
    period: "2026-06",
    distributionPerUnit: 1.5,
    unitPrice: 25,
  };
  const deal: DealRow = {
    id: "DL1",
    subsidiaryId: "cpf_capital_advisory",
    dealType: "structured_finance",
    dealValue: 10_000_000,
    advisoryFee: 100_000,
    closeDate: "2026-03-01",
  };
  const iss: IssuanceRow = {
    id: "I1",
    subsidiaryId: "cpf_capital_advisory",
    instrumentType: "sukuk",
    instrumentCode: "LNZ-SK-01",
    issuanceValue: 5_000_000,
    profitRate: 0.1,
    amountOffered: 5_000_000,
    amountSubscribed: 5_900_000,
    issueDate: "2026-02-01",
  };
  return {
    getReitHoldings: vi.fn(async () => [h]),
    getReitNavHistory: vi.fn(async () => [n]),
    getReitDistributions: vi.fn(async () => [d]),
    getDealsYtd: vi.fn(async () => [deal]),
    getIssuancesYtd: vi.fn(async () => [iss]),
  };
});

vi.mock("@/lib/data/group-queries", () => {
  const row: PensionLinkSummaryRow = {
    id: "L1",
    period: "2026-06",
    linkedSaversPct: 0.1,
    linkedSaversCount: 42,
    aumDeployedPct: 0.2,
    returnsCreditedPct: 0.05,
  };
  return { getPensionLinkSummary: vi.fn(async () => [row]) };
});

// ---- Now import orchestration modules (after mocks) ----

import { getRukishaView } from "@/lib/orchestration/rukisha";
import { getCpfFinancialServicesView } from "@/lib/orchestration/cpf-financial-services";
import { getCpfCapitalAdvisoryView } from "@/lib/orchestration/cpf-capital-advisory";
import { getGroupView } from "@/lib/orchestration/group";

beforeEach(() => vi.clearAllMocks());

describe("Orchestration — shape smoke tests", () => {
  it("getRukishaView returns Digital Financial Services with 3 pillars × 4 KPIs", async () => {
    const { view, totals } = await getRukishaView();
    expect(view.tag).toBe("Digital Financial Services");
    expect(view.pillars).toHaveLength(3);
    for (const p of view.pillars) {
      expect(p.kpis).toHaveLength(4);
      for (const k of p.kpis) {
        expect(k.label.trim()).not.toBe("");
        expect(k.value.trim()).not.toBe("");
        expect(k.value).not.toMatch(/undefined|null|NaN/i);
        expect(["up", "down", "flat"]).toContain(k.deltaDirection);
      }
    }
    expect(totals.headlineAum).toBeGreaterThan(0);
    expect(totals.activeClients).toBeGreaterThan(0);
    expect(totals.transactionValue).toBeDefined();
  });

  it("getCpfFinancialServicesView returns Pensions, Trust & Agency with 3 pillars × 4 KPIs", async () => {
    const { view, totals } = await getCpfFinancialServicesView();
    expect(view.tag).toBe("Pensions, Trust & Agency");
    expect(view.pillars).toHaveLength(3);
    for (const p of view.pillars) expect(p.kpis).toHaveLength(4);
    expect(totals.headlineAum).toBeGreaterThan(0);
    expect(totals.activeClients).toBeGreaterThan(0);
  });

  it("getCpfCapitalAdvisoryView returns Capital Markets with 3 pillars × 4 KPIs + bullets", async () => {
    const { view, totals } = await getCpfCapitalAdvisoryView();
    expect(view.tag).toBe("Capital Markets & Alternative Investments");
    expect(view.pillars).toHaveLength(3);
    for (const p of view.pillars) expect(p.kpis).toHaveLength(4);
    const bulletsPillar = view.pillars[2];
    expect(bulletsPillar.bullets?.length).toBeGreaterThan(0);
    expect(totals.headlineAum).toBeGreaterThan(0);
    expect(totals.activeClients).toBeGreaterThan(0);
  });

  it("getGroupView builds snapshot(3), flow(3), scorecard(4 in documented order)", async () => {
    const rukisha = await getRukishaView();
    const cpffs = await getCpfFinancialServicesView();
    const cpfca = await getCpfCapitalAdvisoryView();
    const group = await getGroupView({
      rukisha: rukisha.totals,
      cpffs: cpffs.totals,
      cpfca: cpfca.totals,
    });

    expect(group.snapshot).toHaveLength(3);
    expect(group.flow).toHaveLength(3);
    expect(group.scorecard.map((s) => s.label)).toEqual([
      "Total Group AUM/AUA",
      "Total Active Clients",
      "Group Transaction/Deal Value",
      "Business Lines",
    ]);
    expect(group.scorecard[3].value).toBe("3");
    for (const s of group.scorecard) {
      expect(s.value.trim()).not.toBe("");
      expect(s.value).not.toMatch(/undefined|null|NaN/i);
    }
  });
});
