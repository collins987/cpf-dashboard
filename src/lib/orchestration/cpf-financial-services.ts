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
import { formatKes, formatKesExact, formatNumber, formatPercent } from "@/lib/format";
import { syntheticTrend } from "./trend";
import { buildMonthlyTrend, buildKpiPeriodDeltas } from "./monthly-trend";
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

  // contribution.period is "YYYY-MM"; Date("YYYY-MM") parses as the 1st of
  // that month, so the existing period field doubles as a real date source
  // without a schema change. Multi-month data requires seed.py to generate
  // more than the single "2026-06" period — see data/seed.py.
  const fundBalanceTrend = buildMonthlyTrend(
    contributions,
    (c) => c.period,
    (c) => c.amount,
    formatKes,
  );
  const agencyTrend = buildMonthlyTrend(
    agencyTransactions,
    (t) => t.createdAt,
    (t) => t.amount,
    formatKes,
  );
  const agencyDeltas = buildKpiPeriodDeltas(
    agencyTransactions,
    (t) => t.createdAt,
    (t) => t.amount,
  );

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
            exactValue: formatKesExact(memberContributions),
            deltaLabel: "▲ 4.0% QoQ",
            deltaDirection: "up",
          },
          {
            label: "Fund Balance",
            value: formatKes(fundBalance),
            exactValue: formatKesExact(fundBalance),
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
          label: "Fund Balance Trend (KES B)",
          color: "cpffs",
          points: fundBalanceTrend.points,
          monthLabels: fundBalanceTrend.monthLabels,
          latestValueLabel: formatKes(fundBalance),
          byPeriod: {
            MoM: {
              titlePrefix: fundBalanceTrend.byPeriod.MoM.titlePrefix,
              latestValueLabel: formatKes(fundBalance),
            },
            QoQ: {
              titlePrefix: fundBalanceTrend.byPeriod.QoQ.titlePrefix,
              latestValueLabel: formatKes(fundBalance),
            },
            YTD: {
              titlePrefix: fundBalanceTrend.byPeriod.YTD.titlePrefix,
              latestValueLabel: formatKes(fundBalance),
            },
          },
        },
      },
      {
        title: "Trust Fund Administration",
        kpis: [
          {
            label: "Assets Under Administration",
            value: formatKes(aua),
            exactValue: formatKesExact(aua),
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
          label: "Assets Under Administration Trend (KES B)",
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
            exactValue: formatKesExact(agencyValue),
            deltaLabel: "▲ 6.0% QoQ",
            deltaDirection: "up",
            byPeriodDelta: agencyDeltas,
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
            exactValue: formatKesExact(agencyFeeIncome),
            deltaLabel: "▲ 5.3% QoQ",
            deltaDirection: "up",
          },
        ],
        trend: {
          label: "Agency Transaction Value Trend (KES M)",
          color: "cpffs",
          points: agencyTrend.points,
          monthLabels: agencyTrend.monthLabels,
          latestValueLabel: formatKes(agencyValue),
          byPeriod: {
            MoM: {
              titlePrefix: agencyTrend.byPeriod.MoM.titlePrefix,
              latestValueLabel: agencyTrend.byPeriod.MoM.latestValueLabel,
            },
            QoQ: {
              titlePrefix: agencyTrend.byPeriod.QoQ.titlePrefix,
              latestValueLabel: agencyTrend.byPeriod.QoQ.latestValueLabel,
            },
            YTD: {
              titlePrefix: agencyTrend.byPeriod.YTD.titlePrefix,
              latestValueLabel: agencyTrend.byPeriod.YTD.latestValueLabel,
            },
          },
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
