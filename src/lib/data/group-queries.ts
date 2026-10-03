import type { PensionLinkSummaryRow } from "@/types/database";
import { runSelect } from "./helpers";

const mapPensionLinkSummary = (r: Record<string, unknown>): PensionLinkSummaryRow => ({
  id: r.id as string,
  period: r.period as string,
  linkedSaversPct: Number(r.linked_savers_pct),
  linkedSaversCount: Number(r.linked_savers_count),
  aumDeployedPct: Number(r.aum_deployed_pct),
  returnsCreditedPct: Number(r.returns_credited_pct),
});

/** The group-level aggregate linking table (ADR-0002) — not a per-customer join. */
export function getPensionLinkSummary(): Promise<PensionLinkSummaryRow[]> {
  return runSelect(
    "pension_link_summary",
    (q) => q.order("period", { ascending: false }),
    mapPensionLinkSummary,
  );
}
