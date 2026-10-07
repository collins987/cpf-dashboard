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
import type { SubsidiaryView, SubsidiaryTotals } from "./view-models";

/**
 * Note on deltas: period-over-period deltas (the "▲ x% MoM" labels) require a
 * prior-period dataset, which the current seed script does not yet generate.
 * The labels below are illustrative placeholders, matching the approved
 * dashboard mockup, until a prior-period query is added.
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
