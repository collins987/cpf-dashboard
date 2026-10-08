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
import { syntheticTrend } from "./trend";
import { buildMonthlyTrend, buildKpiPeriodDeltas } from "./monthly-trend";
import type { SubsidiaryView, SubsidiaryTotals } from "./view-models";

/**
 * Note on deltas: most KPI deltas below ("▲ x% MoM") remain illustrative
 * static placeholders — their backing tables (loan_account, wallet,
 * savings_account) have no date column, so a genuine period-over-period
 * comparison isn't possible without a schema change (deliberately not made —
 * see docs/Phase 5 - Development.docx §9.5/§9.7). Transaction Value IS
 * genuinely dynamic: transaction.createdAt is a real seeded date, so its
 * trend/delta are computed for real via buildMonthlyTrend/buildKpiPeriodDeltas.
 */

export async function getRukishaView(): Promise<{
  view: SubsidiaryView;
  totals: SubsidiaryTotals;
}> {
  const loans = await getLoanAccounts();
  const [repayments, wallets, transactions, savings] = await Promise.all([
    getRepayments(loans.map((l) => l.id)),
    getWallets(),
    getTransactions(),
    getSavingsAccounts(),
  ]);

  const activeLoans = loans.filter((l) => l.status === "active");
  const portfolioValue = calculatePortfolioValue(loans);
  const activeBorrowers = calculateActiveBorrowers(loans);
  const repaymentRate = calculateRepaymentRate(repayments);
  const defaultRate = calculateDefaultRate(loans);
  const byProduct = calculateDefaultRateByProduct(loans);

  const transactionVolume = calculateTransactionVolume(transactions);
  const transactionValue = calculateTransactionValue(transactions);
  const activeWallets = calculateActiveWallets(wallets);
  const avgTransactionSize = calculateAvgTransactionSize(transactions);

  const goalBased = calculateGoalBasedSavings(savings);
  const pensionLinked = calculatePensionLinkedSavings(savings);
  const activeSavers = calculateActiveSavers(savings);
  const savingsToLoan = calculateSavingsToLoanRatio(
    goalBased + pensionLinked.total,
    portfolioValue,
  );

  const txnTrend = buildMonthlyTrend(
    transactions,
    (t) => t.createdAt,
    (t) => t.amount,
    formatKes,
  );
  const txnDeltas = buildKpiPeriodDeltas(
    transactions,
    (t) => t.createdAt,
    (t) => t.amount,
  );

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
            deltaLabel: "▲ 6.2% MoM",
            deltaDirection: "up",
          },
          {
            label: "Active Borrowers",
            value: formatNumber(activeBorrowers),
            deltaLabel: "▲ 2.9% MoM",
            deltaDirection: "up",
          },
          {
            label: "Repayment Rate",
            value: formatPercent(repaymentRate),
            deltaLabel: "▲ 1.1pp MoM",
            deltaDirection: "up",
          },
          {
            label: "Default Rate (Blended)",
            value: formatPercent(defaultRate),
            deltaLabel: "▼ 0.4pp MoM",
            deltaDirection: "up",
            note: `Personal ${formatPercent(byProduct.personal ?? null)} · Business ${formatPercent(byProduct.business ?? null)} · Asset Finance ${formatPercent(byProduct.asset_finance ?? null)}`,
          },
        ],
        trend: {
          label: "Monthly Disbursements (KES M)",
          color: "rukisha",
          points: syntheticTrend(11),
          monthLabels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
          latestValueLabel: `${formatNumber(activeLoans.length)} loans`,
        },
      },
      {
        title: "Payments & Transfers",
        kpis: [
          {
            label: "Transaction Volume",
            value: `${formatNumber(transactionVolume)} txns`,
            deltaLabel: "▲ 8.4% MoM",
            deltaDirection: "up",
          },
          {
            label: "Transaction Value",
            value: formatKes(transactionValue),
            exactValue: formatKesExact(transactionValue),
            deltaLabel: "▲ 5.7% MoM",
            deltaDirection: "up",
            byPeriodDelta: txnDeltas,
          },
          {
            label: "Active Wallets",
            value: formatNumber(activeWallets),
            deltaLabel: "▲ 3.2% MoM",
            deltaDirection: "up",
          },
          {
            label: "Avg. Transaction Size",
            value: avgTransactionSize === null ? "N/A" : formatKes(avgTransactionSize),
            exactValue:
              avgTransactionSize === null ? undefined : formatKesExact(avgTransactionSize),
            deltaLabel: "▲ 1.1% MoM",
            deltaDirection: "up",
          },
        ],
        trend: {
          label: "Transaction Value (KES M)",
          color: "rukisha",
          points: txnTrend.points,
          monthLabels: txnTrend.monthLabels,
          latestValueLabel: formatKes(transactionValue),
          byPeriod: {
            MoM: {
              titlePrefix: txnTrend.byPeriod.MoM.titlePrefix,
              latestValueLabel: txnTrend.byPeriod.MoM.latestValueLabel,
            },
            QoQ: {
              titlePrefix: txnTrend.byPeriod.QoQ.titlePrefix,
              latestValueLabel: txnTrend.byPeriod.QoQ.latestValueLabel,
            },
            YTD: {
              titlePrefix: txnTrend.byPeriod.YTD.titlePrefix,
              latestValueLabel: txnTrend.byPeriod.YTD.latestValueLabel,
            },
          },
        },
      },
      {
        title: "Savings",
        kpis: [
          {
            label: "Goal-Based Savings",
            value: formatKes(goalBased),
            exactValue: formatKesExact(goalBased),
            deltaLabel: "▲ 9.1% MoM",
            deltaDirection: "up",
          },
          {
            label: "Pension-Linked Savings",
            value: formatKes(pensionLinked.total),
            exactValue: formatKesExact(pensionLinked.total),
            deltaLabel: "▲ 11.4% MoM",
            deltaDirection: "up",
            note: `${formatNumber(pensionLinked.contributors)} contributors`,
          },
          {
            label: "Active Savers",
            value: formatNumber(activeSavers),
            deltaLabel: "▲ 6.5% MoM",
            deltaDirection: "up",
          },
          {
            label: "Savings-to-Loan Ratio",
            value: savingsToLoan === null ? "N/A" : savingsToLoan.toFixed(2),
            deltaLabel: "▲ 0.03 MoM",
            deltaDirection: "up",
          },
        ],
        trend: {
          label: "Combined Savings Balance (KES M)",
          color: "rukisha",
          points: syntheticTrend(13),
          monthLabels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
          latestValueLabel: formatKes(goalBased + pensionLinked.total),
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
