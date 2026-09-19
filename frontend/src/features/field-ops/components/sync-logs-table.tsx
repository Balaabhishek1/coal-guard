import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  RefreshCw,
  Copy,
  Check,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchSyncLogs } from "../services/field-ops-api";
import { formatStatutoryDateTime, truncateHash, cn } from "@/lib/utils";
import type { SyncStatus } from "@/types/field-ops";

interface SyncLogsTableProps {
  className?: string;
}

export const SyncLogsTable: React.FC<SyncLogsTableProps> = ({ className }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const {
    data: logs = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["mobile-sync-logs"],
    queryFn: () => fetchSyncLogs(),
    refetchInterval: 12000,
  });

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (selectedStatus !== "ALL" && log.status !== selectedStatus) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSync = log.sync_id.toLowerCase().includes(q);
        const matchesDevice = log.device_id.toLowerCase().includes(q);
        const matchesUser = log.user_id.toLowerCase().includes(q);

        return matchesSync || matchesDevice || matchesUser;
      }
      return true;
    });
  }, [logs, selectedStatus, searchQuery]);

  const renderStatusBadge = (status: SyncStatus | string) => {
    switch (status) {
      case "SUCCESS":
        return (
          <Badge
            variant="default"
            className="border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-telemetry text-[11px] gap-1"
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>SUCCESS</span>
          </Badge>
        );
      case "PARTIAL":
        return (
          <Badge
            variant="warning"
            className="font-telemetry text-[11px] gap-1"
          >
            <AlertTriangle className="w-3 h-3" />
            <span>PARTIAL</span>
          </Badge>
        );
      case "FAILED":
      default:
        return (
          <Badge
            variant="critical"
            className="font-telemetry text-[11px] gap-1"
          >
            <XCircle className="w-3 h-3" />
            <span>FAILED</span>
          </Badge>
        );
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Search and Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-surface-container-low p-2.5 rounded border border-outline-variant/40">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search Box */}
          <div className="relative w-64 md:w-80">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-outline" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search batch UUID, hardware device ID, user..."
              className="w-full h-8 pl-8 pr-3 rounded bg-surface-container-lowest border border-outline-variant/60 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-primary font-sans"
            />
          </div>

          {/* Status Filter Chips */}
          <div className="flex items-center gap-1 bg-surface-container-lowest p-0.5 rounded border border-outline-variant/60">
            {(["ALL", "SUCCESS", "PARTIAL", "FAILED"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={cn(
                  "px-2.5 py-1 text-[11px] font-telemetry rounded transition-colors",
                  selectedStatus === st
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-outline font-telemetry">
            Showing {filteredLogs.length} of {logs.length} batches
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

      {/* High-Density Sync Logs Table */}
      <div className="rounded border border-outline-variant/40 overflow-hidden bg-surface-container-lowest shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/40 text-on-surface-variant text-[11px] font-telemetry uppercase tracking-wider">
                <th className="py-2.5 px-3">Timestamp (IST)</th>
                <th className="py-2.5 px-3">Sync Batch ID</th>
                <th className="py-2.5 px-3">Mobile Device Hardware ID</th>
                <th className="py-2.5 px-3">Inspector User</th>
                <th className="py-2.5 px-3 text-center">Records Ingested</th>
                <th className="py-2.5 px-3 text-right">Batch Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 font-telemetry">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-outline">
                    Loading mobile sync transactions...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-outline">
                    No matching synchronization batch logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log.sync_id}
                    className="hover:bg-surface-container-high/40 transition-colors"
                  >
                    {/* Timestamp */}
                    <td className="py-2.5 px-3 text-on-surface-variant whitespace-nowrap">
                      {formatStatutoryDateTime(log.timestamp)}
                    </td>

                    {/* Sync ID */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-primary">
                          {truncateHash(log.sync_id, 8, 4)}
                        </span>
                        <button
                          onClick={(e) => handleCopyId(log.sync_id, e)}
                          className="p-0.5 hover:text-white transition-colors text-outline"
                          title="Copy Full UUID"
                        >
                          {copiedId === log.sync_id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Device ID */}
                    <td className="py-2.5 px-3 text-on-surface font-sans">
                      <div className="flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-outline shrink-0" />
                        <span className="truncate max-w-[220px] font-telemetry text-xs">
                          {log.device_id}
                        </span>
                        <button
                          onClick={(e) => handleCopyId(log.device_id, e)}
                          className="p-0.5 hover:text-white transition-colors text-outline"
                          title="Copy Device Identifier"
                        >
                          {copiedId === log.device_id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* User ID */}
                    <td className="py-2.5 px-3 text-on-surface-variant">
                      <span className="px-1.5 py-0.5 rounded bg-surface-container border border-outline-variant/40 text-[11px]">
                        {log.user_id}
                      </span>
                    </td>

                    {/* Records Ingested */}
                    <td className="py-2.5 px-3 text-center">
                      <span className="font-bold text-on-surface">
                        {log.records_processed}
                      </span>
                      <span className="text-[10px] text-outline ml-1">items</span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-2.5 px-3 text-right">
                      {renderStatusBadge(log.status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SyncLogsTable;
