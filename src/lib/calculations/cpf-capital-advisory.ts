import type {
  ReitHoldingRow,
  ReitNavHistoryRow,
  ReitDistributionRow,
  DealRow,
  IssuanceRow,
} from "@/types/database";

/** Sum(unit balance) x latest unit NAV, across holders. */
export function calculateReitAum(holdings: ReitHoldingRow[], latestNavPerUnit: number): number {
  const totalUnits = holdings.reduce((sum, h) => sum + h.unitBalance, 0);
  return totalUnits * latestNavPerUnit;
}

/** Distinct REIT unit holders. */
export function calculateUnitHolders(holdings: ReitHoldingRow[]): number {
  return new Set(holdings.map((h) => h.holderId)).size;
}

/** Latest nav_per_unit for the period. Edge case: no NAV history yet -> null (N/A). */
export function getLatestUnitNav(navHistory: ReitNavHistoryRow[]): number | null {
  if (navHistory.length === 0) return null;
  const latest = [...navHistory].sort((a, b) => b.period.localeCompare(a.period))[0];
  return latest.navPerUnit;
}

/** Annual distribution per unit / unit price. Edge case: unit price is 0 -> null (N/A). */
export function calculateDistributionYield(distribution: ReitDistributionRow): number | null {
  if (distribution.unitPrice === 0) return null;
  return distribution.distributionPerUnit / distribution.unitPrice;
}

/** Count of structured finance deals closed this year, in the rows passed in (already YTD-filtered by the caller). */
export function calculateDealCountYtd(deals: DealRow[]): number {
  return deals.length;
}

/** Sum of deal values closed this year, in the rows passed in. */
export function calculateDealValueYtd(deals: DealRow[]): number {
  return deals.reduce((sum, d) => sum + d.dealValue, 0);
}

/** Deal Value (YTD) / Deal Count (YTD). Edge case: zero deals -> null (N/A). */
export function calculateAverageDealSize(
  dealValueYtd: number,
  dealCountYtd: number,
): number | null {
  if (dealCountYtd === 0) return null;
  return dealValueYtd / dealCountYtd;
}

/** Sum of advisory fees on the deal rows passed in. */
export function calculateAdvisoryFeeIncome(deals: DealRow[]): number {
  return deals.reduce((sum, d) => sum + d.advisoryFee, 0);
}

/** Count of sukuk/bond issuances closed this year, in the rows passed in. */
export function calculateIssuanceCountYtd(issuances: IssuanceRow[]): number {
  return issuances.length;
}

/** Sum of issuance values closed this year, in the rows passed in. */
export function calculateIssuanceValueYtd(issuances: IssuanceRow[]): number {
  return issuances.reduce((sum, i) => sum + i.issuanceValue, 0);
}

/** Profit rate weighted by issuance value. Edge case: no issuances -> null (N/A). */
export function calculateWeightedAvgProfitRate(issuances: IssuanceRow[]): number | null {
  const totalValue = issuances.reduce((sum, i) => sum + i.issuanceValue, 0);
  if (totalValue === 0) return null;
  const weighted = issuances.reduce((sum, i) => sum + i.profitRate * i.issuanceValue, 0);
  return weighted / totalValue;
}

/**
 * amount subscribed / amount offered, for a single issuance.
 * Edge case: an issuance still open is still a valid rate — the caller is responsible
 * for labelling it "in progress" rather than this function silently excluding it.
 */
export function calculateSubscriptionRate(issuance: IssuanceRow): number | null {
  if (issuance.amountOffered === 0) return null;
  return issuance.amountSubscribed / issuance.amountOffered;
}
