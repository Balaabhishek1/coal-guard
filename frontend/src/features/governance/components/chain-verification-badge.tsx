import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ShieldCheck, RefreshCw, AlertOctagon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { verifyAuditChain } from "../services/governance-api";
import type { ChainVerificationResult } from "@/types/governance";
import { cn } from "@/lib/utils";

interface ChainVerificationBadgeProps {
  className?: string;
  onVerified?: (result: ChainVerificationResult) => void;
}

export const ChainVerificationBadge: React.FC<ChainVerificationBadgeProps> = ({
  className,
  onVerified,
}) => {
  const [result, setResult] = useState<ChainVerificationResult | null>(null);
  const [lastVerifiedAt, setLastVerifiedAt] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      return verifyAuditChain();
    },
    onSuccess: (data) => {
      setResult(data);
      setLastVerifiedAt(new Date().toLocaleTimeString());
      onVerified?.(data);
    },
  });

  const handleVerify = () => {
    mutation.mutate();
  };

  const isPending = mutation.isPending;
  const isVerified = result !== null && !isPending;
  const isValid = result?.valid === true;
  const isBroken = result?.valid === false;

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Button
        size="sm"
        onClick={handleVerify}
        disabled={isPending}
        className={cn(
          "h-9 px-3.5 text-xs font-telemetry rounded gap-2 border transition-all shadow-sm",
          !isVerified &&
            "bg-surface-container border-outline-variant hover:border-primary hover:text-primary text-on-surface",
          isVerified &&
            isValid &&
            "bg-emerald-500/15 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.2)]",
          isVerified &&
            isBroken &&
            "bg-rose-500/20 border-rose-500/60 text-rose-300 hover:bg-rose-500/25 animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.3)]"
        )}
      >
        {isPending ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin text-primary" />
            <span>Traversing SHA-256 Chain...</span>
          </>
        ) : isVerified && isValid ? (
          <>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">
              Chain Verified ({result.total_blocks_verified.toLocaleString()} Blocks)
            </span>
          </>
        ) : isVerified && isBroken ? (
          <>
            <AlertOctagon className="w-4 h-4 text-rose-400" />
            <span className="font-bold">
              TAMPER DETECTED: Block #{result.broken_seq_id}
            </span>
          </>
        ) : (
          <>
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span>Verify Chain Integrity</span>
          </>
        )}
      </Button>

      {lastVerifiedAt && (
        <span className="text-[10px] text-outline font-telemetry hidden sm:inline-block">
          Checked: {lastVerifiedAt}
        </span>
      )}
    </div>
  );
};

export default ChainVerificationBadge;
