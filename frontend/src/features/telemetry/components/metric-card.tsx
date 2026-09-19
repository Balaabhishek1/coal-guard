import React from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ThresholdBadge, evaluateThreshold } from "./threshold-badge";
import { STATUTORY_METRIC_CONFIGS } from "@/types/telemetry";
import type { MetricType } from "@/types/telemetry";

interface MetricCardProps {
  metricType: MetricType;
  value: number;
  peakValue?: number;
  deltaPercent?: number;
  onClick?: () => void;
  isSelected?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  metricType,
  value,
  peakValue,
  deltaPercent = 1.2,
  onClick,
  isSelected = false,
}) => {
  const config = STATUTORY_METRIC_CONFIGS[metricType];
  const { status } = evaluateThreshold(metricType, value);

  // Proximity progress bar calculation (0% to 100% of critical ceiling)
  const criticalCeiling = config.criticalThreshold || 100;
  const progressRatio = Math.min(
    100,
    Math.max(0, (value / criticalCeiling) * 100)
  );

  let progressBarColor = "bg-emerald-500";
  if (status === "CRITICAL") {
    progressBarColor = "bg-rose-500 animate-pulse";
  } else if (status === "WARNING") {
    progressBarColor = "bg-amber-500";
  }

  const isTrendingUp = deltaPercent >= 0;

  return (
    <Card
      onClick={onClick}
      className={`cursor-pointer transition-all border ${
        isSelected
          ? "border-primary-container bg-surface-container-high shadow-md"
          : "border-outline-variant/30 bg-surface-container-low hover:border-outline-variant/60"
      }`}
    >
      <CardHeader className="p-space-md pb-1 flex flex-row items-center justify-between space-y-0">
        <div>
          <span className="font-telemetry text-telemetry-sm font-semibold text-primary block leading-none">
            {config.symbol}
          </span>
          <span className="text-[11px] text-outline truncate block mt-0.5">
            {config.label}
          </span>
        </div>
        <ThresholdBadge metricType={metricType} value={value} />
      </CardHeader>

      <CardContent className="p-space-md pt-2 space-y-space-xs">
        {/* Big Numeric Readout */}
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="font-telemetry text-telemetry-lg font-bold text-on-surface">
              {value.toFixed(2)}
            </span>
            <span className="text-body-sm font-telemetry text-on-surface-variant">
              {config.unit}
            </span>
          </div>

          {/* Trend Indicator */}
          <div
            className={`flex items-center gap-0.5 text-[11px] font-telemetry ${
              isTrendingUp
                ? status === "SAFE"
                  ? "text-on-surface-variant"
                  : "text-rose-400"
                : "text-emerald-400"
            }`}
          >
            {isTrendingUp ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            <span>
              {isTrendingUp ? "+" : ""}
              {deltaPercent.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Progress Bar towards Critical Boundary */}
        <div className="w-full bg-surface-container h-1.5 rounded overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${progressBarColor}`}
            style={{ width: `${progressRatio}%` }}
          />
        </div>

        {/* Footnote with Statutory Rule */}
        <div className="flex items-center justify-between text-[10px] font-telemetry text-outline pt-0.5">
          <span>PEAK: {peakValue ? peakValue.toFixed(2) : value.toFixed(2)}</span>
          <span className="truncate max-w-[170px]" title={config.statutoryRule}>
            {config.statutoryRule}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricCard;
