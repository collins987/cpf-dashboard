import {
  calculateTotalGroupAum,
  calculateTotalActiveClients,
  calculateGroupTransactionValue,
  getLatestPensionLinkSummary,
} from "@/lib/calculations/group";
import { rukishaTotals } from "./rukisha";
import { cpfFinancialServicesTotals } from "./cpf-financial-services";
import { cpfCapitalAdvisoryTotals } from "./cpf-capital-advisory";
import { pensionLinkSummary } from "@/lib/fixtures/group";
import { formatKes, formatNumber, formatPercent } from "@/lib/format";
import type { GroupView } from "./view-models";

export function getGroupView(): GroupView {
  const rukishaAum = rukishaTotals.headlineAum();
  const cpffsAum = cpfFinancialServicesTotals.headlineAum();
  const cpfcaAum = cpfCapitalAdvisoryTotals.headlineAum();

  const snapshot = [
    {
      name: "Rukisha",
      color: "rukisha" as const,
      headlineAum: formatKes(rukishaAum),
      activeClients: formatNumber(rukishaTotals.activeClients()),
      deltaLabel: "▲ 6.8% avg growth",
    },
    {
      name: "CPF Financial Services",
      color: "cpffs" as const,
      headlineAum: formatKes(cpffsAum),
      activeClients: formatNumber(cpfFinancialServicesTotals.activeClients()),
      deltaLabel: "▲ 3.7% avg growth",
    },
    {
      name: "CPF Capital & Advisory",
      color: "cpfca" as const,
      headlineAum: formatKes(cpfcaAum),
      activeClients: formatNumber(cpfCapitalAdvisoryTotals.activeClients()),
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
    { headlineAum: rukishaAum, activeClients: 0 },
    { headlineAum: cpffsAum, activeClients: 0 },
    { headlineAum: cpfcaAum, activeClients: 0 },
  ]);
  const totalActiveClients = calculateTotalActiveClients([
    { headlineAum: 0, activeClients: rukishaTotals.activeClients() },
    { headlineAum: 0, activeClients: cpfFinancialServicesTotals.activeClients() },
    { headlineAum: 0, activeClients: cpfCapitalAdvisoryTotals.activeClients() },
  ]);
  const totalTransactionValue = calculateGroupTransactionValue([
    rukishaTotals.transactionValue(),
    cpfFinancialServicesTotals.transactionValue(),
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
