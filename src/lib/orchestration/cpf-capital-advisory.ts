import {
  calculateReitAum,
  calculateUnitHolders,
  getLatestUnitNav,
  calculateDistributionYield,
  calculateDealCountYtd,
  calculateDealValueYtd,
  calculateAverageDealSize,
  calculateAdvisoryFeeIncome,
  calculateIssuanceCountYtd,
  calculateIssuanceValueYtd,
  calculateWeightedAvgProfitRate,
  calculateSubscriptionRate,
} from "@/lib/calculations/cpf-capital-advisory";
import {
  getReitHoldings,
  getReitNavHistory,
  getReitDistributions,
  getDealsYtd,
  getIssuancesYtd,
} from "@/lib/data/cpf-capital-advisory-queries";
import { formatKes, formatKesExact, formatNumber, formatPercent } from "@/lib/format";
import { buildMonthlyTrend, formatPeriodDelta } from "./monthly-trend";
import { getPeriodWindow, periodDeltaPct, asOfWindow, inWindow } from "@/lib/calculations/period";
import type { Period } from "@/lib/calculations/period";
import type { SubsidiaryView, SubsidiaryTotals, BulletRow } from "./view-models";

const YEAR_START = new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0];

function buildCpfcaViewForPeriod(
  reitHoldings: Awaited<ReturnType<typeof getReitHoldings>>,
  reitNavHistory: Awaited<ReturnType<typeof getReitNavHistory>>,
  reitDistributions: Awaited<ReturnType<typeof getReitDistributions>>,
  deals: Awaited<ReturnType<typeof getDealsYtd>>,
  issuances: Awaited<ReturnType<typeof getIssuancesYtd>>,
  navTrend: ReturnType<typeof buildMonthlyTrend>,
  dealTrend: ReturnType<typeof buildMonthlyTrend>,
  period: Period,
  now: Date,
): { view: SubsidiaryView; totals: SubsidiaryTotals } {
  const w = getPeriodWindow(period, now);

  // Stock metrics: as-of window end
  const holdingsAsOf = asOfWindow(reitHoldings, (h) => h.acquiredDate, w.end);
  const holdingsAsOfPrior = asOfWindow(reitHoldings, (h) => h.acquiredDate, w.priorEnd);

  // Flow metrics: in-window
  const dealsPeriod = inWindow(deals, (d) => d.closeDate, w.start, w.end);
  const dealsPrior = inWindow(deals, (d) => d.closeDate, w.priorStart, w.priorEnd);
  const issuancesPeriod = inWindow(issuances, (i) => i.issueDate, w.start, w.end);
  const issuancesPrior = inWindow(issuances, (i) => i.issueDate, w.priorStart, w.priorEnd);

  // KPI values
  const latestNav = getLatestUnitNav(reitNavHistory) ?? 0;
  const reitAum = calculateReitAum(holdingsAsOf, latestNav);
  const reitAumPrior = calculateReitAum(holdingsAsOfPrior, latestNav);
  const unitHolders = calculateUnitHolders(holdingsAsOf);
  const unitHoldersPrior = calculateUnitHolders(holdingsAsOfPrior);
  const distributionYield = reitDistributions[0]
    ? calculateDistributionYield(reitDistributions[0])
    : null;

  const dealCount = calculateDealCountYtd(dealsPeriod);
  const dealCountPrior = calculateDealCountYtd(dealsPrior);
  const dealValue = calculateDealValueYtd(dealsPeriod);
  const dealValuePrior = calculateDealValueYtd(dealsPrior);
  const averageDealSize = calculateAverageDealSize(dealValue, dealCount);
  const advisoryFeeIncome = calculateAdvisoryFeeIncome(dealsPeriod);

  const issuanceCount = calculateIssuanceCountYtd(issuancesPeriod);
  const issuanceCountPrior = calculateIssuanceCountYtd(issuancesPrior);
  const issuanceValue = calculateIssuanceValueYtd(issuancesPeriod);
  const issuanceValuePrior = calculateIssuanceValueYtd(issuancesPrior);
  const weightedAvgProfitRate = calculateWeightedAvgProfitRate(issuancesPeriod);
  const latestIssuance =
    issuancesPeriod[issuancesPeriod.length - 1] ?? issuances[issuances.length - 1];
  const latestSubscriptionRate = latestIssuance ? calculateSubscriptionRate(latestIssuance) : null;

  // Deltas
  const reitAumDelta = formatPeriodDelta(periodDeltaPct(reitAum, reitAumPrior), period);
  const unitHoldersDelta = formatPeriodDelta(periodDeltaPct(unitHolders, unitHoldersPrior), period);
  const dealCountDelta = formatPeriodDelta(periodDeltaPct(dealCount, dealCountPrior), period);
  const dealValueDelta = formatPeriodDelta(periodDeltaPct(dealValue, dealValuePrior), period);
  const issuanceCountDelta = formatPeriodDelta(
    periodDeltaPct(issuanceCount, issuanceCountPrior),
    period,
  );
  const issuanceValueDelta = formatPeriodDelta(
    periodDeltaPct(issuanceValue, issuanceValuePrior),
    period,
  );

  const navPeriodData = navTrend.byPeriod[period];
  const { points: navPoints, monthLabels: navMonthLabels } = navPeriodData;
  const dealPeriodData = dealTrend.byPeriod[period];
  const { points: dealPoints, monthLabels: dealMonthLabels } = dealPeriodData;

  const SCALE_MAX = 1.3;
  const bullets: BulletRow[] = issuances.map((issuance) => {
    const rate = calculateSubscriptionRate(issuance) ?? 0;
    return {
      name: issuance.instrumentCode.startsWith("LNZ-SK-KDF")
        ? "Linzi Sukuk KDF Housing"
        : `Linzi Sukuk ${issuance.instrumentCode.slice(-2)}`,
      code: issuance.instrumentCode,
      percentOfTarget: Math.min((rate / SCALE_MAX) * 100, 100),
      valueLabel: formatPercent(rate, 0),
      onTarget: rate >= 1,
    };
  });

  const view: SubsidiaryView = {
    tag: "Capital Markets & Alternative Investments",
    subtitle:
      "Alternative investments and capital markets advisory, from REITs to structured and debt finance.",
    pillars: [
      {
        title: "Alternative Investments (REITs)",
        kpis: [
          {
            label: "AUM in REIT Vehicles",
            value: formatKes(reitAum),
            exactValue: formatKesExact(reitAum),
            deltaLabel: reitAumDelta.deltaLabel,
            deltaDirection: reitAumDelta.deltaDirection,
          },
          {
            label: "Unit Holders",
            value: formatNumber(unitHolders),
            deltaLabel: unitHoldersDelta.deltaLabel,
            deltaDirection: unitHoldersDelta.deltaDirection,
          },
          {
            label: "Unit NAV",
            value: `KES ${latestNav.toFixed(2)}`,
            deltaLabel: w.label,
            deltaDirection: "flat",
          },
          {
            label: "Distribution Yield (Annualized)",
            value: formatPercent(distributionYield),
            deltaLabel: w.label,
            deltaDirection: "flat",
          },
        ],
        trend: {
          label: `${w.label} Unit NAV (KES)`,
          color: "cpfca",
          points: navPoints,
          monthLabels: navMonthLabels,
          latestValueLabel: navPeriodData.latestValueLabel,
        },
      },
      {
        title: "Structured & Project Finance Advisory",
        kpis: [
          {
            label: "Deal Count (YTD)",
            value: formatNumber(dealCount),
            deltaLabel: dealCountDelta.deltaLabel,
            deltaDirection: dealCountDelta.deltaDirection,
          },
          {
            label: "Deal Value (YTD)",
            value: formatKes(dealValue),
            exactValue: formatKesExact(dealValue),
            deltaLabel: dealValueDelta.deltaLabel,
            deltaDirection: dealValueDelta.deltaDirection,
            note: "Incl. Talanta Stadium-type structured deals",
          },
          {
            label: "Average Deal Size",
            value: averageDealSize === null ? "N/A" : formatKes(averageDealSize),
            exactValue: averageDealSize === null ? undefined : formatKesExact(averageDealSize),
            deltaLabel: w.label,
            deltaDirection: "flat",
          },
          {
            label: "Advisory Fee Income",
            value: formatKes(advisoryFeeIncome),
            exactValue: formatKesExact(advisoryFeeIncome),
            deltaLabel: w.label,
            deltaDirection: "flat",
          },
        ],
        trend: {
          label: `${w.label} Deal Value (KES B)`,
          color: "cpfca",
          points: dealPoints,
          monthLabels: dealMonthLabels,
          latestValueLabel: dealPeriodData.latestValueLabel,
        },
      },
      {
        title: "Debt Capital Markets (Sukuk/Bonds)",
        kpis: [
          {
            label: "Issuance Count (YTD)",
            value: formatNumber(issuanceCount),
            deltaLabel: issuanceCountDelta.deltaLabel,
            deltaDirection: issuanceCountDelta.deltaDirection,
          },
          {
            label: "Issuance Value (YTD)",
            value: formatKes(issuanceValue),
            exactValue: formatKesExact(issuanceValue),
            deltaLabel: issuanceValueDelta.deltaLabel,
            deltaDirection: issuanceValueDelta.deltaDirection,
            note: "Incl. Linzi Sukuk KDF Housing",
          },
          {
            label: "Weighted Avg. Profit Rate",
            value: formatPercent(weightedAvgProfitRate, 2),
            deltaLabel: w.label,
            deltaDirection: "flat",
          },
          {
            label: "Subscription Rate",
            value: formatPercent(latestSubscriptionRate, 0),
            deltaLabel: (latestSubscriptionRate ?? 0) >= 1 ? "Oversubscribed" : "Below target",
            deltaDirection: (latestSubscriptionRate ?? 0) >= 1 ? "up" : "down",
          },
        ],
        bullets,
      },
    ],
  };

  const totals: SubsidiaryTotals = {
    headlineAum: reitAum + dealValue + issuanceValue,
    activeClients: unitHolders,
    transactionValue: dealValue + issuanceValue,
  };

  return { view, totals };
}

