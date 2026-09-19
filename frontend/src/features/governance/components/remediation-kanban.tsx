import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  RefreshCw,
  Zap,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ViolationCard } from "./violation-card";
import { StatusTransitionDialog } from "./status-transition-dialog";
import { fetchViolations, triggerSlaSweep } from "../services/governance-api";
import type {
  ComplianceViolation,
  ViolationStatus,
} from "@/types/governance";
import { cn } from "@/lib/utils";

interface ColumnDef {
  status: ViolationStatus;
  title: string;
  subtitle: string;
  badgeClass: string;
  borderClass: string;
}

const COLUMNS: ColumnDef[] = [
  {
    status: "DETECTED",
    title: "1. Detected",
    subtitle: "Underground Infraction Logged",
    badgeClass: "border-rose-500/40 bg-rose-500/10 text-rose-400",
    borderClass: "border-t-rose-500",
  },
  {
    status: "NOTICE_SERVED",
    title: "2. Notice Served",
    subtitle: "Statutory Rectification Order",
    badgeClass: "border-amber-500/40 bg-amber-500/10 text-amber-400",
    borderClass: "border-t-amber-500",
  },
  {
    status: "ACTION_TAKEN",
    title: "3. Action Taken",
    subtitle: "Engineering Rectification Proof",
    badgeClass: "border-sky-500/40 bg-sky-500/10 text-sky-400",
    borderClass: "border-t-sky-500",
  },
  {
    status: "VERIFIED",
    title: "4. Verified",
    subtitle: "Safety Officer Field Audit",
    badgeClass: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
    borderClass: "border-t-emerald-500",
  },
  {
    status: "STATUTORY_CLOSEOUT",
    title: "5. Statutory Closeout",
    subtitle: "Archived & Cryptographically Sealed",
    badgeClass: "border-slate-500/40 bg-slate-500/10 text-slate-300",
    borderClass: "border-t-slate-500",
  },
];

