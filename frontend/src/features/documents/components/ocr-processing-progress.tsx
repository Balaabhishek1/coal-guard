import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2,
  ScanLine,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  FileCheck,
  RotateCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchDocumentStatus } from "../services/documents-api";
import { cn } from "@/lib/utils";
import type { DigitizedCertificate } from "@/types/documents";

interface OcrProcessingProgressProps {
  documentId: string;
  onComplete: (certificate: DigitizedCertificate) => void;
  onError?: (error: Error) => void;
  className?: string;
}

const PIPELINE_STEPS = [
  {
    step: 1,
    title: "Document Ingestion & Checksum",
    description: "Computing SHA-256 digest and generating archival storage entry",
  },
  {
    step: 2,
    title: "PaddleOCR Text Detection",
    description: "Multilingual angle classifier and text line detection across skewed scans",
  },
  {
    step: 3,
    title: "Statutory Entity Extraction",
    description: "RegEx parsing for VTC/PME certificate serials, expiry dates, and issuing bodies",
  },
  {
    step: 4,
    title: "Audit Ledger Anchoring",
    description: "Synthesizing metadata and queuing for human statutory sign-off",
  },
];

export const OcrProcessingProgress: React.FC<OcrProcessingProgressProps> = ({
  documentId,
  onComplete,
  onError,
  className,
}) => {
  const { data: certificate, error, refetch } = useQuery({
    queryKey: ["document-ocr-status", documentId],
    queryFn: () => fetchDocumentStatus(documentId),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.processing_status === "COMPLETED" || data?.processing_status === "FAILED") {
        return false;
      }
      return 2000;
    },
  });

  const status = certificate?.processing_status || "PROCESSING";

  useEffect(() => {
    if (status === "COMPLETED" && certificate) {
      onComplete(certificate);
    } else if (status === "FAILED" && onError) {
      onError(new Error("OCR engine failed to extract statutory entities."));
    }
  }, [status, certificate, onComplete, onError]);

  const getStepStatus = (index: number) => {
    if (status === "COMPLETED") return "DONE";
    if (status === "FAILED") return index === 1 ? "ERROR" : "PENDING";
    // Simulated active step progression while polling
    return index <= 2 ? "ACTIVE" : "PENDING";
  };

  return (
    <div
      className={cn(
        "p-6 rounded-lg border border-outline-variant/50 bg-surface-container-low max-w-2xl mx-auto space-y-6",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-outline-variant/40 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
            {status === "COMPLETED" ? (
              <FileCheck className="w-5 h-5 text-emerald-400" />
            ) : status === "FAILED" ? (
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            ) : (
              <ScanLine className="w-5 h-5 text-primary animate-pulse" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-on-surface">
              {status === "COMPLETED"
                ? "OCR Extraction Complete"
                : status === "FAILED"
                ? "Processing Error Encountered"
                : "PaddleOCR Extraction in Progress"}
            </h3>
            <p className="text-xs text-outline font-telemetry">
              Document UUID: {documentId.slice(0, 18)}...
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status === "PROCESSING" && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-telemetry font-medium bg-primary/10 text-primary border border-primary/20">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Analyzing</span>
            </span>
          )}
          {status === "COMPLETED" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-telemetry bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-3 h-3" />
              <span>Verified</span>
            </span>
          )}
        </div>
      </div>

      {/* Pipeline Stage Indicators */}
      <div className="space-y-3">
        {PIPELINE_STEPS.map((step, idx) => {
          const stepStatus = getStepStatus(idx);
          return (
            <div
              key={step.step}
              className={cn(
                "p-3 rounded border transition-all flex items-start gap-3",
                stepStatus === "DONE"
                  ? "bg-emerald-500/5 border-emerald-500/20"
                  : stepStatus === "ACTIVE"
                  ? "bg-primary/5 border-primary/30"
                  : "bg-surface-container-lowest border-outline-variant/30 opacity-60"
              )}
            >
              <div className="mt-0.5">
                {stepStatus === "DONE" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : stepStatus === "ACTIVE" ? (
                  <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
                ) : (
                  <Cpu className="w-4 h-4 text-outline shrink-0" />
                )}
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-on-surface">
                  {step.title}
                </p>
                <p className="text-[11px] text-on-surface-variant">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Failure State & Manual Action */}
      {(status === "FAILED" || error) && (
        <div className="p-3 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>OCR extraction halted. The image may be unreadable or corrupt.</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            className="text-xs gap-1 border-rose-500/40 text-rose-300 hover:bg-rose-500/20"
          >
            <RotateCw className="w-3 h-3" />
            <span>Retry</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default OcrProcessingProgress;
