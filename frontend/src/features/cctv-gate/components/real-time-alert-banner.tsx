import React from "react";
import { AlertOctagon, AlertTriangle, Check } from "lucide-react";
import { useGateStore } from "@/store/gate-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const RealTimeAlertBanner: React.FC = () => {
  const { activeAlerts, dismissAlert, clearAlerts } = useGateStore();

  if (activeAlerts.length === 0) return null;

  const currentAlert = activeAlerts[0];
  const isCritical = currentAlert.severity === "CRITICAL";

  return (
    <div
      role="alert"
      className={cn(
        "sticky top-0 inset-x-0 z-50 p-space-sm px-space-md border-b shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-space-sm transition-all duration-300 animate-in fade-in slide-in-from-top-2",
        isCritical
          ? "bg-rose-950/95 border-rose-500/80 text-rose-100 shadow-rose-950/50"
          : "bg-amber-950/95 border-amber-500/80 text-amber-100 shadow-amber-950/50"
      )}
    >
      <div className="flex items-start gap-space-sm">
        <div
          className={cn(
            "p-1.5 rounded-full mt-0.5 shrink-0",
            isCritical ? "bg-rose-500/20 text-rose-400 animate-pulse" : "bg-amber-500/20 text-amber-400"
          )}
        >
          {isCritical ? (
            <AlertOctagon className="w-5 h-5" />
          ) : (
            <AlertTriangle className="w-5 h-5" />
          )}
        </div>

        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "px-2 py-0.5 rounded text-[10px] font-telemetry uppercase font-bold border",
                isCritical
                  ? "bg-rose-500/30 text-rose-200 border-rose-500/50"
                  : "bg-amber-500/30 text-amber-200 border-amber-500/50"
              )}
            >
              {currentAlert.title}
            </span>
            {currentAlert.statutory_rule && (
              <span className="text-[10px] font-telemetry opacity-75">
                // {currentAlert.statutory_rule}
              </span>
            )}
            {activeAlerts.length > 1 && (
              <span className="px-1.5 py-0.2 rounded bg-black/40 text-[9px] font-telemetry text-outline border border-outline-variant/30">
                1 OF {activeAlerts.length} ALERTS QUEUED
              </span>
            )}
          </div>

          <p className="text-body-sm font-medium leading-normal">
            {currentAlert.message}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-space-xs self-end md:self-center shrink-0">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => dismissAlert(currentAlert.id)}
          className={cn(
            "h-7 text-xs font-telemetry gap-1 border",
            isCritical
              ? "bg-rose-900/50 hover:bg-rose-900 border-rose-500/40 text-rose-200"
              : "bg-amber-900/50 hover:bg-amber-900 border-amber-500/40 text-amber-200"
          )}
        >
          <Check className="w-3.5 h-3.5" />
          <span>Acknowledge</span>
        </Button>

        {activeAlerts.length > 1 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={clearAlerts}
            className="h-7 text-xs font-telemetry text-outline hover:text-on-surface hover:bg-black/30"
          >
            Clear All
          </Button>
        )}
      </div>
    </div>
  );
};

export default RealTimeAlertBanner;
