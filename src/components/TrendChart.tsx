import { SUBSIDIARY_COLORS } from "./colors";
import type { TrendSeries } from "@/lib/orchestration/view-models";

const X_POSITIONS = [0, 80, 160, 240, 320, 400];

/** Maps a 0-100 trend point to the chart's y-coordinate (5 = top/highest, 95 = bottom/lowest). */
function toY(point: number): number {
  return 95 - (Math.max(0, Math.min(100, point)) / 100) * 90;
}

interface TrendChartProps {
  series: TrendSeries;
}

/** A line/area sparkline with gridlines and point markers — fixed aspect ratio so it never distorts. */
export function TrendChart({ series }: TrendChartProps) {
  const color = SUBSIDIARY_COLORS[series.color];
  const coords = series.points.map((p, i) => [X_POSITIONS[i], toY(p)] as const);
  const linePoints = coords.map(([x, y]) => `${x},${y}`).join(" ");
  const areaPoints = `${linePoints} 400,100 0,100`;

  return (
    <div className="card chartcard">
      <div className="chartheadrow">
        <span className="chartlabel">{series.label}</span>
        <span className="chartvalue" style={{ color: color.hex }}>
          {series.latestValueLabel}
        </span>
      </div>
      <svg viewBox="0 0 400 110" width="100%" height={130} style={{ display: "block" }}>
        <line x1="0" y1="15" x2="400" y2="15" stroke="#F0F1F3" strokeWidth="1" />
        <line x1="0" y1="50" x2="400" y2="50" stroke="#F0F1F3" strokeWidth="1" />
        <line x1="0" y1="85" x2="400" y2="85" stroke="#F0F1F3" strokeWidth="1" />
        <polygon points={areaPoints} fill={color.rgba} stroke="none" />
        <polyline
          points={linePoints}
          fill="none"
          stroke={color.hex}
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.12"
        />
        <polyline
          points={linePoints}
          fill="none"
          stroke={color.hex}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {coords.map(([x, y], i) =>
          i === coords.length - 1 ? (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="4.5"
              fill={color.hex}
              stroke="#FFFFFF"
              strokeWidth="2"
            />
          ) : (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="3.5"
              fill="#FFFFFF"
              stroke={color.hex}
              strokeWidth="2"
            />
          ),
        )}
      </svg>
      <div className="monthrow">
        {series.monthLabels.map((m) => (
          <span key={m} className="monthlabel">
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}
