import React from "react";
import {
  AlertOctagon,
  CheckCircle2,
  HardHat,
  IdCard,
  Lock,
  ShieldAlert,
  ShieldCheck,
  Unlock,
  Wind,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { EdgeAccessEventPayload } from "@/types/vision-edge";
import { cn } from "@/lib/utils";

interface WearStateCardProps {
  event: EdgeAccessEventPayload | null;
  className?: string;
}

export const WearStateCard: React.FC<WearStateCardProps> = ({
  event,
  className,
}) => {
  if (!event) {
    return (
      <Card className={cn("bg-surface-container-low border-outline-variant/30", className)}>
        <CardContent className="p-space-lg flex flex-col items-center justify-center text-center h-64 text-outline font-telemetry">
          <IdCard className="w-10 h-10 mb-2 opacity-40 text-primary" />
          <span className="text-body-sm font-semibold text-on-surface">
            Awaiting Turnstile Ingress Event
          </span>
          <span className="text-telemetry-micro text-outline mt-1 max-w-xs">
            Scan worker RFID badge or trigger simulated ingress event to evaluate optical PPE compliance.
          </span>
        </CardContent>
      </Card>
    );
  }

  const {
    worker_name = "Ramesh Kumar",
    worker_designation = "Underground Loader Operator",
    rfid_tag,
    optical_compliance,
    credential_eligibility,
    gate_actuated,
    wear_states,
    timestamp,
    violation_ticket_created,
  } = event;

  return (
    <Card
      className={cn(
        "bg-surface-container-low border transition-all duration-300 shadow-md",
        gate_actuated
          ? "border-emerald-500/40"
          : "border-rose-500/60 bg-rose-950/10",
        className
      )}
    >
      <CardHeader className="p-space-md border-b border-outline-variant/20 pb-space-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-telemetry-micro uppercase bg-surface-container px-1.5 py-0.5 rounded text-outline border border-outline-variant/30">
              TURNSTILE INTERLOCK #01
            </span>
            <span className="text-[10px] font-telemetry text-outline">
              {timestamp ? new Date(timestamp).toLocaleTimeString() : "LIVE"}
            </span>
          </div>

          {/* Actuation Status Badge */}
          <div
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-telemetry uppercase font-bold border",
              gate_actuated
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40"
                : "bg-rose-500/20 text-rose-400 border-rose-500/50 animate-pulse"
            )}
          >
            {gate_actuated ? (
              <>
                <Unlock className="w-3.5 h-3.5" />
                <span>UNLOCKED // CLEARANCE GRANTED</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>INTERLOCK HELD // ACCESS DENIED</span>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-space-md space-y-space-md">
        {/* Worker Credentials Strip */}
        <div className="flex items-start justify-between bg-surface-container p-3 rounded border border-outline-variant/30">
          <div className="space-y-0.5">
            <span className="text-[10px] font-telemetry text-outline uppercase block">
              IDENTIFIED PERSONNEL
            </span>
            <h4 className="text-title-md font-bold text-on-surface leading-tight">
              {worker_name}
            </h4>
            <span className="text-body-sm text-on-surface-variant block">
              {worker_designation}
            </span>
          </div>

          <div className="text-right space-y-1">
            <span className="font-telemetry text-[11px] bg-surface-container-lowest px-2 py-0.5 rounded border border-outline-variant/30 block font-semibold text-primary">
              {rfid_tag}
            </span>
            <div className="flex items-center justify-end gap-1 text-[10px] font-telemetry">
              {credential_eligibility ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> VTC/PME VALID
                </span>
              ) : (
                <span className="text-rose-400 flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> CREDENTIAL EXPIRED
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Optical PPE Verification Grid */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-telemetry-micro text-outline uppercase">
              OPTICAL PPE SENSOR CHECKS (CMR 2017)
            </span>
            <span
              className={cn(
                "text-[10px] font-telemetry uppercase font-semibold flex items-center gap-1",
                optical_compliance ? "text-emerald-400" : "text-rose-400"
              )}
            >
              {optical_compliance ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>ALL STATUTORY CHECKS PASSED</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>INFRACTIONS DETECTED</span>
                </>
              )}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* Hardhat Check */}
            <div
              className={cn(
                "p-2.5 rounded border text-center space-y-1",
                wear_states.hardhat_worn
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-rose-500/15 border-rose-500/40 text-rose-300"
              )}
            >
              <div className="flex justify-center">
                <HardHat
                  className={cn(
                    "w-5 h-5",
                    wear_states.hardhat_worn
                      ? "text-emerald-400"
                      : "text-rose-400 animate-bounce"
                  )}
                />
              </div>
              <span className="text-[11px] font-semibold block leading-tight">
                Hardhat
              </span>
              <span className="text-[9px] font-telemetry uppercase block opacity-80">
                {wear_states.hardhat_worn ? "CONFIRMED" : "MISSING"}
              </span>
            </div>

            {/* High-Vis Vest Check */}
            <div
              className={cn(
                "p-2.5 rounded border text-center space-y-1",
                wear_states.vest_worn
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-rose-500/15 border-rose-500/40 text-rose-300"
              )}
            >
              <div className="flex justify-center">
                <CheckCircle2
                  className={cn(
                    "w-5 h-5",
                    wear_states.vest_worn ? "text-emerald-400" : "text-rose-400"
                  )}
                />
              </div>
              <span className="text-[11px] font-semibold block leading-tight">
                High-Vis Vest
              </span>
              <span className="text-[9px] font-telemetry uppercase block opacity-80">
                {wear_states.vest_worn ? "CONFIRMED" : "MISSING"}
              </span>
            </div>

            {/* SCSR Apparatus Check */}
            <div
              className={cn(
                "p-2.5 rounded border text-center space-y-1",
                wear_states.scsr_worn
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-rose-500/15 border-rose-500/40 text-rose-300"
              )}
            >
              <div className="flex justify-center">
                <Wind
                  className={cn(
                    "w-5 h-5",
                    wear_states.scsr_worn
                      ? "text-emerald-400"
                      : "text-rose-400 animate-bounce"
                  )}
                />
              </div>
              <span className="text-[11px] font-semibold block leading-tight">
                SCSR Pack
              </span>
              <span className="text-[9px] font-telemetry uppercase block opacity-80">
                {wear_states.scsr_worn ? "EQUIPPED" : "UNATTACHED"}
              </span>
            </div>
          </div>
        </div>

        {/* Violation Directive Alert if Infraction Created */}
        {violation_ticket_created && (
          <div className="p-2.5 rounded bg-rose-950/40 border border-rose-500/50 text-rose-200 flex items-start gap-2 text-xs">
            <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-telemetry font-bold uppercase text-[10px] text-rose-300 block">
                COMPLIANCE VIOLATION TICKET AUTO-DISPATCHED
              </span>
              <p className="text-[11px] leading-relaxed text-rose-200/90">
                Turnstile barred under CMR 2017 Reg. 191(A). Shift safety ticket logged and anchored to cryptographic audit ledger.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WearStateCard;
