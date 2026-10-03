import type { PensionLinkSummaryRow } from "@/types/database";

export interface SubsidiarySnapshot {
  headlineAum: number;
  activeClients: number;
}

/** Sum of a subsidiary's headline value components (e.g. Portfolio + Savings for Rukisha). */
export function calculateHeadlineAum(components: number[]): number {
  return components.reduce((sum, v) => sum + v, 0);
}

/** Total Group AUM/AUA — sum of each subsidiary's Headline AUM. */
export function calculateTotalGroupAum(snapshots: SubsidiarySnapshot[]): number {
  return snapshots.reduce((sum, s) => sum + s.headlineAum, 0);
}

/**
 * Total Active Clients — a simple sum across subsidiaries, not deduplicated.
 * Known prototype limitation: the Connection layer links subsidiaries at an
 * aggregate level (see ADR-0002), not a per-customer level, so a person who is
 * both a Rukisha wallet holder and a CPF Financial Services member is counted
 * twice here. Documented in Phase 2 Analysis §1.
 */
export function calculateTotalActiveClients(snapshots: SubsidiarySnapshot[]): number {
  return snapshots.reduce((sum, s) => sum + s.activeClients, 0);
}

/** Group Transaction/Deal Value — sum of each subsidiary's period transaction/deal/contribution value. */
export function calculateGroupTransactionValue(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0);
}

/** The latest pension_link_summary row for the period. Edge case: none seeded yet -> null. */
export function getLatestPensionLinkSummary(
  rows: PensionLinkSummaryRow[],
): PensionLinkSummaryRow | null {
  if (rows.length === 0) return null;
  return [...rows].sort((a, b) => b.period.localeCompare(a.period))[0];
}

/** AUM Deployed Value = Fund Balance x AUM Deployed %, per ADR-0002. */
export function calculateAumDeployedValue(fundBalance: number, aumDeployedPct: number): number {
  return fundBalance * aumDeployedPct;
}
