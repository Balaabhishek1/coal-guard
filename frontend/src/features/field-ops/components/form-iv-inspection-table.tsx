import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  RefreshCw,
  Camera,
  AlertTriangle,
  ChevronRight,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NfcTagBadge } from "./nfc-tag-badge";
import { fetchFormIVInspections } from "../services/field-ops-api";
import { formatStatutoryDateTime, cn } from "@/lib/utils";
import type { FormIVInspection } from "@/types/field-ops";

interface FormIVInspectionTableProps {
  onSelectInspection: (inspection: FormIVInspection) => void;
  selectedId?: string;
  className?: string;
}

export const FormIVInspectionTable: React.FC<FormIVInspectionTableProps> = ({
  onSelectInspection,
  selectedId,
  className,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [anomalyOnly, setAnomalyOnly] = useState(false);

  const {
    data: inspections = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["form-iv-inspections"],
    queryFn: () => fetchFormIVInspections(),
    refetchInterval: 15000,
  });

  // Filter inspections
  const filteredInspections = useMemo(() => {
    return inspections.filter((item) => {
      // Check for statutory anomalies
      const hasTorqueAnomaly =
        item.roof_bolt_torque_nm !== undefined && item.roof_bolt_torque_nm < 100;
      const hasAirAnomaly =
        item.air_velocity_m_per_min !== undefined && item.air_velocity_m_per_min < 30;
      const hasGasAnomaly =
        (item.gas_ch4_percent !== undefined && item.gas_ch4_percent >= 0.75) ||
        (item.gas_co_ppm !== undefined && item.gas_co_ppm >= 10);
      const isAnomaly = hasTorqueAnomaly || hasAirAnomaly || hasGasAnomaly;

      if (anomalyOnly && !isAnomaly) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesLoc = (item.location_name || item.location_id).toLowerCase().includes(q);
        const matchesInsp = (item.inspector_name || item.inspector_id).toLowerCase().includes(q);
        const matchesRemarks = item.strata_remarks?.toLowerCase().includes(q) ?? false;
        const matchesId = item.id.toLowerCase().includes(q);

        return matchesLoc || matchesInsp || matchesRemarks || matchesId;
      }

      return true;
    });
  }, [inspections, anomalyOnly, searchQuery]);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Top Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-surface-container-low p-2.5 rounded border border-outline-variant/40">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search Box */}
          <div className="relative w-64 md:w-80">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-outline" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search underground face, inspector, strata notes..."
              className="w-full h-8 pl-8 pr-3 rounded bg-surface-container-lowest border border-outline-variant/60 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-primary font-sans"
            />
          </div>

          {/* Anomaly Only Filter Toggle */}
          <button
            onClick={() => setAnomalyOnly(!anomalyOnly)}
            className={cn(
              "h-8 px-2.5 rounded border text-xs font-telemetry flex items-center gap-1.5 transition-colors",
              anomalyOnly
                ? "bg-rose-500/15 border-rose-500/50 text-rose-400 font-semibold"
                : "bg-surface-container-lowest border-outline-variant/60 text-on-surface-variant hover:text-on-surface"
            )}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Anomalies Only</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-outline font-telemetry">
            Showing {filteredInspections.length} of {inspections.length} diaries
          </span>

          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            className="h-8 text-xs gap-1.5 border-outline-variant"
          >
            <RefreshCw
              className={cn("w-3.5 h-3.5", (isLoading || isRefetching) && "animate-spin")}
            />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* High-Density Form IV Table */}
      <div className="rounded border border-outline-variant/40 overflow-hidden bg-surface-container-lowest shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/40 text-on-surface-variant text-[11px] font-telemetry uppercase tracking-wider">
                <th className="py-2.5 px-3">Time (IST)</th>
                <th className="py-2.5 px-3">Working Face / Seam</th>
                <th className="py-2.5 px-3">Statutory Inspector</th>
                <th className="py-2.5 px-3 text-right">Torque (Nm)</th>
                <th className="py-2.5 px-3 text-right">Air (m/min)</th>
                <th className="py-2.5 px-3 text-right">CH4 (%)</th>
                <th className="py-2.5 px-3 text-right">CO (ppm)</th>
                <th className="py-2.5 px-3 text-center">NFC Geotag</th>
                <th className="py-2.5 px-3 text-center">Photos</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 font-telemetry">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-outline">
                    Loading statutory Form IV shift diaries...
                  </td>
                </tr>
              ) : filteredInspections.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-outline">
                    No matching Form IV field inspections found.
                  </td>
                </tr>
              ) : (
                filteredInspections.map((item) => {
                  const isSelected = selectedId === item.id;
                  const torqueLow =
                    item.roof_bolt_torque_nm !== undefined && item.roof_bolt_torque_nm < 100;
                  const airLow =
                    item.air_velocity_m_per_min !== undefined &&
                    item.air_velocity_m_per_min < 30;
                  const ch4High =
                    item.gas_ch4_percent !== undefined && item.gas_ch4_percent >= 0.75;
                  const coHigh = item.gas_co_ppm !== undefined && item.gas_co_ppm >= 10;
                  const hasPhotos = Boolean(item.evidence_urls && item.evidence_urls.length > 0);

                  return (
                    <tr
                      key={item.id}
                      onClick={() => onSelectInspection(item)}
                      className={cn(
                        "cursor-pointer hover:bg-surface-container-high/40 transition-colors",
                        isSelected && "bg-surface-container-high/50 border-l-2 border-primary"
                      )}
                    >
                      {/* Timestamp */}
                      <td className="py-2.5 px-3 text-on-surface whitespace-nowrap">
                        {formatStatutoryDateTime(item.inspection_time)}
                      </td>

                      {/* Location */}
                      <td className="py-2.5 px-3 font-sans font-medium text-on-surface">
                        <div className="flex items-center gap-1.5 truncate max-w-[190px]">
                          <MapPin className="w-3 h-3 text-outline shrink-0" />
                          <span className="truncate">
                            {item.location_name || item.location_id}
                          </span>
                        </div>
                      </td>

                      {/* Inspector */}
                      <td className="py-2.5 px-3 text-on-surface-variant font-sans">
                        <span className="truncate max-w-[150px] block">
                          {item.inspector_name || item.inspector_id}
                        </span>
                      </td>

                      {/* Torque */}
                      <td className="py-2.5 px-3 text-right">
                        {item.roof_bolt_torque_nm !== undefined ? (
                          <span
                            className={cn(
                              "font-bold",
                              torqueLow
                                ? "text-rose-400 underline decoration-rose-500 decoration-dotted"
                                : "text-on-surface"
                            )}
                            title={torqueLow ? "Below statutory minimum of 100 Nm" : "Compliant"}
                          >
                            {item.roof_bolt_torque_nm.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-outline">--</span>
                        )}
                      </td>

                      {/* Air Velocity */}
                      <td className="py-2.5 px-3 text-right">
                        {item.air_velocity_m_per_min !== undefined ? (
                          <span
                            className={cn(
                              "font-bold",
                              airLow
                                ? "text-rose-400 underline decoration-rose-500 decoration-dotted"
                                : "text-on-surface"
                            )}
                            title={airLow ? "Stagnation hazard: Below 30 m/min" : "Adequate airflow"}
                          >
                            {item.air_velocity_m_per_min.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-outline">--</span>
                        )}
                      </td>

                      {/* CH4 */}
                      <td className="py-2.5 px-3 text-right">
                        {item.gas_ch4_percent !== undefined ? (
                          <span
                            className={cn(
                              "font-medium",
                              ch4High ? "text-amber-400 font-bold" : "text-on-surface-variant"
                            )}
                          >
                            {item.gas_ch4_percent.toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-outline">--</span>
                        )}
                      </td>

                      {/* CO */}
                      <td className="py-2.5 px-3 text-right">
                        {item.gas_co_ppm !== undefined ? (
                          <span
                            className={cn(
                              "font-medium",
                              coHigh ? "text-amber-400 font-bold" : "text-on-surface-variant"
                            )}
                          >
                            {item.gas_co_ppm.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-outline">--</span>
                        )}
                      </td>

                      {/* NFC Tag */}
                      <td className="py-2.5 px-3 text-center">
                        <NfcTagBadge isGeotagged={item.is_geotagged_nfc} compact />
                      </td>

                      {/* Photos */}
                      <td className="py-2.5 px-3 text-center">
                        {hasPhotos ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-primary">
                            <Camera className="w-3 h-3" />
                            <span>{item.evidence_urls!.length}</span>
                          </span>
                        ) : (
                          <span className="text-outline text-[11px]">0</span>
                        )}
                      </td>

                      {/* Inspect button */}
                      <td className="py-2.5 px-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-[11px] text-primary hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectInspection(item);
                          }}
                        >
                          <span>Inspect</span>
                          <ChevronRight className="w-3 h-3 ml-0.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FormIVInspectionTable;
