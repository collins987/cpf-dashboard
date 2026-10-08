import type {
  ReitHoldingRow,
  ReitNavHistoryRow,
  ReitDistributionRow,
  DealRow,
  IssuanceRow,
  Subsidiary,
} from "@/types/database";
import { runSelect } from "./helpers";

export const SUBSIDIARY_CPF_CA: Subsidiary = "cpf_capital_advisory";

const mapReitHolding = (r: Record<string, unknown>): ReitHoldingRow => ({
  id: r.id as string,
  subsidiaryId: r.subsidiary_id as Subsidiary,
  holderId: r.holder_id as string,
  unitBalance: Number(r.unit_balance),
  acquiredDate: (r.acquired_date as string) ?? new Date().toISOString(),
});

const mapReitNavHistory = (r: Record<string, unknown>): ReitNavHistoryRow => ({
  id: r.id as string,
  subsidiaryId: r.subsidiary_id as Subsidiary,
  period: r.period as string,
  navPerUnit: Number(r.nav_per_unit),
});

const mapReitDistribution = (r: Record<string, unknown>): ReitDistributionRow => ({
  id: r.id as string,
  subsidiaryId: r.subsidiary_id as Subsidiary,
  period: r.period as string,
  distributionPerUnit: Number(r.distribution_per_unit),
  unitPrice: Number(r.unit_price),
});

const mapDeal = (r: Record<string, unknown>): DealRow => ({
  id: r.id as string,
  subsidiaryId: r.subsidiary_id as Subsidiary,
  dealType: r.deal_type as DealRow["dealType"],
  dealValue: Number(r.deal_value),
  advisoryFee: Number(r.advisory_fee),
  closeDate: r.close_date as string,
});

const mapIssuance = (r: Record<string, unknown>): IssuanceRow => ({
  id: r.id as string,
  subsidiaryId: r.subsidiary_id as Subsidiary,
  instrumentType: r.instrument_type as IssuanceRow["instrumentType"],
  instrumentCode: r.instrument_code as string,
  issuanceValue: Number(r.issuance_value),
  profitRate: Number(r.profit_rate),
  amountOffered: Number(r.amount_offered),
  amountSubscribed: Number(r.amount_subscribed),
  issueDate: r.issue_date as string,
});

export function getReitHoldings(
  subsidiaryId: Subsidiary = SUBSIDIARY_CPF_CA,
): Promise<ReitHoldingRow[]> {
  return runSelect("reit_holding", (q) => q.eq("subsidiary_id", subsidiaryId), mapReitHolding);
}

export function getReitNavHistory(
  subsidiaryId: Subsidiary = SUBSIDIARY_CPF_CA,
): Promise<ReitNavHistoryRow[]> {
  return runSelect(
    "reit_nav_history",
    (q) => q.eq("subsidiary_id", subsidiaryId).order("period", { ascending: false }),
    mapReitNavHistory,
  );
}

export function getReitDistributions(
  subsidiaryId: Subsidiary = SUBSIDIARY_CPF_CA,
): Promise<ReitDistributionRow[]> {
  return runSelect(
    "reit_distribution",
    (q) => q.eq("subsidiary_id", subsidiaryId).order("period", { ascending: false }),
    mapReitDistribution,
  );
}

export function getDealsYtd(
  yearStart: string,
  subsidiaryId: Subsidiary = SUBSIDIARY_CPF_CA,
): Promise<DealRow[]> {
  return runSelect(
    "deal",
    (q) =>
      q
        .eq("subsidiary_id", subsidiaryId)
        .eq("deal_type", "structured_finance")
        .gte("close_date", yearStart),
    mapDeal,
  );
}

export function getIssuancesYtd(
  yearStart: string,
  subsidiaryId: Subsidiary = SUBSIDIARY_CPF_CA,
): Promise<IssuanceRow[]> {
  return runSelect(
    "issuance",
    (q) => q.eq("subsidiary_id", subsidiaryId).gte("issue_date", yearStart),
    mapIssuance,
  );
}
