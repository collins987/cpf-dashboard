import { InfoIcon, TrendUpIcon, TrendDownIcon, TrendFlatIcon } from "./icons";
import { ICON_FOR_KPI, DEFAULT_KPI_ICON } from "./kpi-icons";
import type { Kpi } from "@/lib/orchestration/view-models";

interface KpiTileProps {
  kpi: Kpi;
  calculation: string;
}

export function KpiTile({ kpi, calculation }: KpiTileProps) {
  const deltaLabel = kpi.deltaLabel.replace(/^[▲▼]\s*/, "");
  const deltaClass =
    kpi.deltaDirection === "down"
      ? "deltaDown"
      : kpi.deltaDirection === "flat"
        ? "deltaFlat"
        : "deltaUp";
  const DeltaArrow =
    kpi.deltaDirection === "down"
      ? TrendDownIcon
      : kpi.deltaDirection === "flat"
        ? TrendFlatIcon
        : TrendUpIcon;
  const Icon = ICON_FOR_KPI[kpi.label] ?? DEFAULT_KPI_ICON;

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
        <div className="iconbadge" aria-hidden="true">
          <Icon />
        </div>
      </div>
      <span className="tilevalue serif">{kpi.value}</span>
      <span className={deltaClass}>
        <DeltaArrow />
        {deltaLabel}
      </span>
      {kpi.note ? <span className="tilenote">{kpi.note}</span> : null}
    </div>
  );
}
