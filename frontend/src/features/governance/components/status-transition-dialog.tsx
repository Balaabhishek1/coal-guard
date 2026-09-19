import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShieldAlert,
  ArrowRight,
  UploadCloud,
  FileCheck,
  AlertCircle,
  Lock,
  CheckCircle2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { updateViolationStatus } from "../services/governance-api";
import type { ComplianceViolation, ViolationStatus } from "@/types/governance";

interface StatusTransitionDialogProps {
  violation: ComplianceViolation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const NEXT_STATUS_MAP: Record<ViolationStatus, ViolationStatus | null> = {
  DETECTED: "NOTICE_SERVED",
  NOTICE_SERVED: "ACTION_TAKEN",
  ACTION_TAKEN: "VERIFIED",
  VERIFIED: "STATUTORY_CLOSEOUT",
  STATUTORY_CLOSEOUT: null,
};

const GUARD_CONFIG: Record<
  ViolationStatus,
  {
    targetStatus: ViolationStatus;
    title: string;
    description: string;
    remarksLabel: string;
    remarksPlaceholder: string;
    requiresEvidence: boolean;
    evidenceLabel?: string;
  }
> = {
  DETECTED: {
    targetStatus: "NOTICE_SERVED",
    title: "Issue Statutory Rectification Notice",
    description: "Formally serve a statutory notice to the designated colliery supervisor or contractor under CMR 2017 Reg. 182.",
    remarksLabel: "Statutory Notice Reference & Mandate",
    remarksPlaceholder: "Enter notice memo number, statutory regulation reference, and dispatch instructions...",
    requiresEvidence: false,
  },
  NOTICE_SERVED: {
    targetStatus: "ACTION_TAKEN",
    title: "Record Engineering Remediation Action",
    description: "Submit proof of corrective engineering measures taken underground to eliminate the safety hazard.",
    remarksLabel: "Rectification Work Order & Action Taken",
    remarksPlaceholder: "Document the mechanical/electrical rectification, parts replaced, or corrective ventilation adjustments...",
    requiresEvidence: true,
    evidenceLabel: "Upload Inspection Evidence / Work Order Document ID",
  },
  ACTION_TAKEN: {
    targetStatus: "VERIFIED",
    title: "Verify Physical Remediation (Safety Officer)",
    description: "Confirm physical underground inspection conducted to verify that hazard is fully neutralized.",
    remarksLabel: "Field Verification & Measurement Findings",
    remarksPlaceholder: "Enter anemometer, gas sensor, or physical barrier verification readings and inspector license...",
    requiresEvidence: false,
  },
  VERIFIED: {
    targetStatus: "STATUTORY_CLOSEOUT",
    title: "Final Statutory Closeout & Hash Sealing",
    description: "Permanently seal this compliance ticket. Appends an immutable cryptographic block to the SHA-256 audit ledger.",
    remarksLabel: "Manager Endorsement & Final Closeout Rationale",
    remarksPlaceholder: "Confirming all statutory stipulations under Mines Act 1952 are fulfilled. Approved for immutable ledger sealing...",
    requiresEvidence: false,
  },
  STATUTORY_CLOSEOUT: {
    targetStatus: "STATUTORY_CLOSEOUT",
    title: "Ticket Archived",
    description: "This ticket is statutorily closed out.",
    remarksLabel: "Remarks",
    remarksPlaceholder: "",
    requiresEvidence: false,
  },
};

export const StatusTransitionDialog: React.FC<StatusTransitionDialogProps> = ({
  violation,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [remarks, setRemarks] = useState("");
  const [evidenceRef, setEvidenceRef] = useState("");
  const [evidenceUploaded, setEvidenceUploaded] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const currentStatus = violation?.status ?? "DETECTED";
  const nextStatus = NEXT_STATUS_MAP[currentStatus];
  const guard = GUARD_CONFIG[currentStatus];

  const mutation = useMutation({
    mutationFn: async () => {
      if (!violation || !nextStatus) throw new Error("Invalid transition request");
      const finalRemarks = evidenceRef
        ? `${remarks.trim()} [Evidence Attached: ${evidenceRef.trim()}]`
        : remarks.trim();
      return updateViolationStatus(violation.id, nextStatus, finalRemarks);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["governance-violations"] });
      queryClient.invalidateQueries({ queryKey: ["governance-audit-ledger"] });
      handleClose();
      onSuccess?.();
    },
    onError: (err: any) => {
      setValidationError(
        err?.response?.data?.detail || "Statutory transition failed. Please verify permissions."
      );
    },
  });

  const handleClose = () => {
    setRemarks("");
    setEvidenceRef("");
    setEvidenceUploaded(false);
    setValidationError(null);
    onOpenChange(false);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Enforce guard conditions
    if (!remarks.trim() || remarks.trim().length < 10) {
      setValidationError("Statutory audit requires minimum 10 characters of descriptive rationale.");
      return;
    }

    if (guard.requiresEvidence && !evidenceRef.trim() && !evidenceUploaded) {
      setValidationError("Advancing to ACTION_TAKEN strictly requires evidence documentation or attachment ID.");
      return;
    }

    mutation.mutate();
  };

