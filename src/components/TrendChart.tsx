"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ResponsiveContainer,
} from "recharts";
import { SUBSIDIARY_COLORS } from "./colors";
import type { TrendSeries } from "@/lib/orchestration/view-models";

interface TrendChartProps {
  series: TrendSeries;
}

function formatTick(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(value % 1 === 0 ? 0 : 2);
}

export function TrendChart({ series }: TrendChartProps) {
  const color = SUBSIDIARY_COLORS[series.color];

  const data = series.rawValues.map((v, i) => ({
    name: series.monthLabels[i] ?? `${i + 1}`,
    value: v,
  }));

  // Use a tight domain: min slightly below data min, max slightly above data max
  const values = series.rawValues.filter((v) => v > 0);
  const dataMin = values.length > 0 ? Math.min(...values) : 0;
  const dataMax = values.length > 0 ? Math.max(...values) : 1;
  const padding = (dataMax - dataMin) * 0.15 || dataMax * 0.1 || 1;
  const yMin = Math.max(0, dataMin - padding);
  const yMax = dataMax + padding;

  const gradientId = `gradient-${series.color}`;

  return (
    <div className="card chartcard">
      <div className="chartheadrow">
        <span className="chartlabel">{series.label}</span>
        <span className="chartvalue" style={{ color: color.hex }}>
          {series.latestValueLabel}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <AreaChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color.hex} stopOpacity={0.18} />
              <stop offset="95%" stopColor={color.hex} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="0" stroke="#F0F1F3" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: "#9AA3AE", fontFamily: "inherit" }}
            axisLine={false}
            tickLine={false}
            dy={4}
          />
          <YAxis
            domain={[yMin, yMax]}
            tickFormatter={formatTick}
            tick={{ fontSize: 9, fill: "#9AA3AE", fontFamily: "inherit" }}
            axisLine={false}
            tickLine={false}
            width={44}
            tickCount={3}
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
            formatter={(value) => [formatTick(Number(value ?? 0)), series.label]}
            labelStyle={{ color: "#374151", fontWeight: 600 }}
            cursor={{ stroke: color.hex, strokeWidth: 1, strokeDasharray: "4 2" }}
          />
          {series.quarterBoundaryLabel && data.length >= 2 && (
            <>
              {/* Shade the prior-quarter region (all buckets before the boundary) */}
              <ReferenceArea
                x1={data[0].name}
                x2={data[data.length - 2].name}
                fill="#F3F4F6"
                fillOpacity={0.6}
                label={{
                  value: "◀ Prior Q",
                  position: "insideTopLeft",
                  fontSize: 9,
                  fill: "#6B7280",
                  fontFamily: "inherit",
                }}
              />
              {/* Label the current-quarter region */}
              <ReferenceArea
                x1={series.quarterBoundaryLabel}
                x2={series.quarterBoundaryLabel}
                label={{
                  value: "Current Q ▶",
                  position: "insideTopRight",
                  fontSize: 9,
                  fill: "#6B7280",
                  fontFamily: "inherit",
                }}
                fill="transparent"
              />
            </>
          )}
          <Area
            type="monotone"
            dataKey="value"
            stroke={color.hex}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={{ r: 3, fill: "#fff", stroke: color.hex, strokeWidth: 1.5 }}
            activeDot={{ r: 5, fill: color.hex, stroke: "#fff", strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
