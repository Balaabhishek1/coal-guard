import React from "react";
import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MetricType, ThresholdStatus } from "@/types/telemetry";

interface ThresholdBadgeProps {
  metricType: MetricType;
  value: number;
  className?: string;
  showIcon?: boolean;
}

export function evaluateThreshold(
  metricType: MetricType,
  value: number
): { status: ThresholdStatus; label: string; rule: string } {
  if (metricType === "CH4_PERCENT") {
    if (value >= 1.25) {
      return {
        status: "CRITICAL",
        label: "TRIP INTERLOCK (≥1.25%)",
        rule: "CMR 2017 Reg. 169(3)",
      };
    }
    if (value >= 0.75) {
      return {
        status: "WARNING",
        label: "ELEVATED (≥0.75%)",
        rule: "CMR 2017 Reg. 169(1)",
      };
    }
    return {
      status: "SAFE",
      label: "STATUTORY NOMINAL",
      rule: "CMR 2017 Compliant",
    };
  }

  if (metricType === "CO_PPM") {
    if (value >= 50.0) {
      return {
        status: "CRITICAL",
        label: "HEATING DANGER (≥50 PPM)",
        rule: "CMR 2017 Reg. 142",
      };
    }
    if (value >= 25.0) {
      return {
        status: "WARNING",
        label: "CO TRACE WARNING (≥25 PPM)",
        rule: "CMR 2017 Spontaneous Alert",
      };
    }
    return {
      status: "SAFE",
      label: "STATUTORY NOMINAL",
      rule: "CMR 2017 Compliant",
    };
  }

  if (metricType === "AIR_VELOCITY") {
    if (value < 0.5) {
      return {
        status: "CRITICAL",
        label: "STAGNANT AIRFLOW (<0.5 m/s)",
        rule: "CMR 2017 Reg. 153 Breach",
      };
    }
    if (value < 1.0) {
      return {
        status: "WARNING",
        label: "SUBNORMAL AIRFLOW (<1.0 m/s)",
        rule: "CMR 2017 Intake Alert",
      };
    }
    return {
      status: "SAFE",
      label: "VENTILATION ADEQUATE",
      rule: "CMR 2017 Compliant",
    };
  }

  // Default fallback for temperature/humidity
  if (metricType === "TEMPERATURE" && value >= 38.0) {
    return {
      status: "CRITICAL",
      label: "EXCESSIVE HEAT (≥38°C)",
      rule: "Thermal Stress Directive",
    };
  }

  return {
    status: "SAFE",
    label: "NORMAL OPERATIONAL",
    rule: "Compliant",
  };
}

export const ThresholdBadge: React.FC<ThresholdBadgeProps> = ({
  metricType,
  value,
  className,
  showIcon = true,
}) => {
  const { status, label } = evaluateThreshold(metricType, value);

  let badgeStyles = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
  let dotStyles = "bg-emerald-400";
  let Icon = CheckCircle2;

  if (status === "CRITICAL") {
    badgeStyles = "bg-rose-500/20 text-rose-400 border-rose-500/50 font-semibold";
    dotStyles = "bg-rose-400 animate-ping";
    Icon = AlertCircle;
  } else if (status === "WARNING") {
    badgeStyles = "bg-amber-500/15 text-amber-400 border-amber-500/40";
    dotStyles = "bg-amber-400 animate-pulse";
    Icon = AlertTriangle;
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-telemetry uppercase border tracking-wider",
        badgeStyles,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotStyles)} />
      {showIcon && <Icon className="w-3 h-3 shrink-0" />}
      <span>{label}</span>
    </div>
  );
};

export default ThresholdBadge;
