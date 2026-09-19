import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Activity,
} from "lucide-react";
import { RemediationKanban } from "../components/remediation-kanban";
import { fetchViolations } from "../services/governance-api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const RemediationPage: React.FC = () => {
  const { data: violations = [] } = useQuery({
    queryKey: ["governance-violations"],
    queryFn: () => fetchViolations(),
  });

  // Calculate live statutory metrics
  const metrics = useMemo(() => {
    const total = violations.length;
    const now = Date.now();
    const active = violations.filter((v) => v.status !== "STATUTORY_CLOSEOUT").length;
    const breached = violations.filter(
      (v) =>
        v.status !== "STATUTORY_CLOSEOUT" &&
        new Date(v.deadline_sla).getTime() <= now
    ).length;
    const inRemediation = violations.filter(
      (v) => v.status === "NOTICE_SERVED" || v.status === "ACTION_TAKEN"
    ).length;
    const closed = violations.filter((v) => v.status === "STATUTORY_CLOSEOUT").length;

    return { total, active, breached, inRemediation, closed };
  }, [violations]);

  return (
    <div className="flex flex-col min-h-full p-4 lg:p-6 space-y-6">
      {/* Statutory Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/40 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="identity" className="font-telemetry text-[11px]">
              CMR 2017 REG. 182
            </Badge>
            <span className="text-xs font-telemetry text-outline uppercase tracking-wider">
              Mines Act 1952 Mandatory Lifecycle
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-on-surface flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-primary" />
            Statutory Violation Remediation Kanban
          </h1>
          <p className="text-xs md:text-sm text-on-surface-variant mt-0.5">
            Underground safety ticket tracking with real-time SLA countdown timers and immutable non-repudiation audit anchors.
          </p>
        </div>

        {/* DGMS Compliance Seal Badge */}
        <div className="flex items-center gap-3 bg-surface-container-low px-3.5 py-2 rounded border border-outline-variant/50">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <div className="flex flex-col text-xs font-telemetry">
            <span className="text-[10px] text-outline uppercase tracking-wide">
              Statutory Engine
            </span>
            <span className="font-semibold text-emerald-400">
              State Machine Active
            </span>
          </div>
        </div>
      </div>

      {/* KPI Telemetry Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Active Tickets */}
        <Card className="bg-surface-container border-outline-variant/40 shadow-sm">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-telemetry text-outline uppercase tracking-wider block">
                Active Infractions
              </span>
              <span className="text-2xl font-bold font-telemetry text-on-surface mt-1 block">
                {metrics.active}
              </span>
              <span className="text-[10px] text-outline block mt-0.5">
                Across all underground zones
              </span>
            </div>
            <div className="w-9 h-9 rounded bg-surface-container-high flex items-center justify-center border border-outline-variant/40">
              <Activity className="w-5 h-5 text-primary" />
            </div>
          </CardContent>
        </Card>

        {/* SLA Breaches */}
        <Card
          className={cn(
            "bg-surface-container border-outline-variant/40 shadow-sm transition-all",
            metrics.breached > 0 &&
              "border-rose-500/60 bg-rose-500/[0.04] shadow-[0_0_12px_rgba(244,63,94,0.15)]"
          )}
        >
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-telemetry text-rose-400 font-medium uppercase tracking-wider block">
                SLA Breached (Critical)
              </span>
              <span
                className={cn(
                  "text-2xl font-bold font-telemetry mt-1 block",
                  metrics.breached > 0 ? "text-rose-400 animate-pulse" : "text-on-surface"
                )}
              >
                {metrics.breached}
              </span>
              <span className="text-[10px] text-outline block mt-0.5">
                Overdue statutory response
              </span>
            </div>
            <div
              className={cn(
                "w-9 h-9 rounded flex items-center justify-center border",
                metrics.breached > 0
                  ? "bg-rose-500/20 border-rose-500/50"
                  : "bg-surface-container-high border-outline-variant/40"
              )}
            >
              <AlertTriangle
                className={cn(
                  "w-5 h-5",
                  metrics.breached > 0 ? "text-rose-400" : "text-outline"
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* In-Remediation */}
        <Card className="bg-surface-container border-outline-variant/40 shadow-sm">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-telemetry text-amber-400 uppercase tracking-wider block">
                In Remediation
              </span>
              <span className="text-2xl font-bold font-telemetry text-amber-400 mt-1 block">
                {metrics.inRemediation}
              </span>
              <span className="text-[10px] text-outline block mt-0.5">
                Notice served or action logged
              </span>
            </div>
            <div className="w-9 h-9 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
          </CardContent>
        </Card>

        {/* Closed Out */}
        <Card className="bg-surface-container border-outline-variant/40 shadow-sm">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-telemetry text-emerald-400 uppercase tracking-wider block">
                Statutory Closeout
              </span>
              <span className="text-2xl font-bold font-telemetry text-emerald-400 mt-1 block">
                {metrics.closed}
              </span>
              <span className="text-[10px] text-outline block mt-0.5">
                Verified and ledger anchored
              </span>
            </div>
            <div className="w-9 h-9 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Kanban Board Component */}
      <div className="flex-1">
        <RemediationKanban />
      </div>
    </div>
  );
};

export default RemediationPage;
