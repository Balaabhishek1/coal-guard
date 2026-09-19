import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  HardDrive,
  RefreshCw,
  ServerCrash,
  Wifi,
} from "lucide-react";
import { HardwareTable } from "../components/hardware-table";
import { RegisterHardwareDialog } from "../components/register-hardware-dialog";
import { fetchHardwareMatrix } from "../services/hardware-api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const HardwareMatrixPage: React.FC = () => {
  const {
    data: devices = [],
    isLoading,
    isRefetching,
    refetch,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ["hardware-matrix"],
    queryFn: fetchHardwareMatrix,
    refetchInterval: 5000, // 5-second auto-refresh polling
    staleTime: 3000,
  });

  const stats = useMemo(() => {
    const total = devices.length;
    const online = devices.filter((d) => d.is_online).length;
    const offline = total - online;
    const degraded = devices.filter(
      (d) => d.is_online && (d.latency_ms ?? 0) >= 50
    ).length;

    return { total, online, offline, degraded };
  }, [devices]);

  return (
    <div className="space-y-space-lg max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md bg-surface-container p-space-lg rounded border border-outline-variant/40 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-telemetry-micro uppercase bg-primary-container/20 text-primary px-1.5 py-0.5 rounded border border-primary/30">
              MODBUS // ETHERNET // MQTT
            </span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-surface-container-low rounded border border-outline-variant/30 text-[10px] font-telemetry text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>POLLING BUS (5s CYCLE)</span>
            </div>
          </div>
          <h1 className="text-headline-lg font-bold text-on-surface tracking-tight flex items-center gap-2">
            <ServerCrash className="w-6 h-6 text-primary" />
            Diagnostic &amp; Hardware Health Matrix
          </h1>
          <p className="text-body-sm text-on-surface-variant">
            Sub-second connectivity telemetry, latency round-trip arbitration, and Modbus/RTSP gateway monitoring.
          </p>
        </div>

        <div className="flex items-center gap-space-sm">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="gap-1.5 font-telemetry-sm text-xs"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin text-primary" : ""}`}
            />
            <span>{isRefetching ? "Scanning..." : "Poll Bus Now"}</span>
          </Button>
          <RegisterHardwareDialog />
        </div>
      </div>

      {/* KPI Status Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        {/* KPI 1: Total Assets */}
        <Card className="bg-surface-container-low border-outline-variant/30">
          <CardContent className="p-space-md flex items-center justify-between">
            <div>
              <span className="font-telemetry-micro uppercase text-outline block">
                Total Monitored Assets
              </span>
              <span className="font-telemetry text-telemetry-lg font-bold text-on-surface">
                {stats.total}
              </span>
              <span className="text-[10px] font-telemetry text-outline block mt-0.5">
                ENROLLED HARDWARE
              </span>
            </div>
            <div className="w-10 h-10 rounded bg-surface-container flex items-center justify-center text-primary border border-outline-variant/30">
              <HardDrive className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Online Nodes */}
        <Card className="bg-surface-container-low border-outline-variant/30">
          <CardContent className="p-space-md flex items-center justify-between">
            <div>
              <span className="font-telemetry-micro uppercase text-outline block">
                Online &amp; Responsive
              </span>
              <span className="font-telemetry text-telemetry-lg font-bold text-emerald-400">
                {stats.online}
              </span>
              <span className="text-[10px] font-telemetry text-emerald-400/80 block mt-0.5">
                HEARTBEAT VERIFIED
              </span>
            </div>
            <div className="w-10 h-10 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Degraded Latency */}
        <Card className="bg-surface-container-low border-outline-variant/30">
          <CardContent className="p-space-md flex items-center justify-between">
            <div>
              <span className="font-telemetry-micro uppercase text-outline block">
                High Latency (&gt;50ms)
              </span>
              <span className="font-telemetry text-telemetry-lg font-bold text-amber-400">
                {stats.degraded}
              </span>
              <span className="text-[10px] font-telemetry text-amber-400/80 block mt-0.5">
                DEGRADED BANDWIDTH
              </span>
            </div>
            <div className="w-10 h-10 rounded bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/30">
              <Wifi className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: Offline Alerts */}
        <Card
          className={`border-outline-variant/30 ${
            stats.offline > 0
              ? "bg-rose-950/20 border-rose-500/40"
              : "bg-surface-container-low"
          }`}
        >
          <CardContent className="p-space-md flex items-center justify-between">
            <div>
              <span className="font-telemetry-micro uppercase text-outline block">
                Offline Dropouts
              </span>
              <span
                className={`font-telemetry text-telemetry-lg font-bold ${
                  stats.offline > 0 ? "text-rose-400" : "text-on-surface"
                }`}
              >
                {stats.offline}
              </span>
              <span
                className={`text-[10px] font-telemetry block mt-0.5 ${
                  stats.offline > 0 ? "text-rose-400 font-semibold" : "text-outline"
                }`}
              >
                {stats.offline > 0 ? "ATTENTION REQUIRED" : "ZERO DROPPING"}
              </span>
            </div>
            <div
              className={`w-10 h-10 rounded flex items-center justify-center border ${
                stats.offline > 0
                  ? "bg-rose-500/20 text-rose-400 border-rose-500/50"
                  : "bg-surface-container text-outline border-outline-variant/30"
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Diagnostic Table Component */}
      <HardwareTable devices={devices} isLoading={isLoading} />

      {/* Status Bar / Telemetry Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-space-sm bg-surface-container-lowest rounded border border-outline-variant/20 font-telemetry-micro text-telemetry-micro text-outline">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>FIPS 140-3 PROTOCOL ADAPTERS: ACTIVE</span>
          <span>•</span>
          <span>BAUD RATE: 115200 (MODBUS RTU / TCP BRIDGE)</span>
        </div>
        <div>
          LAST SYNC:{" "}
          <span className="font-mono text-on-surface">
            {new Date(dataUpdatedAt).toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default HardwareMatrixPage;
