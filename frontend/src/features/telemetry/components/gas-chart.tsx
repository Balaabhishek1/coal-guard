import React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { STATUTORY_METRIC_CONFIGS } from "@/types/telemetry";
import type { GasReadingPoint, MetricType } from "@/types/telemetry";

interface GasChartProps {
  metricType: MetricType;
  points: GasReadingPoint[];
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
  isLoading?: boolean;
}

const CustomTooltip: React.FC<{
  active?: boolean;
  payload?: any[];
  label?: string;
  unit?: string;
}> = ({ active, payload, label, unit }) => {
  if (active && payload && payload.length > 0) {
    const timeFormatted = label
      ? new Date(label).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      : "";

    return (
      <div className="bg-surface-container-lowest p-2.5 rounded border border-outline-variant/60 shadow-xl font-telemetry text-xs space-y-1">
        <span className="text-outline text-[10px] block font-mono">
          TIME: {timeFormatted}
        </span>
        <div className="flex items-center justify-between gap-4 text-primary">
          <span>AVERAGE:</span>
          <span className="font-bold text-on-surface font-mono">
            {payload[0]?.value?.toFixed(2)} {unit}
          </span>
        </div>
        {payload[1] && (
          <div className="flex items-center justify-between gap-4 text-amber-400">
            <span>PEAK SPIKE:</span>
            <span className="font-bold text-on-surface font-mono">
              {payload[1]?.value?.toFixed(2)} {unit}
            </span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export const GasChart: React.FC<GasChartProps> = ({
  metricType,
  points,
  timeRange,
  onTimeRangeChange,
  isLoading,
}) => {
  const config = STATUTORY_METRIC_CONFIGS[metricType];

  const strokeColor =
    metricType === "CH4_PERCENT"
      ? "#0ea5e9"
      : metricType === "CO_PPM"
      ? "#f59e0b"
      : "#10b981";

  const gradientId = `gas-gradient-${metricType}`;

  return (
    <div className="space-y-space-sm bg-surface-container p-space-md rounded border border-outline-variant/40 shadow-sm">
      {/* Chart Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-space-sm border-b border-outline-variant/30 pb-space-sm">
        <div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            {config.label} ({config.symbol}) — Continuous Trend
          </h3>
          <span className="text-[11px] font-telemetry text-outline">
            NOMINAL OPERATIONAL RANGE: {config.nominalRange}
          </span>
        </div>

        {/* Time Window Range Buttons */}
        <div className="flex items-center gap-1 bg-surface-container-low p-0.5 rounded border border-outline-variant/40">
          {["1h", "6h", "24h", "7d"].map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => onTimeRangeChange(range)}
              className={`px-2.5 py-1 text-[11px] font-telemetry uppercase rounded transition-colors ${
                timeRange === range
                  ? "bg-primary-container text-white font-semibold shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-72 w-full pt-space-xs">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-outline font-telemetry text-sm">
            Fetching TimescaleDB Telemetry Buckets...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={points}
              margin={{ top: 12, right: 16, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={strokeColor} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="2 4"
                stroke="#1e293b"
                vertical={false}
              />

              <XAxis
                dataKey="bucket"
                tickLine={false}
                stroke="#64748b"
                fontSize={10}
                fontFamily="JetBrains Mono"
                tickFormatter={(val) => {
                  try {
                    const d = new Date(val);
                    return timeRange === "7d"
                      ? `${d.getMonth() + 1}/${d.getDate()}`
                      : `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
                  } catch {
                    return val;
                  }
                }}
              />

              <YAxis
                stroke="#64748b"
                fontSize={10}
                fontFamily="JetBrains Mono"
                tickLine={false}
                domain={["auto", "auto"]}
                tickFormatter={(v) => `${v}${metricType === "CH4_PERCENT" ? "%" : ""}`}
              />

              <Tooltip
                content={<CustomTooltip unit={config.unit} />}
                cursor={{ stroke: "#334155", strokeWidth: 1, strokeDasharray: "2 2" }}
              />

              {/* Statutory Threshold Reference Lines */}
              {config.warningThreshold && (
                <ReferenceLine
                  y={config.warningThreshold}
                  stroke="#f59e0b"
                  strokeDasharray="3 3"
                  label={{
                    value: `WARN ≥ ${config.warningThreshold}`,
                    fill: "#f59e0b",
                    fontSize: 9,
                    fontFamily: "JetBrains Mono",
                    position: "right",
                  }}
                />
              )}

              {config.criticalThreshold && (
                <ReferenceLine
                  y={config.criticalThreshold}
                  stroke="#f43f5e"
                  strokeWidth={1.5}
                  label={{
                    value: `TRIP ≥ ${config.criticalThreshold}`,
                    fill: "#f43f5e",
                    fontSize: 9,
                    fontFamily: "JetBrains Mono",
                    position: "right",
                  }}
                />
              )}

              {/* Average Continuous Reading Series */}
              <Area
                type="monotone"
                dataKey="avg_reading"
                name="Average Reading"
                stroke={strokeColor}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#${gradientId})`}
                isAnimationActive={false}
              />

              {/* Peak Spike Series */}
              <Area
                type="monotone"
                dataKey="peak_reading"
                name="Peak Spike"
                stroke="#f59e0b"
                strokeWidth={1}
                strokeDasharray="2 3"
                fill="none"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Threshold Reference Indicator Legend */}
      <div className="flex flex-wrap items-center justify-between text-[10px] font-telemetry text-outline pt-1 border-t border-outline-variant/20">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-0.5"
              style={{ backgroundColor: strokeColor }}
            />
            <span>AVERAGE VALUE</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-amber-400 border-dashed" />
            <span>PEAK DETECTION</span>
          </span>
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2.5 h-0.5 bg-amber-500" />
            <span>WARN LIMIT ({config.warningThreshold})</span>
          </span>
          <span className="flex items-center gap-1.5 text-rose-400">
            <span className="w-2.5 h-0.5 bg-rose-500" />
            <span>TRIP INTERLOCK ({config.criticalThreshold})</span>
          </span>
        </div>
        <span>TIMESCALEDB CONTINUOUS AGGREGATES</span>
      </div>
    </div>
  );
};

export default GasChart;
