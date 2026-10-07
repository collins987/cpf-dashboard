import {
  calculateTotalGroupAum,
  calculateTotalActiveClients,
  calculateGroupTransactionValue,
  getLatestPensionLinkSummary,
} from "@/lib/calculations/group";
import { getPensionLinkSummary } from "@/lib/data/group-queries";
import { formatKes, formatNumber, formatPercent } from "@/lib/format";
import type { GroupView, SubsidiaryTotals } from "./view-models";

export async function getGroupView(args: {
  rukisha: SubsidiaryTotals;
  cpffs: SubsidiaryTotals;
  cpfca: SubsidiaryTotals;
}): Promise<GroupView> {
  const { rukisha, cpffs, cpfca } = args;
  const pensionLinkSummary = await getPensionLinkSummary();

  const snapshot = [
    {
      name: "Rukisha",
      color: "rukisha" as const,
      headlineAum: formatKes(rukisha.headlineAum),
      activeClients: formatNumber(rukisha.activeClients),
      deltaLabel: "▲ 6.8% avg growth",
    },
    {
      name: "CPF Financial Services",
      color: "cpffs" as const,
      headlineAum: formatKes(cpffs.headlineAum),
      activeClients: formatNumber(cpffs.activeClients),
      deltaLabel: "▲ 3.7% avg growth",
    },
    {
      name: "CPF Capital & Advisory",
      color: "cpfca" as const,
      headlineAum: formatKes(cpfca.headlineAum),
      activeClients: formatNumber(cpfca.activeClients),
      deltaLabel: "▲ 8.7% avg growth",
    },
  ];

  const link = getLatestPensionLinkSummary(pensionLinkSummary);

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
      note: "Current period, all business lines",
    },
    { label: "Business Lines", value: "3", note: "Lending, pensions, capital markets" },
  ];

  return { snapshot, flow, scorecard };
}
