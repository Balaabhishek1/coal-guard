import React from "react";
import {
  FileText,
  Gauge,
  Wind,
  Flame,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  User,
  Clock,
  Layers,
  Sparkles,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { NfcTagBadge } from "./nfc-tag-badge";
import { EvidenceGallery } from "./evidence-gallery";
import { formatStatutoryDateTime, cn } from "@/lib/utils";
import type { FormIVInspection } from "@/types/field-ops";

interface InspectionDetailDrawerProps {
  inspection: FormIVInspection | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const InspectionDetailDrawer: React.FC<InspectionDetailDrawerProps> = ({
  inspection,
  open,
  onOpenChange,
}) => {
  if (!inspection) return null;

  // Statutory checks
  const isTorqueCompliant =
    inspection.roof_bolt_torque_nm === undefined ||
    inspection.roof_bolt_torque_nm >= 100;

  const isAirCompliant =
    inspection.air_velocity_m_per_min === undefined ||
    inspection.air_velocity_m_per_min >= 30;

  const isCh4Compliant =
    inspection.gas_ch4_percent === undefined ||
    inspection.gas_ch4_percent < 0.75;

  const isCoCompliant =
    inspection.gas_co_ppm === undefined ||
    inspection.gas_co_ppm < 10;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="space-y-5">
        <SheetHeader>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="identity" className="font-telemetry text-[10px]">
              CMR 2017 FORM IV
            </Badge>
            <NfcTagBadge isGeotagged={inspection.is_geotagged_nfc} compact />
          </div>
          <SheetTitle className="flex items-center gap-2 text-on-surface">
            <FileText className="w-5 h-5 text-primary" />
            Underground Shift Inspection Details
          </SheetTitle>
          <SheetDescription className="font-telemetry">
            Record ID: {inspection.id}
          </SheetDescription>
        </SheetHeader>

        {/* Operational Context Card */}
        <div className="p-3.5 rounded bg-surface-container-high/40 border border-outline-variant/40 space-y-2 text-xs font-telemetry">
          <div className="flex items-center justify-between">
            <span className="text-outline flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              Location / Face:
            </span>
            <span className="font-semibold text-on-surface text-right">
              {inspection.location_name || inspection.location_id}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-outline flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-primary" />
              Statutory Inspector:
            </span>
            <span className="text-on-surface">
              {inspection.inspector_name || inspection.inspector_id}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-outline flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary" />
              Inspection Time (IST):
            </span>
            <span className="text-on-surface">
              {formatStatutoryDateTime(inspection.inspection_time)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-outline flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-primary" />
              Sync Batch ID:
            </span>
            <span className="text-outline/80 text-[10px]">
              {inspection.sync_id.slice(0, 18)}...
            </span>
          </div>
        </div>

        {/* Statutory Environmental & Geotechnical Telemetry Grid */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-on-surface uppercase tracking-wider font-telemetry">
            Statutory Safety Measurements
          </h4>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Roof Bolt Torque */}
            <div
              className={cn(
                "p-3 rounded border font-telemetry",
                isTorqueCompliant
                  ? "bg-surface-container-low border-outline-variant/40"
                  : "bg-rose-500/10 border-rose-500/50 text-rose-300"
              )}
            >
              <div className="flex items-center justify-between text-outline text-[11px]">
                <span className="flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5" />
                  Bolt Torque
                </span>
                <span className="text-[10px]">Min 100 Nm</span>
              </div>
              <div className="mt-1 text-lg font-bold text-on-surface">
                {inspection.roof_bolt_torque_nm !== undefined
                  ? `${inspection.roof_bolt_torque_nm.toFixed(1)} Nm`
                  : "--"}
              </div>
              <div
                className={cn(
                  "text-[10px] mt-0.5 flex items-center gap-1",
                  isTorqueCompliant ? "text-emerald-400" : "text-rose-400 font-semibold"
                )}
              >
                {isTorqueCompliant ? (
                  <>
                    <ShieldCheck className="w-3 h-3" />
                    Statutory Compliant
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3 h-3" />
                    Strata Anomaly
                  </>
                )}
              </div>
            </div>

            {/* Air Velocity */}
            <div
              className={cn(
                "p-3 rounded border font-telemetry",
                isAirCompliant
                  ? "bg-surface-container-low border-outline-variant/40"
                  : "bg-rose-500/10 border-rose-500/50 text-rose-300"
              )}
            >
              <div className="flex items-center justify-between text-outline text-[11px]">
                <span className="flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5" />
                  Air Velocity
                </span>
                <span className="text-[10px]">Min 30 m/min</span>
              </div>
              <div className="mt-1 text-lg font-bold text-on-surface">
                {inspection.air_velocity_m_per_min !== undefined
                  ? `${inspection.air_velocity_m_per_min.toFixed(1)} m/min`
                  : "--"}
              </div>
              <div
                className={cn(
                  "text-[10px] mt-0.5 flex items-center gap-1",
                  isAirCompliant ? "text-emerald-400" : "text-rose-400 font-semibold"
                )}
              >
                {isAirCompliant ? (
                  <>
                    <ShieldCheck className="w-3 h-3" />
                    Reg 153 Adequate
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3 h-3" />
                    Stagnation Risk
                  </>
                )}
              </div>
            </div>

            {/* CH4 Percentage */}
            <div
              className={cn(
                "p-3 rounded border font-telemetry",
                isCh4Compliant
                  ? "bg-surface-container-low border-outline-variant/40"
                  : "bg-amber-500/10 border-amber-500/50 text-amber-300"
              )}
            >
              <div className="flex items-center justify-between text-outline text-[11px]">
                <span className="flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" />
                  CH4 Inflammable
                </span>
                <span className="text-[10px]">Max 0.75%</span>
              </div>
              <div className="mt-1 text-lg font-bold text-on-surface">
                {inspection.gas_ch4_percent !== undefined
                  ? `${inspection.gas_ch4_percent.toFixed(2)} %`
                  : "--"}
              </div>
              <div
                className={cn(
                  "text-[10px] mt-0.5 flex items-center gap-1",
                  isCh4Compliant ? "text-emerald-400" : "text-amber-400 font-semibold"
                )}
              >
                {isCh4Compliant ? (
                  <>
                    <ShieldCheck className="w-3 h-3" />
                    Normal Range
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3 h-3" />
                    Trip Threshold
                  </>
                )}
              </div>
            </div>

            {/* CO PPM */}
            <div
              className={cn(
                "p-3 rounded border font-telemetry",
                isCoCompliant
                  ? "bg-surface-container-low border-outline-variant/40"
                  : "bg-amber-500/10 border-amber-500/50 text-amber-300"
              )}
            >
              <div className="flex items-center justify-between text-outline text-[11px]">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  CO Gas
                </span>
                <span className="text-[10px]">Max 10 ppm</span>
              </div>
              <div className="mt-1 text-lg font-bold text-on-surface">
                {inspection.gas_co_ppm !== undefined
                  ? `${inspection.gas_co_ppm.toFixed(1)} ppm`
                  : "--"}
              </div>
              <div
                className={cn(
                  "text-[10px] mt-0.5 flex items-center gap-1",
                  isCoCompliant ? "text-emerald-400" : "text-amber-400 font-semibold"
                )}
              >
                {isCoCompliant ? (
                  <>
                    <ShieldCheck className="w-3 h-3" />
                    Zero Heating
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3 h-3" />
                    Spontaneous Check
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Qualitative Strata Remarks */}
        <div className="space-y-1.5">
          <h4 className="text-xs font-semibold text-on-surface uppercase tracking-wider font-telemetry">
            Strata Control & Side Support Remarks
          </h4>
          <div className="p-3 rounded bg-surface-container-lowest border border-outline-variant/40 text-xs text-on-surface-variant leading-relaxed font-sans">
            {inspection.strata_remarks || "No qualitative strata control remarks entered."}
          </div>
        </div>

        {/* Evidence Photo Lightbox Gallery */}
        <div className="pt-2">
          <EvidenceGallery
            evidenceUrls={inspection.evidence_urls}
            inspectionId={inspection.id}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default InspectionDetailDrawer;
