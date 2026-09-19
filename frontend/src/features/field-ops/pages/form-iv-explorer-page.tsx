import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  Wind,
  Gauge,
  Radio,
  BookOpen,
} from "lucide-react";
import { FormIVInspectionTable } from "../components/form-iv-inspection-table";
import { InspectionDetailDrawer } from "../components/inspection-detail-drawer";
import { fetchFormIVInspections } from "../services/field-ops-api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { FormIVInspection } from "@/types/field-ops";

export const FormIVExplorerPage: React.FC = () => {
  const [selectedInspection, setSelectedInspection] = useState<FormIVInspection | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { data: inspections = [] } = useQuery({
    queryKey: ["form-iv-inspections"],
    queryFn: () => fetchFormIVInspections(),
  });

  const stats = useMemo(() => {
    const total = inspections.length;
    const torqueAnomalies = inspections.filter(
      (i) => i.roof_bolt_torque_nm !== undefined && i.roof_bolt_torque_nm < 100
    ).length;
    const ventilationAnomalies = inspections.filter(
      (i) => i.air_velocity_m_per_min !== undefined && i.air_velocity_m_per_min < 30
    ).length;
    const nfcVerified = inspections.filter((i) => i.is_geotagged_nfc).length;
    const nfcRatio = total > 0 ? Math.round((nfcVerified / total) * 100) : 0;

    return { total, torqueAnomalies, ventilationAnomalies, nfcVerified, nfcRatio };
  }, [inspections]);

  const handleSelectInspection = (inspection: FormIVInspection) => {
    setSelectedInspection(inspection);
    setIsDrawerOpen(true);
  };

  return (
    <div className="flex flex-col min-h-full p-4 lg:p-6 space-y-6">
      {/* Statutory Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/40 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="identity" className="font-telemetry text-[11px]">
              CMR 2017 REG. 153 &bull; FORM IV
            </Badge>
            <span className="text-xs font-telemetry text-outline uppercase tracking-wider">
              Daily Underground Shift Diary & Strata Audit
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-on-surface flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-primary" />
            Digital CMR 2017 Form IV Inspection Explorer
          </h1>
          <p className="text-xs md:text-sm text-on-surface-variant mt-0.5">
            Underground field audits, roof-bolt torque measurements, ventilation air velocity surveys, and WebP photographic evidence.
          </p>
        </div>

        {/* Form IV Statutory Seal Badge */}
        <div className="flex items-center gap-3 bg-surface-container-low px-3.5 py-2 rounded border border-outline-variant/50">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <div className="flex flex-col text-xs font-telemetry">
            <span className="text-[10px] text-outline uppercase tracking-wide">
              DGMS Journal
            </span>
            <span className="font-semibold text-emerald-400">
              Shift Records Synced
            </span>
          </div>
        </div>
      </div>

      {/* Statutory KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Inspections */}
        <Card className="bg-surface-container border-outline-variant/40 shadow-sm">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-telemetry text-outline uppercase tracking-wider block">
                Shift Diary Entries
              </span>
              <span className="text-2xl font-bold font-telemetry text-on-surface mt-1 block">
                {stats.total}
              </span>
              <span className="text-[10px] text-outline block mt-0.5">
                Current operational cycle
              </span>
            </div>
            <div className="w-9 h-9 rounded bg-surface-container-high flex items-center justify-center border border-outline-variant/40">
              <FileText className="w-5 h-5 text-primary" />
            </div>
          </CardContent>
        </Card>

        {/* Roof Bolt Torque Anomalies */}
        <Card
          className={cn(
            "bg-surface-container border-outline-variant/40 shadow-sm transition-all",
            stats.torqueAnomalies > 0 &&
              "border-rose-500/60 bg-rose-500/[0.04] shadow-[0_0_12px_rgba(244,63,94,0.15)]"
          )}
        >
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-telemetry text-rose-400 uppercase tracking-wider block font-medium">
                Torque Anomalies (&lt; 100 Nm)
              </span>
              <span
                className={cn(
                  "text-2xl font-bold font-telemetry mt-1 block",
                  stats.torqueAnomalies > 0 ? "text-rose-400 animate-pulse" : "text-on-surface"
                )}
              >
                {stats.torqueAnomalies}
              </span>
              <span className="text-[10px] text-outline block mt-0.5">
                Strata support alerts
              </span>
            </div>
            <div
              className={cn(
                "w-9 h-9 rounded flex items-center justify-center border",
                stats.torqueAnomalies > 0
                  ? "bg-rose-500/20 border-rose-500/50 text-rose-400"
                  : "bg-surface-container-high border-outline-variant/40 text-outline"
              )}
            >
              <Gauge className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Ventilation Air Velocity Stagnation */}
        <Card
          className={cn(
            "bg-surface-container border-outline-variant/40 shadow-sm transition-all",
            stats.ventilationAnomalies > 0 &&
              "border-rose-500/60 bg-rose-500/[0.04] shadow-[0_0_12px_rgba(244,63,94,0.15)]"
          )}
        >
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-telemetry text-rose-400 uppercase tracking-wider block font-medium">
                Air Stagnation (&lt; 30 m/min)
              </span>
              <span
                className={cn(
                  "text-2xl font-bold font-telemetry mt-1 block",
                  stats.ventilationAnomalies > 0 ? "text-rose-400 animate-pulse" : "text-on-surface"
                )}
              >
                {stats.ventilationAnomalies}
              </span>
              <span className="text-[10px] text-outline block mt-0.5">
                CMR Reg. 153 infractions
              </span>
            </div>
            <div
              className={cn(
                "w-9 h-9 rounded flex items-center justify-center border",
                stats.ventilationAnomalies > 0
                  ? "bg-rose-500/20 border-rose-500/50 text-rose-400"
                  : "bg-surface-container-high border-outline-variant/40 text-outline"
              )}
            >
              <Wind className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* NFC Geotagged Ratio */}
        <Card className="bg-surface-container border-outline-variant/40 shadow-sm">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-telemetry text-emerald-400 uppercase tracking-wider block">
                NFC Geotagged Ratio
              </span>
              <span className="text-2xl font-bold font-telemetry text-emerald-400 mt-1 block">
                {stats.nfcRatio}%
              </span>
              <span className="text-[10px] text-outline block mt-0.5">
                {stats.nfcVerified} of {stats.total} verified via token
              </span>
            </div>
            <div className="w-9 h-9 rounded bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30">
              <Radio className="w-5 h-5 text-emerald-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Form IV Inspection Table */}
      <div className="flex-1">
        <FormIVInspectionTable
          onSelectInspection={handleSelectInspection}
          selectedId={selectedInspection?.id}
        />
      </div>

      {/* Master-Detail Slide-Over Sheet Drawer */}
      <InspectionDetailDrawer
        inspection={selectedInspection}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      />
    </div>
  );
};

export default FormIVExplorerPage;
