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
import {
  getPensionSchemes,
  getSchemeMembers,
  getContributions,
  getWithdrawals,
  getTrustAccounts,
  getTrustBeneficiaries,
  getAgencyMandates,
  getAgencyTransactions,
  getFeeLedger,
} from "@/lib/data/cpf-financial-services-queries";
import { formatKes, formatNumber, formatPercent } from "@/lib/format";
import { syntheticTrend } from "./trend";
import type { SubsidiaryView, SubsidiaryTotals } from "./view-models";

const OPENING_BALANCE = 17_900_000_000;
const INVESTMENT_RETURNS = 420_000_000;
const PRIOR_PERIOD_AUA = 8_950_000_000;

export async function getCpfFinancialServicesView(): Promise<{
  view: SubsidiaryView;
  totals: SubsidiaryTotals;
}> {
  const [pensionSchemes, trustAccounts, agencyMandates, feeLedger] = await Promise.all([
    getPensionSchemes(),
    getTrustAccounts(),
    getAgencyMandates(),
    getFeeLedger(),
  ]);

  const schemeIds = pensionSchemes.map((s) => s.id);
  const trustIds = trustAccounts.map((t) => t.id);
  const mandateIds = agencyMandates.map((m) => m.id);

  const [schemeMembers, contributions, withdrawals, trustBeneficiaries, agencyTransactions] =
    await Promise.all([
      getSchemeMembers(schemeIds),
      getContributions(schemeIds),
      getWithdrawals(schemeIds),
      getTrustBeneficiaries(trustIds),
      getAgencyTransactions(mandateIds),
    ]);

  const memberContributions = calculateMemberContributions(contributions);
  const fundBalance = calculateFundBalance(
    OPENING_BALANCE,
    contributions,
    withdrawals,
    INVESTMENT_RETURNS,
  );
  const activeSchemes = calculateActiveSchemes(pensionSchemes);
  const members = calculateMembers(schemeMembers);

  const aua = calculateAssetsUnderAdministration(trustAccounts);
  const numberOfTrusts = calculateNumberOfTrusts(trustAccounts);
  const trustBeneficiaryCount = calculateTrustBeneficiaries(trustBeneficiaries);
  const trustFundGrowth = calculateTrustFundGrowth(aua, PRIOR_PERIOD_AUA);

  const agencyValue = calculateAgencyTransactionValue(agencyTransactions);
  const agencyVolume = calculateAgencyTransactionVolume(agencyTransactions);
  const principalsServed = calculatePrincipalsServed(agencyMandates);
  const agencyFeeIncome = calculateAgencyFeeIncome(feeLedger);

  const view: SubsidiaryView = {
    tag: "Pensions, Trust & Agency",
    subtitle: "Pension fund administration, trust fund administration and agency services.",
    pillars: [
      {
        title: "Pension Fund Administration",
        kpis: [
          {
            label: "Member Contributions (period)",
            value: formatKes(memberContributions),
            deltaLabel: "▲ 4.0% QoQ",
            deltaDirection: "up",
          },
          {
            label: "Fund Balance",
            value: formatKes(fundBalance),
            deltaLabel: "▲ 3.4% QoQ",
            deltaDirection: "up",
          },
          {
            label: "Active Schemes",
            value: formatNumber(activeSchemes),
            deltaLabel: "▲ 3 QoQ",
            deltaDirection: "up",
          },
          {
            label: "Members",
            value: formatNumber(members),
            deltaLabel: "▲ 2.1% QoQ",
            deltaDirection: "up",
          },
        ],
        trend: {
          label: "Fund Balance Trend (KES Bn)",
          color: "cpffs",
          points: syntheticTrend(21),
          monthLabels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
          latestValueLabel: formatKes(fundBalance),
        },
      },
      {
        title: "Trust Fund Administration",
        kpis: [
          {
            label: "Assets Under Administration",
            value: formatKes(aua),
            deltaLabel: "▲ 2.8% QoQ",
            deltaDirection: "up",
          },
          {
            label: "Number of Trusts",
            value: formatNumber(numberOfTrusts),
            deltaLabel: "▲ 2 QoQ",
            deltaDirection: "up",
          },
          {
            label: "Trust Beneficiaries",
            value: formatNumber(trustBeneficiaryCount),
            deltaLabel: "▲ 3.1% QoQ",
            deltaDirection: "up",
          },
          {
            label: "Trust Fund Growth",
            value: formatPercent(trustFundGrowth),
            deltaLabel: "▲ QoQ",
            deltaDirection: "up",
          },
        ],
        trend: {
          label: "Assets Under Administration Trend (KES Bn)",
          color: "cpffs",
          points: syntheticTrend(22),
          monthLabels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
          latestValueLabel: formatKes(aua),
        },
      },
      {
        title: "Agency Services",
        kpis: [
          {
            label: "Agency Transaction Value",
            value: formatKes(agencyValue),
            deltaLabel: "▲ 6.0% QoQ",
            deltaDirection: "up",
          },
          {
            label: "Agency Transaction Volume",
            value: `${formatNumber(agencyVolume)} txns`,
            deltaLabel: "▲ 4.8% QoQ",
            deltaDirection: "up",
          },
          {
            label: "Principals Served",
            value: formatNumber(principalsServed),
            deltaLabel: "▲ 1 QoQ",
            deltaDirection: "up",
          },
          {
            label: "Agency Fee Income",
            value: formatKes(agencyFeeIncome),
            deltaLabel: "▲ 5.3% QoQ",
            deltaDirection: "up",
          },
        ],
        trend: {
          label: "Agency Transaction Value Trend (KES M)",
          color: "cpffs",
          points: syntheticTrend(23),
          monthLabels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
          latestValueLabel: formatKes(agencyValue),
        },
      },
    ],
  };

  const totals: SubsidiaryTotals = {
    headlineAum: aua + fundBalance,
    activeClients: members,
    transactionValue: memberContributions + agencyValue,
  };

  return { view, totals };
}