  const handleSimulateUpload = () => {
    const mockRef = `DOC-EVID-${Date.now().toString().slice(-6)}.pdf`;
    setEvidenceRef(mockRef);
    setEvidenceUploaded(true);
    setValidationError(null);
  };

  if (!violation || !nextStatus) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-surface-container border border-outline-variant/60 text-on-surface">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="identity" className="font-telemetry text-[10px]">
              CMR 2017 REG. 182
            </Badge>
            <span className="font-telemetry text-xs text-on-surface-variant">
              Ticket: {violation.id}
            </span>
          </div>
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-on-surface">
            <ShieldAlert className="w-5 h-5 text-primary" />
            {guard.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-on-surface-variant leading-relaxed">
            {guard.description}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleFormSubmit} className="space-y-4 py-2">
          {/* Transition Visualizer */}
          <div className="flex items-center justify-between p-3 rounded bg-surface-container-high border border-outline-variant/40 text-xs font-telemetry">
            <div className="flex flex-col">
              <span className="text-[10px] text-outline uppercase tracking-wider">
                Current Stage
              </span>
              <span className="font-semibold text-amber-400">
                {currentStatus.replace(/_/g, " ")}
              </span>
            </div>

            <ArrowRight className="w-4 h-4 text-outline" />

            <div className="flex flex-col text-right">
              <span className="text-[10px] text-outline uppercase tracking-wider">
                Statutory Target
              </span>
              <span className="font-semibold text-primary">
                {nextStatus.replace(/_/g, " ")}
              </span>
            </div>
          </div>

          {/* Violation Snapshot */}
          <div className="p-2.5 rounded bg-surface-container-lowest border border-outline-variant/30 text-xs space-y-1">
            <div className="font-medium text-on-surface truncate">
              {violation.title || violation.violation_type}
            </div>
            <div className="text-[11px] text-on-surface-variant flex items-center justify-between">
              <span>Location: {violation.location_name || violation.location_id}</span>
              <span className="font-telemetry">Severity: {violation.severity}</span>
            </div>
          </div>

          {/* Mandatory Remarks Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-on-surface flex items-center justify-between">
              <span>{guard.remarksLabel}</span>
              <span className="text-[10px] text-outline font-telemetry">
                * Mandatory (Min 10 chars)
              </span>
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={guard.remarksPlaceholder}
              className="w-full rounded bg-surface-container-lowest border border-outline-variant/60 p-2 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-primary font-sans resize-none transition-colors"
            />
          </div>

          {/* Optional/Mandatory Evidence Upload for ACTION_TAKEN */}
          {guard.requiresEvidence && (
            <div className="space-y-1.5 p-3 rounded bg-surface-container-high/40 border border-outline-variant/40">
              <label className="text-xs font-medium text-on-surface flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-primary" />
                  {guard.evidenceLabel}
                </span>
                <span className="text-[10px] text-rose-400 font-telemetry">
                  * Required by DGMS
                </span>
              </label>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={evidenceRef}
                  onChange={(e) => {
                    setEvidenceRef(e.target.value);
                    setEvidenceUploaded(Boolean(e.target.value.trim()));
                  }}
                  placeholder="e.g. DOC-REPAIR-SEAM1-4029.pdf"
                  className="flex-1 rounded bg-surface-container-lowest border border-outline-variant/60 px-2.5 py-1.5 text-xs text-on-surface font-telemetry focus:outline-none focus:border-primary"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleSimulateUpload}
                  className="h-8 text-xs gap-1.5 border-outline-variant hover:border-primary hover:text-primary shrink-0"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Attach File</span>
                </Button>
              </div>

              {evidenceUploaded && (
                <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-telemetry">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Evidence artifact linked: {evidenceRef}
                </div>
              )}
            </div>
          )}

          {/* Sealing Warning for Closeout */}
          {nextStatus === "STATUTORY_CLOSEOUT" && (
            <div className="p-3 rounded bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2">
              <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Cryptographic Non-Repudiation Lock</span>
                <span>
                  Advancing to Statutory Closeout calculates a new SHA-256 block hash and links this ticket to the immutable colliery audit ledger. This action cannot be revoked.
                </span>
              </div>
            </div>
          )}

          {/* Validation or API Error Banner */}
          {validationError && (
            <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/40 text-xs text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          <DialogFooter className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="text-xs h-8 border-outline-variant"
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="text-xs h-8 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
            >
              {mutation.isPending ? (
                <span>Advancing State...</span>
              ) : (
                <>
                  <span>Commit Transition</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StatusTransitionDialog;
