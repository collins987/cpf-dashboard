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
  rukishaLoans,
  rukishaRepayments,
  rukishaWallets,
  rukishaTransactions,
  rukishaSavings,
} from "@/lib/fixtures/rukisha";
import { formatKes, formatNumber, formatPercent } from "@/lib/format";
import { syntheticTrend } from "./trend";
import type { SubsidiaryView } from "./view-models";

/**
 * Note on deltas: period-over-period deltas (the "▲ x% MoM" labels) require a
 * prior-period dataset, which the current fixtures/seed script do not yet
 * generate. The labels below are illustrative placeholders, matching the
 * approved dashboard mockup, until a prior-period query is added.
 */

export function getRukishaView(): SubsidiaryView {
  const activeLoans = rukishaLoans.filter((l) => l.status === "active");
  const portfolioValue = calculatePortfolioValue(rukishaLoans);
  const activeBorrowers = calculateActiveBorrowers(rukishaLoans);
  const repaymentRate = calculateRepaymentRate(rukishaRepayments);
  const defaultRate = calculateDefaultRate(rukishaLoans);
  const byProduct = calculateDefaultRateByProduct(rukishaLoans);

  const transactionVolume = calculateTransactionVolume(rukishaTransactions);
  const transactionValue = calculateTransactionValue(rukishaTransactions);
  const activeWallets = calculateActiveWallets(rukishaWallets);
  const avgTransactionSize = calculateAvgTransactionSize(rukishaTransactions);

  const goalBased = calculateGoalBasedSavings(rukishaSavings);
  const pensionLinked = calculatePensionLinkedSavings(rukishaSavings);
  const activeSavers = calculateActiveSavers(rukishaSavings);
  const savingsToLoan = calculateSavingsToLoanRatio(
    goalBased + pensionLinked.total,
    portfolioValue,
  );

  return {
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
            deltaLabel: "▲ 5.7% MoM",
            deltaDirection: "up",
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
            deltaLabel: "▲ 1.1% MoM",
            deltaDirection: "up",
          },
        ],
        trend: {
          label: "Monthly Transaction Value (KES M)",
          color: "rukisha",
          points: syntheticTrend(12),
          monthLabels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
          latestValueLabel: formatKes(transactionValue),
        },
      },
      {
        title: "Savings",
        kpis: [
          {
            label: "Goal-Based Savings",
            value: formatKes(goalBased),
            deltaLabel: "▲ 9.1% MoM",
            deltaDirection: "up",
          },
          {
            label: "Pension-Linked Savings",
            value: formatKes(pensionLinked.total),
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
}

export const rukishaTotals = {
  headlineAum: () => {
    const portfolioValue = calculatePortfolioValue(rukishaLoans);
    const { total: pensionLinkedTotal } = calculatePensionLinkedSavings(rukishaSavings);
    const goalBased = calculateGoalBasedSavings(rukishaSavings);
    return calculateHeadlineAum([portfolioValue, goalBased, pensionLinkedTotal]);
  },
  activeClients: () => calculateActiveWallets(rukishaWallets),
  transactionValue: () => calculateTransactionValue(rukishaTransactions),
};
