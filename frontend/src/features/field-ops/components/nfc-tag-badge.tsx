import React from "react";
import { Radio, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface NfcTagBadgeProps {
  isGeotagged: boolean;
  compact?: boolean;
  className?: string;
}

export const NfcTagBadge: React.FC<NfcTagBadgeProps> = ({
  isGeotagged,
  compact = false,
  className,
}) => {
  if (isGeotagged) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-telemetry text-[11px] font-medium border",
          "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 shadow-[0_0_6px_rgba(16,185,129,0.15)]",
          className
        )}
        title="Location physically verified via intrinsically safe underground NFC/BLE gallery beacon"
      >
        <Radio className="w-3 h-3 text-emerald-400 shrink-0 animate-pulse" />
        <span>{compact ? "NFC" : "NFC Geotagged"}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-telemetry text-[11px] font-medium border",
        "border-amber-500/40 bg-amber-500/10 text-amber-300",
        className
      )}
      title="Manual coordinates entered without physical NFC token check"
    >
      <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
      <span>{compact ? "Manual" : "Manual Coordinate"}</span>
    </div>
  );
};

export default NfcTagBadge;
