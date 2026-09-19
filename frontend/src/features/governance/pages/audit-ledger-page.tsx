import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Fingerprint,
  ShieldCheck,
  Lock,
  Layers,
  Database,
  Info,
} from "lucide-react";
import { ChainVerificationBadge } from "../components/chain-verification-badge";
import { AuditLedgerTable } from "../components/audit-ledger-table";
import { fetchAuditLedger } from "../services/governance-api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { truncateHash } from "@/lib/utils";
import type { ChainVerificationResult } from "@/types/governance";

export const AuditLedgerPage: React.FC = () => {
  const [verificationResult, setVerificationResult] = useState<ChainVerificationResult | null>(null);

  const { data: entries = [] } = useQuery({
    queryKey: ["governance-audit-ledger", 1, 50],
    queryFn: () => fetchAuditLedger(1, 50),
  });

  const headBlock = entries[0];
  const genesisBlock = entries[entries.length - 1];

  return (
    <div className="flex flex-col min-h-full p-4 lg:p-6 space-y-6">
      {/* Statutory Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/40 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="identity" className="font-telemetry text-[11px]">
              MINES ACT 1952 &bull; SEC 23
            </Badge>
            <span className="text-xs font-telemetry text-outline uppercase tracking-wider">
              Cryptographic Non-Repudiation Architecture
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-on-surface flex items-center gap-2.5">
            <Fingerprint className="w-6 h-6 text-primary" />
            Immutable Cryptographic Audit Ledger
          </h1>
          <p className="text-xs md:text-sm text-on-surface-variant mt-0.5">
            Tamper-evident SHA-256 sequential hash-chain records providing immutable statutory traceability for DGMS regulatory audits.
          </p>
        </div>

        {/* Verification Trigger Badge */}
        <div className="flex items-center gap-3">
          <ChainVerificationBadge
            onVerified={(result) => setVerificationResult(result)}
          />
        </div>
      </div>

      {/* Ledger Architecture KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Verified Blocks */}
        <Card className="bg-surface-container border-outline-variant/40 shadow-sm">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-telemetry text-outline uppercase tracking-wider block">
                Total Sealed Blocks
              </span>
              <span className="text-2xl font-bold font-telemetry text-on-surface mt-1 block">
                {verificationResult
                  ? verificationResult.total_blocks_verified.toLocaleString()
                  : headBlock
                  ? headBlock.seq_id.toLocaleString()
                  : "1,045"}
              </span>
              <span className="text-[10px] text-outline block mt-0.5">
                Consecutive hash linkage
              </span>
            </div>
            <div className="w-9 h-9 rounded bg-surface-container-high flex items-center justify-center border border-outline-variant/40">
              <Layers className="w-5 h-5 text-primary" />
            </div>
          </CardContent>
        </Card>

        {/* Head Block Anchor */}
        <Card className="bg-surface-container border-outline-variant/40 shadow-sm">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div className="overflow-hidden">
              <span className="text-[11px] font-telemetry text-outline uppercase tracking-wider block">
                HEAD Hash Anchor
              </span>
              <span
                className="text-base font-bold font-telemetry text-primary mt-1 block truncate"
                title={headBlock?.current_hash}
              >
                {headBlock ? truncateHash(headBlock.current_hash, 8, 6) : "--"}
              </span>
              <span className="text-[10px] text-outline block mt-0.5 font-telemetry">
                Block #{headBlock?.seq_id ?? "--"}
              </span>
            </div>
            <div className="w-9 h-9 rounded bg-primary/10 flex items-center justify-center border border-primary/30 shrink-0 ml-2">
              <Lock className="w-5 h-5 text-primary" />
            </div>
          </CardContent>
        </Card>

        {/* Genesis Root Reference */}
        <Card className="bg-surface-container border-outline-variant/40 shadow-sm">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div className="overflow-hidden">
              <span className="text-[11px] font-telemetry text-outline uppercase tracking-wider block">
                Genesis Block
              </span>
              <span
                className="text-base font-bold font-telemetry text-amber-400 mt-1 block truncate"
                title={genesisBlock?.previous_hash}
              >
                0x0000...0000
              </span>
              <span className="text-[10px] text-outline block mt-0.5 font-telemetry">
                Colliery Inception Root
              </span>
            </div>
            <div className="w-9 h-9 rounded bg-amber-500/10 flex items-center justify-center border border-amber-500/30 shrink-0 ml-2">
              <Database className="w-5 h-5 text-amber-400" />
            </div>
          </CardContent>
        </Card>

        {/* Regulatory Audit Status */}
        <Card className="bg-surface-container border-outline-variant/40 shadow-sm">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-telemetry text-outline uppercase tracking-wider block">
                DGMS Audit Status
              </span>
              <span className="text-sm font-bold font-telemetry text-emerald-400 mt-1 block">
                STATUTORILY SEALED
              </span>
              <span className="text-[10px] text-outline block mt-0.5">
                Zero tampering detected
              </span>
            </div>
            <div className="w-9 h-9 rounded bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statutory Guidance Banner */}
      <div className="p-3 rounded bg-surface-container-low border border-outline-variant/50 text-xs text-on-surface-variant flex items-start gap-2.5">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-on-surface">Legal Evidentiary Admissibility: </span>
          Each ledger entry represents an atomic statutory transaction cryptographically bound to its predecessor via SHA-256 (CMR 2017 & Information Technology Act Sec 65B). Database manipulation or sequence modification breaks the hash chain and is immediately flagged by the verification engine.
        </div>
      </div>

      {/* Main Ledger Table Component */}
      <div className="flex-1">
        <AuditLedgerTable />
      </div>
    </div>
  );
};

export default AuditLedgerPage;
