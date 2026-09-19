import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Smartphone,
  CheckCircle2,
  Layers,
  Database,
} from "lucide-react";
import { SyncLogsTable } from "../components/sync-logs-table";
import { fetchSyncLogs } from "../services/field-ops-api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const SyncDashboardPage: React.FC = () => {
  const { data: logs = [] } = useQuery({
    queryKey: ["mobile-sync-logs"],
    queryFn: () => fetchSyncLogs(),
  });

  const stats = useMemo(() => {
    const total = logs.length;
    const successful = logs.filter((l) => l.status === "SUCCESS").length;
    const failed = logs.filter((l) => l.status === "FAILED").length;
    const totalRecords = logs.reduce((acc, l) => acc + l.records_processed, 0);

    const deviceSet = new Set<string>();
    logs.forEach((l) => deviceSet.add(l.device_id));

    const successRate = total > 0 ? Math.round((successful / total) * 100) : 100;

    return { total, successful, failed, totalRecords, activeDevices: deviceSet.size, successRate };
  }, [logs]);

  return (
    <div className="flex flex-col min-h-full p-4 lg:p-6 space-y-6">
      {/* Statutory & Technical Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/40 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="identity" className="font-telemetry text-[11px]">
              OFFLINE SYNC PROTOCOL
            </Badge>
            <span className="text-xs font-telemetry text-outline uppercase tracking-wider">
              Intrinsically Safe Mobile Diagnostics
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-on-surface flex items-center gap-2.5">
            <Smartphone className="w-6 h-6 text-primary" />
            Mobile Field Sync Monitoring Dashboard
          </h1>
          <p className="text-xs md:text-sm text-on-surface-variant mt-0.5">
            Telemetry ingestion logs, idempotency verification, and batch upload status from underground tablets and intrinsically safe handhelds.
          </p>
        </div>

        {/* Sync Gateway Status Chip */}
        <div className="flex items-center gap-3 bg-surface-container-low px-3.5 py-2 rounded border border-outline-variant/50">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <div className="flex flex-col text-xs font-telemetry">
            <span className="text-[10px] text-outline uppercase tracking-wide">
              Sync Ingestion Gateway
            </span>
            <span className="font-semibold text-emerald-400">
              Active // Resumable Ready
            </span>
          </div>
        </div>
      </div>

      {/* KPI Telemetry Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Batches */}
        <Card className="bg-surface-container border-outline-variant/40 shadow-sm">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-telemetry text-outline uppercase tracking-wider block">
                Total Sync Batches
              </span>
              <span className="text-2xl font-bold font-telemetry text-on-surface mt-1 block">
                {stats.total}
              </span>
              <span className="text-[10px] text-outline block mt-0.5">
                Idempotent transactions
              </span>
            </div>
            <div className="w-9 h-9 rounded bg-surface-container-high flex items-center justify-center border border-outline-variant/40">
              <Layers className="w-5 h-5 text-primary" />
            </div>
          </CardContent>
        </Card>

        {/* Ingestion Success Rate */}
        <Card className="bg-surface-container border-outline-variant/40 shadow-sm">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-telemetry text-outline uppercase tracking-wider block">
                Sync Success Rate
              </span>
              <span className="text-2xl font-bold font-telemetry text-emerald-400 mt-1 block">
                {stats.successRate}%
              </span>
              <span className="text-[10px] text-outline block mt-0.5">
                {stats.successful} successful / {stats.failed} failed
              </span>
            </div>
            <div className="w-9 h-9 rounded bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
          </CardContent>
        </Card>

        {/* Active Mobile Hardware Devices */}
        <Card className="bg-surface-container border-outline-variant/40 shadow-sm">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-telemetry text-outline uppercase tracking-wider block">
                Mobile Hardware Units
              </span>
              <span className="text-2xl font-bold font-telemetry text-primary mt-1 block">
                {stats.activeDevices}
              </span>
              <span className="text-[10px] text-outline block mt-0.5">
                Intrinsically safe devices
              </span>
            </div>
            <div className="w-9 h-9 rounded bg-primary/10 flex items-center justify-center border border-primary/30">
              <Smartphone className="w-5 h-5 text-primary" />
            </div>
          </CardContent>
        </Card>

        {/* Total Ingested Records */}
        <Card className="bg-surface-container border-outline-variant/40 shadow-sm">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-telemetry text-outline uppercase tracking-wider block">
                Field Records Ingested
              </span>
              <span className="text-2xl font-bold font-telemetry text-amber-400 mt-1 block">
                {stats.totalRecords}
              </span>
              <span className="text-[10px] text-outline block mt-0.5">
                Form IV & strata entries
              </span>
            </div>
            <div className="w-9 h-9 rounded bg-amber-500/10 flex items-center justify-center border border-amber-500/30">
              <Database className="w-5 h-5 text-amber-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Sync Logs Table */}
      <div className="flex-1">
        <SyncLogsTable />
      </div>
    </div>
  );
};

export default SyncDashboardPage;
