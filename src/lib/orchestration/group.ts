import {
  calculateTotalGroupAum,
  calculateTotalActiveClients,
  calculateGroupTransactionValue,
  getLatestPensionLinkSummary,
} from "@/lib/calculations/group";
import { getPensionLinkSummary } from "@/lib/data/group-queries";
import { formatKes, formatNumber, formatPercent } from "@/lib/format";
import type { GroupView, SubsidiaryTotals } from "./view-models";
import type { Period } from "@/lib/calculations/period";

function buildGroupViewForPeriod(
  rukisha: SubsidiaryTotals,
  cpffs: SubsidiaryTotals,
  cpfca: SubsidiaryTotals,
  link: ReturnType<typeof getLatestPensionLinkSummary>,
  period: Period,
): GroupView {
  const snapshot = [
    {
      name: "Rukisha",
      color: "rukisha" as const,
      headlineAum: formatKes(rukisha.headlineAum),
      activeClients: formatNumber(rukisha.activeClients),
      deltaLabel: `${period} period`,
      headlineAumCalc: "Portfolio Value + Goal-Based Savings + Pension-Linked Savings.",
      activeClientsCalc: "Active wallets with ≥1 transaction this period.",
    },
    {
      name: "CPF Financial Services",
      color: "cpffs" as const,
      headlineAum: formatKes(cpffs.headlineAum),
      activeClients: formatNumber(cpffs.activeClients),
      deltaLabel: `${period} period`,
      headlineAumCalc: "Fund Balance + Assets Under Administration (Trust).",
      activeClientsCalc: "Distinct members in active pension schemes.",
    },
    {
      name: "CPF Capital & Advisory",
      color: "cpfca" as const,
      headlineAum: formatKes(cpfca.headlineAum),
      activeClients: formatNumber(cpfca.activeClients),
      deltaLabel: `${period} period`,
      headlineAumCalc: "AUM in REIT Vehicles + Deal Value (YTD) + Issuance Value (YTD).",
      activeClientsCalc: "Distinct REIT unit holders.",
    },
  ];

  const flow = [
    {
      name: "Rukisha",
      color: "rukisha" as const,
      statLabel: "Linked Pension Savers",
      statValue: link ? formatNumber(link.linkedSaversCount) : "N/A",
      description: "Pension-linked savers feed CPF Financial Services' administered schemes.",
    },
    {
      name: "CPF Financial Services",
      color: "cpffs" as const,
      statLabel: "AUM Deployed to Group Deals",
      statValue: link ? formatPercent(link.aumDeployedPct, 0) : "N/A",
      description: "Share of Fund Balance invested into CPF Capital & Advisory vehicles.",
    },
    {
      name: "CPF Capital & Advisory",
      color: "cpfca" as const,
      statLabel: "Investment Returns (6-mo NAV)",
      statValue: link ? `+${formatPercent(link.returnsCreditedPct, 1)}` : "N/A",
      description: "Credited back into CPF Financial Services' fund balance.",
    },
  ];

  const totalAum = calculateTotalGroupAum([
    { headlineAum: rukisha.headlineAum, activeClients: 0 },
    { headlineAum: cpffs.headlineAum, activeClients: 0 },
    { headlineAum: cpfca.headlineAum, activeClients: 0 },
  ]);
  const totalActiveClients = calculateTotalActiveClients([
    { headlineAum: 0, activeClients: rukisha.activeClients },
    { headlineAum: 0, activeClients: cpffs.activeClients },
    { headlineAum: 0, activeClients: cpfca.activeClients },
  ]);
  const totalTransactionValue = calculateGroupTransactionValue([
    rukisha.transactionValue ?? 0,
    cpffs.transactionValue ?? 0,
    cpfca.transactionValue ?? 0,
  ]);

  const scorecard = [
    {
      label: "Total Group AUM/AUA",
      value: formatKes(totalAum),
      note: "Across all three business lines",
    },
    {
      label: "Total Active Clients",
      value: formatNumber(totalActiveClients),
      note: "Wallets, members & unit holders",
    },
    {
      label: "Group Transaction/Deal Value",
      value: formatKes(totalTransactionValue),
      note: `${period} period, all business lines`,
    },
    { label: "Business Lines", value: "3", note: "Lending, pensions, capital markets" },
  ];

  return { snapshot, flow, scorecard };
}

export async function getGroupView(args: {
  rukisha: Record<Period, SubsidiaryTotals>;
  cpffs: Record<Period, SubsidiaryTotals>;
  cpfca: Record<Period, SubsidiaryTotals>;
}): Promise<Record<Period, GroupView>> {
  const { rukisha, cpffs, cpfca } = args;
  const pensionLinkSummary = await getPensionLinkSummary();
  const link = getLatestPensionLinkSummary(pensionLinkSummary);

  const views = {} as Record<Period, GroupView>;
  for (const period of ["MoM", "QoQ", "YTD"] as Period[]) {
    views[period] = buildGroupViewForPeriod(
      rukisha[period],
      cpffs[period],
      cpfca[period],
      link,
      period,
    );
  }
  return views;
}
