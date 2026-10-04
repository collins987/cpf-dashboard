import { CheckCircleIcon, AlertCircleIcon } from "./icons";
import type { BulletRow } from "@/lib/orchestration/view-models";

const TARGET_POSITION_PCT = 76.9; // 100% of a 130%-headroom scale

interface BulletChartProps {
  title: string;
  latestValueLabel: string;
  rows: BulletRow[];
}

/**
 * A bullet (actual-vs-target) bar chart — the correct form for a rate that can
 * exceed 100% of target, unlike a pie/donut (which implies a fixed whole).
 */
export function BulletChart({ title, latestValueLabel, rows }: BulletChartProps) {
  return (
    <div className="card chartcard">
      <div className="chartheadrow">
        <span className="chartlabel">{title}</span>
        <span className="chartvalue" style={{ color: "#C1440E" }}>
          {latestValueLabel}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 10 }}>
        {rows.map((row) => (
          <div className="bulletrow" key={row.code}>
            <div className="bulletnamewrap">
              <span className="bulletname">{row.name}</span>
              <span className="bulletcode">{row.code}</span>
            </div>
            <div className="bullettrack">
              <div
                className="bulletfill"
                style={{
                  width: `${row.percentOfTarget}%`,
                  background: row.onTarget ? "#C1440E" : "#D97A4A",
                }}
              />
              <div className="bullettarget" style={{ left: `${TARGET_POSITION_PCT}%` }} />
            </div>
            <span className="bulletvalue" style={{ color: row.onTarget ? "#C1440E" : "#D97A4A" }}>
              {row.valueLabel}
            </span>
            <span className="bulletstatus" style={{ color: row.onTarget ? "#1E7B34" : "#B3261E" }}>
              {row.onTarget ? <CheckCircleIcon /> : <AlertCircleIcon />}
            </span>
          </div>
        ))}
        <div className="bulletrow">
          <div className="bulletnamewrap" />
          <div className="bulletaxis">
            <span style={{ position: "absolute", left: 0, fontSize: 10, color: "#9AA3AE" }}>
              0%
            </span>
            <span
              style={{
                position: "absolute",
                left: `${TARGET_POSITION_PCT}%`,
                transform: "translateX(-50%)",
                fontSize: 10,
                color: "#0F1F35",
                fontWeight: 700,
              }}
            >
              100%
            </span>
            <span style={{ position: "absolute", right: 0, fontSize: 10, color: "#9AA3AE" }}>
              130%
            </span>
          </div>
          <span className="bulletvalue" />
          <span className="bulletstatus" />
        </div>
      </div>
      <div className="bulletlegend">
        <span className="bulletlegendmark" />
        Target marker — 100% fully subscribed · red flag below target, green check at/above
      </div>
    </div>
  );
}
