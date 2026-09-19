import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Search,
  ArrowRight,
  FileCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchAuditLedger } from "../services/governance-api";
import { formatStatutoryDateTime, truncateHash, cn } from "@/lib/utils";

interface AuditLedgerTableProps {
  className?: string;
}

export const AuditLedgerTable: React.FC<AuditLedgerTableProps> = ({ className }) => {
  const [page, setPage] = useState(1);
  const limit = 20;
  const [expandedSeqId, setExpandedSeqId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedActionType, setSelectedActionType] = useState<string>("ALL");
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const {
    data: entries = [],
    isLoading,
  } = useQuery({
    queryKey: ["governance-audit-ledger", page, limit],
    queryFn: () => fetchAuditLedger(page, limit),
    refetchInterval: 15000,
  });

  const handleCopyHash = (hash: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const toggleExpand = (seqId: number) => {
    setExpandedSeqId(expandedSeqId === seqId ? null : seqId);
  };

  // Distinct action types
  const actionTypes = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => set.add(e.action_type));
    return ["ALL", ...Array.from(set)];
  }, [entries]);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return entries.filter((item) => {
      if (selectedActionType !== "ALL" && item.action_type !== selectedActionType) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSeq = item.seq_id.toString().includes(query);
        const matchesAction = item.action_type.toLowerCase().includes(query);
        const matchesActor = item.actor_id?.toLowerCase().includes(query) ?? false;
        const matchesHash =
          item.current_hash.toLowerCase().includes(query) ||
          item.previous_hash.toLowerCase().includes(query);
        const matchesPayload = JSON.stringify(item.payload).toLowerCase().includes(query);

        return matchesSeq || matchesAction || matchesActor || matchesHash || matchesPayload;
      }
      return true;
    });
  }, [entries, selectedActionType, searchQuery]);

  const renderActionBadge = (action: string) => {
    switch (action) {
      case "STATUTORY_CLOSEOUT":
        return (
          <Badge
            variant="default"
            className="border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-telemetry text-[10px]"
          >
            CLOSEOUT
          </Badge>
        );
      case "STATUS_TRANSITION":
        return (
          <Badge
            variant="default"
            className="border-sky-500/40 bg-sky-500/10 text-sky-300 font-telemetry text-[10px]"
          >
            TRANSITION
          </Badge>
        );
      case "VIOLATION_DETECTED":
        return (
          <Badge
            variant="warning"
            className="font-telemetry text-[10px]"
          >
            DETECTED
          </Badge>
        );
      case "GATE_OVERRIDE":
        return (
          <Badge
            variant="critical"
            className="font-telemetry text-[10px]"
          >
            OVERRIDE
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="font-telemetry text-[10px]"
          >
            {action}
          </Badge>
        );
    }
  };

  return (
    <div className={cn("flex flex-col space-y-3", className)}>
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-surface-container-low p-2.5 rounded border border-outline-variant/40">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          <div className="relative w-60">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-outline" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search blocks, hashes, actors..."
              className="w-full h-8 pl-8 pr-3 rounded bg-surface-container-lowest border border-outline-variant/60 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-primary font-sans"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-outline font-telemetry">Action:</span>
            <select
              value={selectedActionType}
              onChange={(e) => setSelectedActionType(e.target.value)}
              className="h-8 rounded bg-surface-container-lowest border border-outline-variant/60 px-2 text-xs text-on-surface font-telemetry focus:outline-none focus:border-primary"
            >
              {actionTypes.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-outline font-telemetry">
          <span>
            Displaying {filteredEntries.length} of {entries.length} blocks
          </span>
        </div>
      </div>

      {/* High-Density Ledger Table */}
      <div className="rounded border border-outline-variant/40 overflow-hidden bg-surface-container-lowest">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/40 text-on-surface-variant text-[11px] font-telemetry uppercase tracking-wider">
                <th className="py-2.5 px-3 w-10"></th>
                <th className="py-2.5 px-3">Block / Seq</th>
                <th className="py-2.5 px-3">Timestamp (IST)</th>
                <th className="py-2.5 px-3">Actor Identity</th>
                <th className="py-2.5 px-3">Action Type</th>
                <th className="py-2.5 px-3">Hash Linkage (Prev &rarr; Current)</th>
                <th className="py-2.5 px-3 text-right">Raw Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 font-telemetry">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-outline">
                    Loading cryptographic ledger blocks...
                  </td>
                </tr>
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-outline">
                    No matching cryptographic audit entries found.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => {
                  const isExpanded = expandedSeqId === entry.seq_id;
                  const isGenesis =
                    entry.previous_hash ===
                    "0000000000000000000000000000000000000000000000000000000000000000";

                  return (
                    <React.Fragment key={entry.seq_id}>
                      <tr
                        onClick={() => toggleExpand(entry.seq_id)}
                        className={cn(
                          "cursor-pointer hover:bg-surface-container-high/40 transition-colors",
                          isExpanded && "bg-surface-container-high/30"
                        )}
                      >
                        {/* Expand Chevron */}
                        <td className="py-2.5 px-3 text-center text-outline">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-primary" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-outline" />
                          )}
                        </td>

                        {/* Seq ID */}
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-on-surface">
                            #{entry.seq_id.toString().padStart(6, "0")}
                          </span>
                        </td>

                        {/* Timestamp */}
                        <td className="py-2.5 px-3 text-on-surface-variant whitespace-nowrap">
                          {formatStatutoryDateTime(entry.timestamp)}
                        </td>

                        {/* Actor */}
                        <td className="py-2.5 px-3 text-on-surface">
                          <span className="text-[11px] px-1.5 py-0.5 rounded bg-surface-container border border-outline-variant/40">
                            {entry.actor_id || "SYSTEM_DAEMON"}
                          </span>
                        </td>

                        {/* Action Type */}
                        <td className="py-2.5 px-3">
                          {renderActionBadge(entry.action_type)}
                        </td>

                        {/* Hash Flow */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5 text-[11px]">
                            {/* Prev Hash */}
                            <span
                              className={cn(
                                "px-1.5 py-0.5 rounded border text-[10px]",
                                isGenesis
                                  ? "border-amber-500/40 text-amber-400 bg-amber-500/10"
                                  : "border-outline-variant/50 text-outline bg-surface-container-high"
                              )}
                              title={entry.previous_hash}
                            >
                              {isGenesis ? "GENESIS" : truncateHash(entry.previous_hash, 5, 4)}
                            </span>

                            <ArrowRight className="w-3 h-3 text-outline shrink-0" />

                            {/* Current Hash */}
                            <span
                              className="px-1.5 py-0.5 rounded border border-primary/30 text-primary bg-primary/10 text-[10px] flex items-center gap-1"
                              title={entry.current_hash}
                            >
                              <span>{truncateHash(entry.current_hash, 6, 4)}</span>
                              <button
                                onClick={(e) => handleCopyHash(entry.current_hash, e)}
                                className="p-0.5 hover:text-white transition-colors"
                                title="Copy Full SHA-256 Hash"
                              >
                                {copiedHash === entry.current_hash ? (
                                  <Check className="w-2.5 h-2.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-2.5 h-2.5" />
                                )}
                              </button>
                            </span>
                          </div>
                        </td>

                        {/* Payload inspect trigger */}
                        <td className="py-2.5 px-3 text-right">
                          <span className="text-[10px] text-primary hover:underline font-telemetry">
                            {isExpanded ? "Hide JSON" : "Inspect Payload"}
                          </span>
                        </td>
                      </tr>

                      {/* Expanded Drawer: Raw JSON Payload */}
                      {isExpanded && (
                        <tr className="bg-surface-container-lowest border-y border-outline-variant/30">
                          <td colSpan={7} className="p-4">
                            <div className="rounded bg-surface-container-lowest border border-outline-variant/50 p-3 space-y-2">
                              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
                                <div className="flex items-center gap-2 text-xs text-primary font-semibold">
                                  <FileCode className="w-4 h-4" />
                                  <span>
                                    Statutory Payload Record (Block #{entry.seq_id})
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 text-[10px] text-outline font-telemetry">
                                  <span>Prev: {entry.previous_hash}</span>
                                  <span>Curr: {entry.current_hash}</span>
                                </div>
                              </div>

                              <pre className="text-[11px] font-mono p-2.5 bg-black/40 rounded text-emerald-300 overflow-x-auto leading-relaxed border border-outline-variant/30">
                                {JSON.stringify(entry.payload, null, 2)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-2.5 bg-surface-container-low border-t border-outline-variant/40 flex items-center justify-between text-xs font-telemetry">
          <span className="text-outline text-[11px]">
            Page {page} &bull; 20 items per page
          </span>

          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-7 px-2.5 text-xs border-outline-variant"
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => p + 1)}
              disabled={entries.length < limit}
              className="h-7 px-2.5 text-xs border-outline-variant"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLedgerTable;
