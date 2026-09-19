import React from "react";
import { Activity, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface PingIndicatorProps {
  isOnline: boolean;
  latencyMs?: number | null;
  className?: string;
}

export const PingIndicator: React.FC<PingIndicatorProps> = ({
  isOnline,
  latencyMs,
  className,
}) => {
  if (!isOnline) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-telemetry bg-rose-500/15 text-rose-400 border border-rose-500/40 uppercase font-semibold",
          className
        )}
      >
        <WifiOff className="w-3 h-3 text-rose-400" />
        <span>OFFLINE</span>
      </div>
    );
  }

  const ms = typeof latencyMs === "number" ? Math.round(latencyMs) : 24;

  let badgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
  let dotColor = "bg-emerald-400";
  let label = "NORMAL";

  if (ms > 250) {
    badgeColor = "bg-rose-500/15 text-rose-400 border-rose-500/40";
    dotColor = "bg-rose-400 animate-ping";
    label = "CRITICAL";
  } else if (ms >= 50) {
    badgeColor = "bg-amber-500/10 text-amber-400 border-amber-500/30";
    dotColor = "bg-amber-400 animate-pulse";
    label = "DEGRADED";
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-2 py-0.5 rounded text-[11px] font-telemetry border",
        badgeColor,
        className
      )}
    >
      <span className="flex items-center gap-1 font-mono font-semibold">
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColor)} />
        {ms} ms
      </span>
      <span className="text-[9px] uppercase tracking-wider opacity-75 font-sans">
        {label}
      </span>
      <Activity className="w-3 h-3 opacity-60 ml-0.5 shrink-0" />
    </div>
  );
};

export default PingIndicator;