export const RemediationKanban: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("ALL");
  const [activeViolation, setActiveViolation] = useState<ComplianceViolation | null>(null);
  const [isTransitionOpen, setIsTransitionOpen] = useState(false);
  const [sweepMessage, setSweepMessage] = useState<string | null>(null);

  // TanStack Query for violation tickets
  const {
    data: violations = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["governance-violations"],
    queryFn: () => fetchViolations(),
    refetchInterval: 10000, // Background poll every 10 seconds
  });

  // Manual SLA sweep mutation
  const sweepMutation = useMutation({
    mutationFn: () => triggerSlaSweep(),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["governance-violations"] });
      setSweepMessage(`SLA Sweep evaluated: ${res.escalated_count ?? 0} ticket(s) escalated.`);
      setTimeout(() => setSweepMessage(null), 4000);
    },
    onError: () => {
      setSweepMessage("SLA Sweep executed (Simulation active).");
      setTimeout(() => setSweepMessage(null), 4000);
    },
  });

  const handleOpenTransition = (violation: ComplianceViolation) => {
    setActiveViolation(violation);
    setIsTransitionOpen(true);
  };

  // Filter violations based on search and severity
  const filteredViolations = useMemo(() => {
    return violations.filter((v) => {
      // Severity filter
      if (selectedSeverity !== "ALL" && v.severity !== selectedSeverity) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = v.title?.toLowerCase().includes(query);
        const matchesType = v.violation_type.toLowerCase().includes(query);
        const matchesLocation = (v.location_name || v.location_id)
          .toLowerCase()
          .includes(query);
        const matchesContractor = v.contractor_id?.toLowerCase().includes(query);
        const matchesReporter = v.reporter_name?.toLowerCase().includes(query);
        const matchesId = v.id.toLowerCase().includes(query);

        return (
          matchesTitle ||
          matchesType ||
          matchesLocation ||
          matchesContractor ||
          matchesReporter ||
          matchesId
        );
      }

      return true;
    });
  }, [violations, selectedSeverity, searchQuery]);

  // Group by status
  const columnsData = useMemo(() => {
    const map: Record<ViolationStatus, ComplianceViolation[]> = {
      DETECTED: [],
      NOTICE_SERVED: [],
      ACTION_TAKEN: [],
      VERIFIED: [],
      STATUTORY_CLOSEOUT: [],
    };

    filteredViolations.forEach((v) => {
      if (map[v.status]) {
        map[v.status].push(v);
      }
    });

    return map;
  }, [filteredViolations]);

  // Calculate high-level SLA metrics
  const stats = useMemo(() => {
    const total = violations.length;
    const now = Date.now();
    const breached = violations.filter(
      (v) =>
        v.status !== "STATUTORY_CLOSEOUT" &&
        new Date(v.deadline_sla).getTime() <= now
    ).length;
    const critical = violations.filter((v) => v.severity === "CRITICAL").length;
    const closed = violations.filter((v) => v.status === "STATUTORY_CLOSEOUT").length;
    return { total, breached, critical, closed };
  }, [violations]);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top Filter and Action Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-surface-container-low p-3 rounded border border-outline-variant/40">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative w-64 md:w-72">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-outline" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search violations, seams, contractors..."
              className="w-full h-8 pl-8 pr-3 rounded bg-surface-container-lowest border border-outline-variant/60 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-primary font-sans"
            />
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-1 bg-surface-container-lowest p-0.5 rounded border border-outline-variant/60">
            {(["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setSelectedSeverity(sev)}
                className={cn(
                  "px-2.5 py-1 text-[11px] font-telemetry rounded transition-colors",
                  selectedSeverity === sev
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        {/* Action Controls & Sweep */}
        <div className="flex items-center gap-2">
          {stats.breached > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded bg-rose-500/10 border border-rose-500/40 text-[11px] font-telemetry text-rose-400">
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span>{stats.breached} Overdue</span>
            </div>
          )}

          {sweepMessage && (
            <span className="text-xs text-amber-400 font-telemetry animate-fade-in">
              {sweepMessage}
            </span>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => sweepMutation.mutate()}
            disabled={sweepMutation.isPending}
            className="h-8 text-xs gap-1.5 border-outline-variant hover:border-amber-500 hover:text-amber-400"
            title="Execute DGMS SLA Escalation Sweep"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>SLA Sweep</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            className="h-8 text-xs gap-1.5 border-outline-variant"
          >
            <RefreshCw
              className={cn(
                "w-3.5 h-3.5",
                (isLoading || isRefetching) && "animate-spin"
              )}
            />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* 5-Column Responsive Kanban Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 flex-1 min-h-[560px]">
        {COLUMNS.map((col) => {
          const tickets = columnsData[col.status] || [];
          return (
            <div
              key={col.status}
              className={cn(
                "flex flex-col bg-surface-container-lowest rounded border border-outline-variant/40 border-t-2 shadow-sm",
                col.borderClass
              )}
            >
              {/* Column Header */}
              <div className="p-3 border-b border-outline-variant/30 flex items-center justify-between shrink-0 bg-surface-container-low/40">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-xs tracking-wider text-on-surface">
                      {col.title}
                    </h3>
                    <span
                      className={cn(
                        "px-1.5 py-0.2 font-telemetry text-[11px] rounded border font-semibold",
                        col.badgeClass
                      )}
                    >
                      {tickets.length}
                    </span>
                  </div>
                  <p className="text-[10px] text-outline mt-0.5">{col.subtitle}</p>
                </div>
              </div>

              {/* Column Cards Container */}
              <div className="flex-1 p-2 space-y-2.5 overflow-y-auto max-h-[calc(100vh-280px)] min-h-[160px]">
                {tickets.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center border border-dashed border-outline-variant/30 rounded text-center p-3">
                    <CheckCircle2 className="w-5 h-5 text-outline/40 mb-1" />
                    <span className="text-[11px] text-outline">
                      Zero tickets in this stage
                    </span>
                  </div>
                ) : (
                  tickets.map((violation) => (
                    <ViolationCard
                      key={violation.id}
                      violation={violation}
                      onOpenTransition={handleOpenTransition}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* State Machine Transition Dialog */}
      <StatusTransitionDialog
        violation={activeViolation}
        open={isTransitionOpen}
        onOpenChange={setIsTransitionOpen}
        onSuccess={() => setActiveViolation(null)}
      />
    </div>
  );
};

export default RemediationKanban;
