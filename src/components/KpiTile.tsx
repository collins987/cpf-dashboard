import { InfoIcon, TrendUpIcon, TrendDownIcon, TrendFlatIcon } from "./icons";
import { ICON_FOR_KPI, DEFAULT_KPI_ICON } from "./kpi-icons";
import type { Kpi } from "@/lib/orchestration/view-models";
import type { Period } from "@/lib/calculations/period";

interface KpiTileProps {
  kpi: Kpi;
  calculation: string;
  /** Active period selector; when the KPI has real byPeriodDelta data, this
   * drives a genuine recomputed delta instead of the static placeholder. */
  period: Period;
}

/** One KPI as an individual, responsive card — with an info tooltip showing how it's calculated. */
export function KpiTile({ kpi, calculation, period }: KpiTileProps) {
  const active = kpi.byPeriodDelta ? kpi.byPeriodDelta[period] : null;
  const rawDeltaLabel = active ? active.deltaLabel : kpi.deltaLabel;
  // Existing deltaLabel strings carry a leading ▲/▼ glyph; the dedicated
  // TrendUp/Down/FlatIcon below now conveys direction, so strip it here to
  // avoid showing the arrow twice.
  const deltaLabel = rawDeltaLabel.replace(/^[▲▼]\s*/, "");
  const deltaDirection = active ? active.deltaDirection : kpi.deltaDirection;

  const deltaClass =
    deltaDirection === "down" ? "deltaDown" : deltaDirection === "flat" ? "deltaFlat" : "deltaUp";
  const DeltaArrow =
    deltaDirection === "down"
      ? TrendDownIcon
      : deltaDirection === "flat"
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
