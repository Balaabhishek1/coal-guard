import React, { useState, useEffect } from "react";
import { Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SlaCountdownState {
  remainingMs: number;
  isBreached: boolean;
  isWarning: boolean;
  isSafe: boolean;
  formattedTime: string;
}

/**
 * Custom hook calculating real-time countdown against deadline_sla
 * Ticks continuously every second.
 */
export function useSlaCountdown(
  deadlineSla: string,
  resolvedAt?: string
): SlaCountdownState {
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    // If ticket is already resolved, no need to tick
    if (resolvedAt) return;

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [resolvedAt]);

  const deadline = new Date(deadlineSla).getTime();
  const effectiveNow = resolvedAt ? new Date(resolvedAt).getTime() : now;
  const diffMs = deadline - effectiveNow;

  const isBreached = diffMs <= 0;
  // Warning if less than 2 hours remaining (or if resolved past deadline)
  const isWarning = !isBreached && diffMs <= 2 * 3600 * 1000;
  const isSafe = !isBreached && !isWarning;

  const absDiff = Math.abs(diffMs);
  const totalSeconds = Math.floor(absDiff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");
  const timeString = `${hours > 0 ? `${hours}h ` : ""}${pad(minutes)}m ${pad(seconds)}s`;

  const formattedTime = isBreached
    ? `BREACHED -${timeString}`
    : resolvedAt
    ? `CLOSED (+${timeString})`
    : timeString;

  return {
    remainingMs: diffMs,
    isBreached,
    isWarning,
    isSafe,
    formattedTime,
  };
}

export interface SlaCountdownTimerProps {
  deadlineSla: string;
  resolvedAt?: string;
  className?: string;
  compact?: boolean;
}

export const SlaCountdownTimer: React.FC<SlaCountdownTimerProps> = ({
  deadlineSla,
  resolvedAt,
  className,
  compact = false,
}) => {
  const { isBreached, isWarning, isSafe, formattedTime } = useSlaCountdown(
    deadlineSla,
    resolvedAt
  );

  if (resolvedAt) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-telemetry text-[11px] font-medium border",
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
          className
        )}
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>STATUTORY CLOSEOUT</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-telemetry text-[11px] font-medium border transition-colors",
        isBreached &&
          "border-rose-500/60 bg-rose-500/15 text-rose-400 animate-pulse font-semibold shadow-[0_0_8px_rgba(244,63,94,0.3)]",
        isWarning &&
          "border-amber-500/50 bg-amber-500/10 text-amber-400 font-medium",
        isSafe &&
          "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-medium",
        className
      )}
    >
      {isBreached ? (
        <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
      ) : (
        <Clock
          className={cn(
            "w-3.5 h-3.5 shrink-0",
            isWarning ? "text-amber-400" : "text-emerald-400"
          )}
        />
      )}
      <span className="tracking-wide">{compact ? formattedTime.replace("BREACHED ", "OVERDUE ") : formattedTime}</span>
    </div>
  );
};

export default SlaCountdownTimer;
