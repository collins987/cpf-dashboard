import { KpiTile } from "./KpiTile";
import { TrendChart } from "./TrendChart";
import { BulletChart } from "./BulletChart";
import { KPI_CALCULATIONS } from "./kpi-calculations";
import { SUBSIDIARY_COLORS, type SubsidiaryColorKey } from "./colors";
import type { Pillar } from "@/lib/orchestration/view-models";

interface PillarSectionProps {
  pillar: Pillar;
  color: SubsidiaryColorKey;
}

/** One pillar: a section title, its KPI tile grid, and its chart (trend or bullet). */
export function PillarSection({ pillar, color }: PillarSectionProps) {
  return (
    <>
      <span className="sectiontitle serif">
        <span className="dot" style={{ background: SUBSIDIARY_COLORS[color].hex }} />
        {pillar.title}
      </span>
      <div className="tilegrid">
        {pillar.kpis.map((kpi) => (
          <KpiTile key={kpi.label} kpi={kpi} calculation={KPI_CALCULATIONS[kpi.label] ?? ""} />
        ))}
      </div>
      {pillar.trend ? <TrendChart series={pillar.trend} /> : null}
      {pillar.bullets ? (
        <BulletChart
          title="Subscription Rate by Issuance"
          latestValueLabel={pillar.kpis[3]?.value ?? ""}
          rows={pillar.bullets}
        />
      ) : null}
    </>
  );
}
