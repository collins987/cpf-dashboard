"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
  ResponsiveContainer,
} from "recharts";
import { SUBSIDIARY_COLORS } from "./colors";
import type { TrendSeries, QoQChartSide } from "@/lib/orchestration/view-models";

interface QoQTrendChartProps {
  series: TrendSeries;
}

function formatTick(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(value % 1 === 0 ? 0 : 2);
}

function formatLabel(value: number): string {
  if (value >= 1_000_000_000) return `KES ${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `KES ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `KES ${(value / 1_000).toFixed(1)}K`;
  return `KES ${value.toFixed(0)}`;
}

interface HalfChartProps {
  side: QoQChartSide;
  colorHex: string;
  colorRgba: string;
  gradientId: string;
  yDomain: [number, number];
  metricLabel: string;
  padToMonths?: string[];
}

function HalfChart({
  side,
  colorHex,
  colorRgba,
  gradientId,
  yDomain,
  metricLabel,
  padToMonths,
}: HalfChartProps) {
  const real = side.rawValues.map((v, i) => ({
    name: side.monthLabels[i] ?? `${i + 1}`,
    value: v,
  }));

  // Pad remaining quarter months with null so Oct anchors left and the
  // axis spans the full quarter — as more months pass they fill in naturally.
  const realNames = new Set(real.map((d) => d.name));
  const padding = (padToMonths ?? [])
    .filter((m) => !realNames.has(m))
    .map((m) => ({ name: m, value: null as unknown as number }));

  const data = [...real, ...padding];

  return (
    <div className="card chartcard qoqhalfcard">
      <div className="qoqcharttitle">{side.title}</div>
      <div className="qoqchartsubtitle">{side.dateRangeLabel}</div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 24, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colorHex} stopOpacity={0.15} />
              <stop offset="95%" stopColor={colorHex} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="0" stroke="#F0F1F3" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "#9AA3AE", fontFamily: "inherit" }}
            axisLine={false}
            tickLine={false}
            dy={4}
          />
          <YAxis
            domain={yDomain}
            tickFormatter={formatTick}
            tick={{ fontSize: 9, fill: "#9AA3AE", fontFamily: "inherit" }}
            axisLine={false}
            tickLine={false}
            width={52}
            tickCount={4}
          />
          <Tooltip
            contentStyle={{
              background: "#fff",
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              fontSize: 12,
              fontFamily: "inherit",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
            formatter={(value) => [formatTick(Number(value ?? 0)), metricLabel]}
            labelStyle={{ color: "#374151", fontWeight: 600 }}
            cursor={{ stroke: colorHex, strokeWidth: 1, strokeDasharray: "4 2" }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={colorHex}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={{ r: 4, fill: "#fff", stroke: colorHex, strokeWidth: 2 }}
            activeDot={{ r: 6, fill: colorHex, stroke: "#fff", strokeWidth: 2 }}
            isAnimationActive={false}
            connectNulls={false}
          >
            <LabelList
              dataKey="value"
              position="top"
              formatter={(v: unknown) => formatLabel(Number(v ?? 0))}
              style={{ fontSize: 10, fill: colorHex, fontWeight: 600, fontFamily: "inherit" }}
            />
          </Area>
        </AreaChart>
      </ResponsiveContainer>
      <div className="qoqchartlegend">
        <span className="qoqlegendmark" style={{ background: colorHex }} />
        <span className="qoqlegendlabel">{metricLabel}</span>
      </div>
    </div>
  );
}

export function QoQTrendChart({ series }: QoQTrendChartProps) {
  const { qoqPair } = series;
  if (!qoqPair) return null;

  const color = SUBSIDIARY_COLORS[series.color];

  // Shared Y-axis scale across both charts for honest visual comparison
  const allValues = [...qoqPair.prior.rawValues, ...qoqPair.current.rawValues];
  const dataMax = Math.max(...allValues, 1);
  const yDomain: [number, number] = [0, Math.ceil(dataMax * 1.2)];

  // The current-quarter chart pads the remaining 2 months with nulls so the
  // single data point anchors to the left and the axis spans the full quarter.
  const currentPadMonths = qoqPair.current.allQuarterMonthLabels ?? [];

  return (
    <div className="qoqchartpair">
      <HalfChart
        side={qoqPair.prior}
        colorHex={color.hex}
        colorRgba={color.rgba}
        gradientId={`qoq-prior-${series.color}`}
        yDomain={yDomain}
        metricLabel={series.label}
      />
      <HalfChart
        side={qoqPair.current}
        colorHex={color.hex}
        colorRgba={color.rgba}
        gradientId={`qoq-current-${series.color}`}
        yDomain={yDomain}
        metricLabel={series.label}
        padToMonths={currentPadMonths}
      />
    </div>
  );
}
