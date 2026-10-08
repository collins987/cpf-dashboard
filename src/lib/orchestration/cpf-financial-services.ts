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
import { buildMonthlyTrend, formatPeriodDelta } from "./monthly-trend";
import { getPeriodWindow, periodDeltaPct, asOfWindow, inWindow } from "@/lib/calculations/period";
import type { Period } from "@/lib/calculations/period";
import type { SubsidiaryView, SubsidiaryTotals } from "./view-models";

const OPENING_BALANCE = 17_900_000_000;
const INVESTMENT_RETURNS = 420_000_000;
const PRIOR_PERIOD_AUA = 8_950_000_000;

function buildCpffsViewForPeriod(
  pensionSchemes: Awaited<ReturnType<typeof getPensionSchemes>>,
  schemeMembers: Awaited<ReturnType<typeof getSchemeMembers>>,
  contributions: Awaited<ReturnType<typeof getContributions>>,
  withdrawals: Awaited<ReturnType<typeof getWithdrawals>>,
  trustAccounts: Awaited<ReturnType<typeof getTrustAccounts>>,
  trustBeneficiaries: Awaited<ReturnType<typeof getTrustBeneficiaries>>,
  agencyMandates: Awaited<ReturnType<typeof getAgencyMandates>>,
  agencyTransactions: Awaited<ReturnType<typeof getAgencyTransactions>>,
  feeLedger: Awaited<ReturnType<typeof getFeeLedger>>,
  agencyTrend: ReturnType<typeof buildMonthlyTrend>,
  fundBalanceTrend: ReturnType<typeof buildMonthlyTrend>,
  period: Period,
  now: Date,
): { view: SubsidiaryView; totals: SubsidiaryTotals } {
  const w = getPeriodWindow(period, now);

  // Stock metrics: as-of window end
  const schemesAsOf = asOfWindow(pensionSchemes, (s) => s.openedDate, w.end);
  const schemesAsOfPrior = asOfWindow(pensionSchemes, (s) => s.openedDate, w.priorEnd);
  const membersAsOf = asOfWindow(schemeMembers, (m) => m.joinedDate, w.end);
  const membersAsOfPrior = asOfWindow(schemeMembers, (m) => m.joinedDate, w.priorEnd);
  const trustsAsOf = asOfWindow(trustAccounts, (t) => t.openedDate, w.end);
  const trustsAsOfPrior = asOfWindow(trustAccounts, (t) => t.openedDate, w.priorEnd);
  const beneficiariesAsOf = asOfWindow(trustBeneficiaries, (b) => b.addedDate, w.end);
  const beneficiariesAsOfPrior = asOfWindow(trustBeneficiaries, (b) => b.addedDate, w.priorEnd);
  const mandatesAsOf = asOfWindow(agencyMandates, (m) => m.startedDate, w.end);

  // Flow metrics: in-window
  const contribPeriod = inWindow(contributions, (c) => c.period, w.start, w.end);
  const contribPrior = inWindow(contributions, (c) => c.period, w.priorStart, w.priorEnd);
  const withdrawalsPeriod = inWindow(withdrawals, (ww) => ww.period, w.start, w.end);
  const agencyTxnPeriod = inWindow(agencyTransactions, (t) => t.createdAt, w.start, w.end);
  const agencyTxnPrior = inWindow(agencyTransactions, (t) => t.createdAt, w.priorStart, w.priorEnd);

  // KPI values
  const memberContributions = calculateMemberContributions(contribPeriod);
  const memberContributionsPrior = calculateMemberContributions(contribPrior);
  const fundBalance = calculateFundBalance(
    OPENING_BALANCE,
    contribPeriod,
    withdrawalsPeriod,
    INVESTMENT_RETURNS,
  );
  const fundBalancePrior = calculateFundBalance(
    OPENING_BALANCE,
    contribPrior,
    inWindow(withdrawals, (ww) => ww.period, w.priorStart, w.priorEnd),
    INVESTMENT_RETURNS,
  );
  const activeSchemes = calculateActiveSchemes(schemesAsOf);
  const activeSchemesPrior = calculateActiveSchemes(schemesAsOfPrior);
  const members = calculateMembers(membersAsOf);
  const membersPrior = calculateMembers(membersAsOfPrior);

  const aua = calculateAssetsUnderAdministration(trustsAsOf);
  const auaPrior = calculateAssetsUnderAdministration(trustsAsOfPrior);
  const numberOfTrusts = calculateNumberOfTrusts(trustsAsOf);
  const numberOfTrustsPrior = calculateNumberOfTrusts(trustsAsOfPrior);
  const trustBeneficiaryCount = calculateTrustBeneficiaries(beneficiariesAsOf);
  const trustBeneficiaryCountPrior = calculateTrustBeneficiaries(beneficiariesAsOfPrior);
  const trustFundGrowth = calculateTrustFundGrowth(aua, PRIOR_PERIOD_AUA);

  const agencyValue = calculateAgencyTransactionValue(agencyTxnPeriod);
  const agencyValuePrior = calculateAgencyTransactionValue(agencyTxnPrior);
  const agencyVolume = calculateAgencyTransactionVolume(agencyTxnPeriod);
  const principalsServed = calculatePrincipalsServed(mandatesAsOf);
  const agencyFeeIncome = calculateAgencyFeeIncome(feeLedger);

  // Deltas
  const contribDelta = formatPeriodDelta(
    periodDeltaPct(memberContributions, memberContributionsPrior),
    period,
  );
  const fundBalanceDelta = formatPeriodDelta(periodDeltaPct(fundBalance, fundBalancePrior), period);
  const schemesDelta = formatPeriodDelta(periodDeltaPct(activeSchemes, activeSchemesPrior), period);
  const membersDelta = formatPeriodDelta(periodDeltaPct(members, membersPrior), period);
  const auaDelta = formatPeriodDelta(periodDeltaPct(aua, auaPrior), period);
  const trustsDelta = formatPeriodDelta(
    periodDeltaPct(numberOfTrusts, numberOfTrustsPrior),
    period,
  );
  const beneficiariesDelta = formatPeriodDelta(
    periodDeltaPct(trustBeneficiaryCount, trustBeneficiaryCountPrior),
    period,
  );
  const agencyValueDelta = formatPeriodDelta(periodDeltaPct(agencyValue, agencyValuePrior), period);

  const agencyPeriodData = agencyTrend.byPeriod[period];
  const {
    points: agencyPoints,
    monthLabels: agencyMonthLabels,
    yAxisLabels: agencyYAxis,
  } = agencyPeriodData;
  const fundBalancePeriodData = fundBalanceTrend.byPeriod[period];
  const {
    points: fundPoints,
    monthLabels: fundMonthLabels,
    yAxisLabels: fundYAxis,
  } = fundBalancePeriodData;

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
            deltaLabel: contribDelta.deltaLabel,
            deltaDirection: contribDelta.deltaDirection,
          },
          {
            label: "Fund Balance",
            value: formatKes(fundBalance),
            exactValue: formatKesExact(fundBalance),
            deltaLabel: fundBalanceDelta.deltaLabel,
            deltaDirection: fundBalanceDelta.deltaDirection,
          },
          {
            label: "Active Schemes",
            value: formatNumber(activeSchemes),
            deltaLabel: schemesDelta.deltaLabel,
            deltaDirection: schemesDelta.deltaDirection,
          },
          {
            label: "Members",
            value: formatNumber(members),
            deltaLabel: membersDelta.deltaLabel,
            deltaDirection: membersDelta.deltaDirection,
          },
        ],
        trend: {
          label: `${w.label} Fund Balance Trend (KES B)`,
          color: "cpffs",
          points: fundPoints,
          monthLabels: fundMonthLabels,
          latestValueLabel: fundBalancePeriodData.latestValueLabel,
          yAxisLabels: fundYAxis,
        },
      },
      {
        title: "Trust Fund Administration",
        kpis: [
          {
            label: "Assets Under Administration",
            value: formatKes(aua),
            exactValue: formatKesExact(aua),
            deltaLabel: auaDelta.deltaLabel,
            deltaDirection: auaDelta.deltaDirection,
          },
          {
            label: "Number of Trusts",
            value: formatNumber(numberOfTrusts),
            deltaLabel: trustsDelta.deltaLabel,
            deltaDirection: trustsDelta.deltaDirection,
          },
          {
            label: "Trust Beneficiaries",
            value: formatNumber(trustBeneficiaryCount),
            deltaLabel: beneficiariesDelta.deltaLabel,
            deltaDirection: beneficiariesDelta.deltaDirection,
          },
          {
            label: "Trust Fund Growth",
            value: formatPercent(trustFundGrowth),
            deltaLabel: w.label,
            deltaDirection: "flat",
          },
        ],
        trend: {
          label: `${w.label} AUA Trend (KES B)`,
          color: "cpffs",
          points: fundPoints,
          monthLabels: fundMonthLabels,
          latestValueLabel: formatKes(aua),
          yAxisLabels: fundYAxis,
        },
      },
      {
        title: "Agency Services",
        kpis: [
          {
            label: "Agency Transaction Value",
            value: formatKes(agencyValue),
            exactValue: formatKesExact(agencyValue),
            deltaLabel: agencyValueDelta.deltaLabel,
            deltaDirection: agencyValueDelta.deltaDirection,
          },
          {
            label: "Agency Transaction Volume",
            value: `${formatNumber(agencyVolume)} txns`,
            deltaLabel: w.label,
            deltaDirection: "flat",
          },
          {
            label: "Principals Served",
            value: formatNumber(principalsServed),
            deltaLabel: w.label,
            deltaDirection: "flat",
          },
          {
            label: "Agency Fee Income",
            value: formatKes(agencyFeeIncome),
            exactValue: formatKesExact(agencyFeeIncome),
            deltaLabel: w.label,
            deltaDirection: "flat",
          },
        ],
        trend: {
          label: `${w.label} Agency Transaction Value (KES M)`,
          color: "cpffs",
          points: agencyPoints,
          monthLabels: agencyMonthLabels,
          latestValueLabel: agencyPeriodData.latestValueLabel,
          yAxisLabels: agencyYAxis,
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

export async function getCpfFinancialServicesView(): Promise<{
  views: Record<Period, SubsidiaryView>;
  totals: Record<Period, SubsidiaryTotals>;
}> {
  const now = new Date();
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

  const agencyTrend = buildMonthlyTrend(
    agencyTransactions,
    (t) => t.createdAt,
    (t) => t.amount,
    formatKes,
    now,
  );
  const fundBalanceTrend = buildMonthlyTrend(
    contributions,
    (c) => c.period,
    (c) => c.amount,
    formatKes,
    now,
  );

  const views = {} as Record<Period, SubsidiaryView>;
  const totals = {} as Record<Period, SubsidiaryTotals>;
  for (const period of ["MoM", "QoQ", "YTD"] as Period[]) {
    const result = buildCpffsViewForPeriod(
      pensionSchemes,
      schemeMembers,
      contributions,
      withdrawals,
      trustAccounts,
      trustBeneficiaries,
      agencyMandates,
      agencyTransactions,
      feeLedger,
      agencyTrend,
      fundBalanceTrend,
      period,
      now,
    );
    views[period] = result.view;
    totals[period] = result.totals;
  }

  return { views, totals };
}