export async function getCpfCapitalAdvisoryView(): Promise<{
  views: Record<Period, SubsidiaryView>;
  totals: Record<Period, SubsidiaryTotals>;
}> {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0];
  const [reitHoldings, reitNavHistory, reitDistributions, deals, issuances] = await Promise.all([
    getReitHoldings(),
    getReitNavHistory(),
    getReitDistributions(),
    getDealsYtd(yearStart),
    getIssuancesYtd(yearStart),
  ]);

  const navTrend = buildMonthlyTrend(
    reitNavHistory,
    (n) => n.period,
    (n) => n.navPerUnit,
    (n) => n.toFixed(2),
    now,
  );
  const dealTrend = buildMonthlyTrend(
    deals,
    (d) => d.closeDate,
    (d) => d.dealValue,
    formatKes,
    now,
  );

  const views = {} as Record<Period, SubsidiaryView>;
  const totals = {} as Record<Period, SubsidiaryTotals>;
  for (const period of ["MoM", "QoQ", "YTD"] as Period[]) {
    const result = buildCpfcaViewForPeriod(
      reitHoldings,
      reitNavHistory,
      reitDistributions,
      deals,
      issuances,
      navTrend,
      dealTrend,
      period,
      now,
    );
    views[period] = result.view;
    totals[period] = result.totals;
  }

  return { views, totals };
}

// Keep unused export to satisfy any old imports during transition
export { YEAR_START as _YEAR_START };
