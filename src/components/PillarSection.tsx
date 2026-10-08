import { KpiTile } from "./KpiTile";
import { TrendChart } from "./TrendChart";
import { BulletChart } from "./BulletChart";
import { KPI_CALCULATIONS } from "./kpi-calculations";
import { SUBSIDIARY_COLORS, type SubsidiaryColorKey } from "./colors";
import type { Pillar } from "@/lib/orchestration/view-models";
import type { Period } from "@/lib/calculations/period";

interface PillarSectionProps {
  pillar: Pillar;
  color: SubsidiaryColorKey;
  period: Period;
}

/** One pillar: section title, KPI tiles beside the chart (if any). */
export function PillarSection({ pillar, color, period }: PillarSectionProps) {
  const hasTrend = !!pillar.trend;
  return (
    <>
      <span className="sectiontitle serif">
        <span className="dot" style={{ background: SUBSIDIARY_COLORS[color].hex }} />
        {pillar.title}
      </span>
      {hasTrend ? (
        <div className="pillarrow">
          <div className="tilegrid">
            {pillar.kpis.map((kpi) => (
              <KpiTile
                key={kpi.label}
                kpi={kpi}
                calculation={KPI_CALCULATIONS[kpi.label] ?? ""}
                period={period}
              />
            ))}
          </div>
          <TrendChart series={pillar.trend!} period={period} />
        </div>
      ) : (
        <div className="tilegrid">
          {pillar.kpis.map((kpi) => (
            <KpiTile
              key={kpi.label}
              kpi={kpi}
              calculation={KPI_CALCULATIONS[kpi.label] ?? ""}
              period={period}
            />
          ))}
        </div>
      )}
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
