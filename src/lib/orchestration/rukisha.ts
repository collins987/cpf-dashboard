import {
  calculatePortfolioValue,
  calculateActiveBorrowers,
  calculateRepaymentRate,
  calculateDefaultRate,
  calculateDefaultRateByProduct,
  calculateTransactionVolume,
  calculateTransactionValue,
  calculateActiveWallets,
  calculateAvgTransactionSize,
  calculateGoalBasedSavings,
  calculatePensionLinkedSavings,
  calculateActiveSavers,
  calculateSavingsToLoanRatio,
} from "@/lib/calculations/rukisha";
import { calculateHeadlineAum } from "@/lib/calculations/group";
import {
  getLoanAccounts,
  getRepayments,
  getWallets,
  getTransactions,
  getSavingsAccounts,
} from "@/lib/data/rukisha-queries";
import { formatKes, formatKesExact, formatNumber, formatPercent } from "@/lib/format";
import { buildMonthlyTrend, formatPeriodDelta } from "./monthly-trend";
import { getPeriodWindow, periodDeltaPct, asOfWindow, inWindow } from "@/lib/calculations/period";
import type { Period } from "@/lib/calculations/period";
import type { SubsidiaryView, SubsidiaryTotals } from "./view-models";

function buildRukishaViewForPeriod(
  loans: Awaited<ReturnType<typeof getLoanAccounts>>,
  repayments: Awaited<ReturnType<typeof getRepayments>>,
  wallets: Awaited<ReturnType<typeof getWallets>>,
  transactions: Awaited<ReturnType<typeof getTransactions>>,
  savings: Awaited<ReturnType<typeof getSavingsAccounts>>,
  txnTrend: ReturnType<typeof buildMonthlyTrend>,
  period: Period,
  now: Date,
): { view: SubsidiaryView; totals: SubsidiaryTotals } {
  const w = getPeriodWindow(period, now);

  // Stock metrics: as-of window end
  const loansAsOf = asOfWindow(loans, (l) => l.originationDate, w.end);
  const loansAsOfPrior = asOfWindow(loans, (l) => l.originationDate, w.priorEnd);
  const walletsAsOf = asOfWindow(wallets, (wl) => wl.openedDate, w.end);
  const walletsAsOfPrior = asOfWindow(wallets, (wl) => wl.openedDate, w.priorEnd);
  const savingsAsOf = asOfWindow(savings, (s) => s.openedDate, w.end);
  const savingsAsOfPrior = asOfWindow(savings, (s) => s.openedDate, w.priorEnd);

  // Flow metrics: in-window
  const txnsPeriod = inWindow(transactions, (t) => t.createdAt, w.start, w.end);
  const txnsPrior = inWindow(transactions, (t) => t.createdAt, w.priorStart, w.priorEnd);
  const repaymentsPeriod = inWindow(repayments, (r) => r.dueDate, w.start, w.end);

  // KPI values
  const portfolioValue = calculatePortfolioValue(loansAsOf);
  const portfolioValuePrior = calculatePortfolioValue(loansAsOfPrior);
  const activeBorrowers = calculateActiveBorrowers(loansAsOf);
  const activeBorrowersPrior = calculateActiveBorrowers(loansAsOfPrior);
  const repaymentRate = calculateRepaymentRate(repaymentsPeriod);
  const defaultRate = calculateDefaultRate(loansAsOf);
  const byProduct = calculateDefaultRateByProduct(loansAsOf);

  const transactionVolume = calculateTransactionVolume(txnsPeriod);
  const transactionValue = calculateTransactionValue(txnsPeriod);
  const transactionValuePrior = calculateTransactionValue(txnsPrior);
  const activeWallets = calculateActiveWallets(walletsAsOf);
  const activeWalletsPrior = calculateActiveWallets(walletsAsOfPrior);
  const avgTransactionSize = calculateAvgTransactionSize(txnsPeriod);

  const goalBased = calculateGoalBasedSavings(savingsAsOf);
  const goalBasedPrior = calculateGoalBasedSavings(savingsAsOfPrior);
  const pensionLinked = calculatePensionLinkedSavings(savingsAsOf);
  const pensionLinkedPrior = calculatePensionLinkedSavings(savingsAsOfPrior);
  const activeSavers = calculateActiveSavers(savingsAsOf);
  const activeSaversPrior = calculateActiveSavers(savingsAsOfPrior);
  const savingsToLoan = calculateSavingsToLoanRatio(
    goalBased + pensionLinked.total,
    portfolioValue,
  );

  // Deltas
  const portfolioDelta = formatPeriodDelta(
    periodDeltaPct(portfolioValue, portfolioValuePrior),
    period,
  );
  const borrowersDelta = formatPeriodDelta(
    periodDeltaPct(activeBorrowers, activeBorrowersPrior),
    period,
  );
  const txnValueDelta = formatPeriodDelta(
    periodDeltaPct(transactionValue, transactionValuePrior),
    period,
  );
  const walletsDelta = formatPeriodDelta(periodDeltaPct(activeWallets, activeWalletsPrior), period);
  const goalBasedDelta = formatPeriodDelta(periodDeltaPct(goalBased, goalBasedPrior), period);
  const pensionLinkedDelta = formatPeriodDelta(
    periodDeltaPct(pensionLinked.total, pensionLinkedPrior.total),
    period,
  );
  const saversDelta = formatPeriodDelta(periodDeltaPct(activeSavers, activeSaversPrior), period);

  const txnPeriodData = txnTrend.byPeriod[period];
  const {
    rawValues: txnRawValues,
    monthLabels: txnMonthLabels,
    quarterBoundaryLabel: txnQBoundary,
  } = txnPeriodData;

  const view: SubsidiaryView = {
    tag: "Digital Financial Services",
    subtitle:
      "Mobile wallet — credit access, merchant payments, fund transfers, and goal-based & pension-linked savings.",
    pillars: [
      {
        title: "Lending",
        kpis: [
          {
            label: "Portfolio Value",
            value: formatKes(portfolioValue),
            exactValue: formatKesExact(portfolioValue),
            deltaLabel: portfolioDelta.deltaLabel,
            deltaDirection: portfolioDelta.deltaDirection,
          },
          {
            label: "Active Borrowers",
            value: formatNumber(activeBorrowers),
            deltaLabel: borrowersDelta.deltaLabel,
            deltaDirection: borrowersDelta.deltaDirection,
          },
          {
            label: "Repayment Rate",
            value: formatPercent(repaymentRate),
            deltaLabel: w.label,
            deltaDirection: "flat",
          },
          {
            label: "Default Rate (Blended)",
            value: formatPercent(defaultRate),
            deltaLabel: w.label,
            deltaDirection: "flat",
            note: `Personal ${formatPercent(byProduct.personal ?? null)} · Business ${formatPercent(byProduct.business ?? null)} · Asset Finance ${formatPercent(byProduct.asset_finance ?? null)}`,
          },
        ],
        trend: {
          label: `${w.label} Transaction Value (KES M)`,
          color: "rukisha",
          rawValues: txnRawValues,
          monthLabels: txnMonthLabels,
          latestValueLabel: txnPeriodData.latestValueLabel,
          quarterBoundaryLabel: txnQBoundary,
        },
      },
      {
        title: "Payments & Transfers",
        kpis: [
          {
            label: "Transaction Volume",
            value: `${formatNumber(transactionVolume)} txns`,
            deltaLabel: w.label,
            deltaDirection: "flat",
          },
          {
            label: "Transaction Value",
            value: formatKes(transactionValue),
            exactValue: formatKesExact(transactionValue),
            deltaLabel: txnValueDelta.deltaLabel,
            deltaDirection: txnValueDelta.deltaDirection,
          },
          {
            label: "Active Wallets",
            value: formatNumber(activeWallets),
            deltaLabel: walletsDelta.deltaLabel,
            deltaDirection: walletsDelta.deltaDirection,
          },
          {
            label: "Avg. Transaction Size",
            value: avgTransactionSize === null ? "N/A" : formatKes(avgTransactionSize),
            exactValue:
              avgTransactionSize === null ? undefined : formatKesExact(avgTransactionSize),
            deltaLabel: w.label,
            deltaDirection: "flat",
          },
        ],
        trend: {
          label: `${w.label} Transaction Value (KES M)`,
          color: "rukisha",
          rawValues: txnRawValues,
          monthLabels: txnMonthLabels,
          latestValueLabel: formatKes(transactionValue),
          quarterBoundaryLabel: txnQBoundary,
        },
      },
      {
        title: "Savings",
        kpis: [
          {
            label: "Goal-Based Savings",
            value: formatKes(goalBased),
            exactValue: formatKesExact(goalBased),
            deltaLabel: goalBasedDelta.deltaLabel,
            deltaDirection: goalBasedDelta.deltaDirection,
          },
          {
            label: "Pension-Linked Savings",
            value: formatKes(pensionLinked.total),
            exactValue: formatKesExact(pensionLinked.total),
            deltaLabel: pensionLinkedDelta.deltaLabel,
            deltaDirection: pensionLinkedDelta.deltaDirection,
            note: `${formatNumber(pensionLinked.contributors)} contributors`,
          },
          {
            label: "Active Savers",
            value: formatNumber(activeSavers),
            deltaLabel: saversDelta.deltaLabel,
            deltaDirection: saversDelta.deltaDirection,
          },
          {
            label: "Savings-to-Loan Ratio",
            value: savingsToLoan === null ? "N/A" : savingsToLoan.toFixed(2),
            deltaLabel: w.label,
            deltaDirection: "flat",
          },
        ],
        trend: {
          label: `${w.label} Savings Balance (KES M)`,
          color: "rukisha",
          rawValues: txnRawValues,
          monthLabels: txnMonthLabels,
          latestValueLabel: formatKes(goalBased + pensionLinked.total),
          quarterBoundaryLabel: txnQBoundary,
        },
      },
    ],
  };

  const totals: SubsidiaryTotals = {
    headlineAum: calculateHeadlineAum([portfolioValue, goalBased, pensionLinked.total]),
    activeClients: activeWallets,
    transactionValue,
  };

  return { view, totals };
}

export async function getRukishaView(): Promise<{
  views: Record<Period, SubsidiaryView>;
  totals: Record<Period, SubsidiaryTotals>;
}> {
  const now = new Date();
  const loans = await getLoanAccounts();
  const [repayments, wallets, transactions, savings] = await Promise.all([
    getRepayments(loans.map((l) => l.id)),
    getWallets(),
    getTransactions(),
    getSavingsAccounts(),
  ]);

  const txnTrend = buildMonthlyTrend(
    transactions,
    (t) => t.createdAt,
    (t) => t.amount,
    formatKes,
    now,
  );

  const views = {} as Record<Period, SubsidiaryView>;
  const totals = {} as Record<Period, SubsidiaryTotals>;
  for (const period of ["MoM", "QoQ", "YTD"] as Period[]) {
    const result = buildRukishaViewForPeriod(
      loans,
      repayments,
      wallets,
      transactions,
      savings,
      txnTrend,
      period,
      now,
    );
    views[period] = result.view;
    totals[period] = result.totals;
  }

  return { views, totals };
}
