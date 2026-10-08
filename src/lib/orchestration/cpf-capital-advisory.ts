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
import { buildMonthlyTrend, buildKpiPeriodDeltas } from "./monthly-trend";
import type { SubsidiaryView, SubsidiaryTotals, BulletRow } from "./view-models";

const YEAR_START = "2026-01-01";

export async function getCpfCapitalAdvisoryView(): Promise<{
  view: SubsidiaryView;
  totals: SubsidiaryTotals;
}> {
  const [reitHoldings, reitNavHistory, reitDistributions, deals, issuances] = await Promise.all([
    getReitHoldings(),
    getReitNavHistory(),
    getReitDistributions(),
    getDealsYtd(YEAR_START),
    getIssuancesYtd(YEAR_START),
  ]);

  const latestNav = getLatestUnitNav(reitNavHistory) ?? 0;
  const reitAum = calculateReitAum(reitHoldings, latestNav);
  const unitHolders = calculateUnitHolders(reitHoldings);
  const distributionYield = reitDistributions[0]
    ? calculateDistributionYield(reitDistributions[0])
    : null;

  const dealCount = calculateDealCountYtd(deals);
  const dealValue = calculateDealValueYtd(deals);
  const averageDealSize = calculateAverageDealSize(dealValue, dealCount);
  const advisoryFeeIncome = calculateAdvisoryFeeIncome(deals);

  const issuanceCount = calculateIssuanceCountYtd(issuances);
  const issuanceValue = calculateIssuanceValueYtd(issuances);
  const weightedAvgProfitRate = calculateWeightedAvgProfitRate(issuances);
  const latestIssuance = issuances[issuances.length - 1];
  const latestSubscriptionRate = latestIssuance ? calculateSubscriptionRate(latestIssuance) : null;

  // reit_nav_history.period and deal.closeDate are both real dated fields —
  // Date("YYYY-MM") parses as the 1st of that month.
  const navTrend = buildMonthlyTrend(
    reitNavHistory,
    (n) => n.period,
    (n) => n.navPerUnit,
    (n) => n.toFixed(2),
  );
  const dealTrend = buildMonthlyTrend(
    deals,
    (d) => d.closeDate,
    (d) => d.dealValue,
    formatKes,
  );
  const dealDeltas = buildKpiPeriodDeltas(
    deals,
    (d) => d.closeDate,
    (d) => d.dealValue,
  );

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
            deltaLabel: "▲ 7.9% (6-mo)",
            deltaDirection: "up",
          },
          {
            label: "Unit Holders",
            value: formatNumber(unitHolders),
            deltaLabel: "▲ 4.5% (6-mo)",
            deltaDirection: "up",
          },
          {
            label: "Unit NAV",
            value: `KES ${latestNav.toFixed(2)}`,
            deltaLabel: "▲ 8.7% (6-mo)",
            deltaDirection: "up",
          },
          {
            label: "Distribution Yield (Annualized)",
            value: formatPercent(distributionYield),
            deltaLabel: "▲ 0.3pp (6-mo)",
            deltaDirection: "up",
          },
        ],
        trend: {
          label: "Unit NAV Trend (KES)",
          color: "cpfca",
          points: navTrend.points,
          monthLabels: navTrend.monthLabels,
          latestValueLabel: `${latestNav.toFixed(2)} latest`,
          byPeriod: {
            MoM: {
              titlePrefix: navTrend.byPeriod.MoM.titlePrefix,
              latestValueLabel: `${navTrend.byPeriod.MoM.latestValueLabel} latest`,
            },
            QoQ: {
              titlePrefix: navTrend.byPeriod.QoQ.titlePrefix,
              latestValueLabel: `${navTrend.byPeriod.QoQ.latestValueLabel} latest`,
            },
            YTD: {
              titlePrefix: navTrend.byPeriod.YTD.titlePrefix,
              latestValueLabel: `${navTrend.byPeriod.YTD.latestValueLabel} latest`,
            },
          },
        },
      },
      {
        title: "Structured & Project Finance Advisory",
        kpis: [
          {
            label: "Deal Count (YTD)",
            value: formatNumber(dealCount),
            deltaLabel: "▲ 2 YTD",
            deltaDirection: "up",
          },
          {
            label: "Deal Value (YTD)",
            value: formatKes(dealValue),
            exactValue: formatKesExact(dealValue),
            deltaLabel: "▲ 12.4% YTD",
            deltaDirection: "up",
            note: "Incl. Talanta Stadium-type structured deals",
            byPeriodDelta: dealDeltas,
          },
          {
            label: "Average Deal Size",
            value: averageDealSize === null ? "N/A" : formatKes(averageDealSize),
            exactValue: averageDealSize === null ? undefined : formatKesExact(averageDealSize),
            deltaLabel: "▲ 8.1% YTD",
            deltaDirection: "up",
          },
          {
            label: "Advisory Fee Income",
            value: formatKes(advisoryFeeIncome),
            exactValue: formatKesExact(advisoryFeeIncome),
            deltaLabel: "▲ 9.0% YTD",
            deltaDirection: "up",
          },
        ],
        trend: {
          label: "Deal Value (KES B)",
          color: "cpfca",
          points: dealTrend.points,
          monthLabels: dealTrend.monthLabels,
          latestValueLabel: formatKes(dealValue),
          byPeriod: {
            MoM: {
              titlePrefix: dealTrend.byPeriod.MoM.titlePrefix,
              latestValueLabel: dealTrend.byPeriod.MoM.latestValueLabel,
            },
            QoQ: {
              titlePrefix: dealTrend.byPeriod.QoQ.titlePrefix,
              latestValueLabel: dealTrend.byPeriod.QoQ.latestValueLabel,
            },
            YTD: {
              titlePrefix: dealTrend.byPeriod.YTD.titlePrefix,
              latestValueLabel: dealTrend.byPeriod.YTD.latestValueLabel,
            },
          },
        },
      },
      {
        title: "Debt Capital Markets (Sukuk/Bonds)",
        kpis: [
          {
            label: "Issuance Count (YTD)",
            value: formatNumber(issuanceCount),
            deltaLabel: "▲ 1 YTD",
            deltaDirection: "up",
          },
          {
            label: "Issuance Value (YTD)",
            value: formatKes(issuanceValue),
            exactValue: formatKesExact(issuanceValue),
            deltaLabel: "▲ 15.0% YTD",
            deltaDirection: "up",
            note: "Incl. Linzi Sukuk KDF Housing",
          },
          {
            label: "Weighted Avg. Profit Rate",
            value: formatPercent(weightedAvgProfitRate, 2),
            deltaLabel: "▲ 0.15pp YTD",
            deltaDirection: "up",
          },
          {
            label: "Subscription Rate",
            value: formatPercent(latestSubscriptionRate, 0),
            deltaLabel: (latestSubscriptionRate ?? 0) >= 1 ? "Oversubscribed" : "Below target",
            deltaDirection: "up",
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
