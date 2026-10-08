import { SUBSIDIARY_COLORS } from "./colors";
import type { TrendSeries } from "@/lib/orchestration/view-models";

// SVG canvas dimensions
const W = 440;
const H = 110;
// Chart area: leave left margin for Y-axis labels, bottom margin for X labels
const LEFT = 52;
const RIGHT = W;
const TOP = 8;
const BOTTOM = 88;
const CHART_W = RIGHT - LEFT;
const CHART_H = BOTTOM - TOP;

function xOf(i: number, n: number): number {
  if (n <= 1) return LEFT + CHART_W / 2;
  return LEFT + (i / (n - 1)) * CHART_W;
}

function yOf(point: number): number {
  return BOTTOM - (Math.max(0, Math.min(100, point)) / 100) * CHART_H;
}

interface TrendChartProps {
  series: TrendSeries;
}

export function TrendChart({ series }: TrendChartProps) {
  const color = SUBSIDIARY_COLORS[series.color];
  const n = series.points.length;
  const coords = series.points.map((p, i) => [xOf(i, n), yOf(p)] as const);

  const linePoints = coords.map(([x, y]) => `${x},${y}`).join(" ");
  const lastX = coords[coords.length - 1]?.[0] ?? RIGHT;
  const areaPoints = `${linePoints} ${lastX},${BOTTOM} ${LEFT},${BOTTOM}`;

  // Gridline Y positions
  const gridTop = yOf(100);
  const gridMid = yOf(50);
  const gridLow = yOf(0);

  const [topLabel, midLabel] = series.yAxisLabels ?? ["", ""];

  return (
    <div className="card chartcard">
      <div className="chartheadrow">
        <span className="chartlabel">{series.label}</span>
        <span className="chartvalue" style={{ color: color.hex }}>
          {series.latestValueLabel}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={120}
        style={{ display: "block", overflow: "visible" }}
      >
        {/* Gridlines */}
        <line x1={LEFT} y1={gridTop} x2={RIGHT} y2={gridTop} stroke="#F0F1F3" strokeWidth="1" />
        <line x1={LEFT} y1={gridMid} x2={RIGHT} y2={gridMid} stroke="#F0F1F3" strokeWidth="1" />
        <line x1={LEFT} y1={gridLow} x2={RIGHT} y2={gridLow} stroke="#E8EAED" strokeWidth="1" />

        {/* Y-axis labels */}
        {topLabel && (
          <text
            x={LEFT - 6}
            y={gridTop + 4}
            textAnchor="end"
            fontSize="9"
            fill="#9AA3AE"
            fontFamily="inherit"
          >
            {topLabel}
          </text>
        )}
        {midLabel && (
          <text
            x={LEFT - 6}
            y={gridMid + 4}
            textAnchor="end"
            fontSize="9"
            fill="#9AA3AE"
            fontFamily="inherit"
          >
            {midLabel}
          </text>
        )}
        <text
          x={LEFT - 6}
          y={gridLow + 4}
          textAnchor="end"
          fontSize="9"
          fill="#9AA3AE"
          fontFamily="inherit"
        >
          0
        </text>

        {/* Area fill */}
        <polygon points={areaPoints} fill={color.rgba} stroke="none" />

        {/* Glow line */}
        <polyline
          points={linePoints}
          fill="none"
          stroke={color.hex}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.10"
        />

        {/* Main line */}
        <polyline
          points={linePoints}
          fill="none"
          stroke={color.hex}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data point dots */}
        {coords.map(([x, y], i) =>
          i === coords.length - 1 ? (
            <circle key={i} cx={x} cy={y} r="4" fill={color.hex} stroke="#FFFFFF" strokeWidth="2" />
          ) : (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="3"
              fill="#FFFFFF"
              stroke={color.hex}
              strokeWidth="1.5"
            />
          ),
        )}
      </svg>

      {/* X-axis labels */}
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
