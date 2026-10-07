import { TrendIcon, InfoIcon } from "./icons";
import type { Kpi } from "@/lib/orchestration/view-models";

interface KpiTileProps {
  kpi: Kpi;
  calculation: string;
}

/** One KPI as an individual, responsive card — with an info tooltip showing how it's calculated. */
export function KpiTile({ kpi, calculation }: KpiTileProps) {
  const deltaClass = kpi.deltaDirection === "down" ? "deltaDown" : "deltaUp";
  return (
    <div className="card">
      <div className="tilehead">
        <div className="tilelabelgroup">
          <span className="tilelabel">{kpi.label}</span>
          <span className="infobtn" tabIndex={0}>
            <InfoIcon />
            <span className="infotip">
              {calculation}
              {kpi.exactValue ? (
                <>
                  <br />
                  <span className="infotip-exact">{kpi.exactValue}</span>
                </>
              ) : null}
            </span>
          </span>
        </div>
        <div className="iconbadge">
          <TrendIcon />
        </div>
      </div>
      <span className="tilevalue serif">{kpi.value}</span>
      <span className={deltaClass}>{kpi.deltaLabel}</span>
      {kpi.note ? <span className="tilenote">{kpi.note}</span> : null}
    </div>
  );
}
