import { KpiTile } from "./KpiTile";
import { TrendChart } from "./TrendChart";
import { QoQTrendChart } from "./QoQTrendChart";
import { BulletChart } from "./BulletChart";
import { KPI_CALCULATIONS } from "./kpi-calculations";
import { SUBSIDIARY_COLORS, type SubsidiaryColorKey } from "./colors";
import type { Pillar } from "@/lib/orchestration/view-models";

interface PillarSectionProps {
  pillar: Pillar;
  color: SubsidiaryColorKey;
}

export function PillarSection({ pillar, color }: PillarSectionProps) {
  const hasTrend = !!pillar.trend;
  return (
    <>
      <span className="sectiontitle serif">
        <span className="dot" style={{ background: SUBSIDIARY_COLORS[color].hex }} />
        {pillar.title}
      </span>
      {hasTrend ? (
        <>
          <div className="tilegrid">
            {pillar.kpis.map((kpi) => (
              <KpiTile key={kpi.label} kpi={kpi} calculation={KPI_CALCULATIONS[kpi.label] ?? ""} />
            ))}
          </div>
          {pillar.trend!.qoqPair ? (
            <QoQTrendChart series={pillar.trend!} />
          ) : (
            <TrendChart series={pillar.trend!} />
          )}
        </>
      ) : (
        <div className="tilegrid">
          {pillar.kpis.map((kpi) => (
            <KpiTile key={kpi.label} kpi={kpi} calculation={KPI_CALCULATIONS[kpi.label] ?? ""} />
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
