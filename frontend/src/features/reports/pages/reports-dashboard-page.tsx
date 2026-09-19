import React, { useState } from "react";
import {
  FileDown,
  ShieldCheck,
  Award,
  Layers,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { ReportCard } from "../components/report-card";
import { ReportParameterDialog } from "../components/report-parameter-dialog";
import {
  STATUTORY_REPORTS_CATALOG,
  downloadReport,
  triggerBlobDownload,
} from "../services/reports-api";
import { Card, CardContent } from "@/components/ui/card";
import type { ReportMetadata, ReportGeneratePayload } from "@/types/reports";

export const ReportsDashboardPage: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<ReportMetadata | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadingReportId, setDownloadingReportId] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSelectReport = async (report: ReportMetadata) => {
    if (report.requiresParameters) {
      setSelectedReport(report);
      setIsDialogOpen(true);
    } else {
      // Immediate download for direct reports
      await handleGenerate({ report_type: report.id });
    }
  };

  const handleGenerate = async (payload: ReportGeneratePayload) => {
    setIsGenerating(true);
    setDownloadingReportId(payload.report_type);
    setErrorMessage(null);

    try {
      const blob = await downloadReport(payload);
      const filename = `${payload.report_type.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.pdf`;
      triggerBlobDownload(blob, filename);

      setDownloadSuccess(`Generated statutory report: ${filename}`);
      setTimeout(() => setDownloadSuccess(null), 5000);
    } catch (err: any) {
      console.error("Failed to generate report PDF:", err);
      setErrorMessage(err.message || "Failed to stream report PDF from backend service.");
    } finally {
      setIsGenerating(false);
      setDownloadingReportId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-outline-variant/30 pb-4">
        <div className="flex items-center gap-2.5">
          <FileDown className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold text-on-surface">
            Statutory Reports & PDF Exporter Studio
          </h1>
        </div>
        <p className="text-xs text-on-surface-variant mt-1">
          Compile, digitally sign, and download Directorate General of Mines Safety (DGMS) CMR 2017 Form IV shift logs,
          executive safety scorecards, and cryptographic audit proofs.
        </p>
      </div>

      {/* Notifications */}
      {downloadSuccess && (
        <div className="p-3.5 rounded bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between shadow-[0_0_12px_rgba(16,185,129,0.15)] animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{downloadSuccess}</span>
          </div>
          <button
            onClick={() => setDownloadSuccess(null)}
            className="text-emerald-400/80 hover:text-emerald-300 text-[11px] font-telemetry"
          >
            Dismiss
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-400/80 hover:text-rose-300 text-[11px] font-telemetry"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Overview Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="bg-surface-container-low border-outline-variant/40">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-telemetry uppercase text-on-surface-variant">
                Statutory Export Formats
              </p>
              <p className="text-xl font-bold font-telemetry text-on-surface mt-0.5">
                3 Official PDFs
              </p>
            </div>
            <div className="w-9 h-9 rounded bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Layers className="w-4 h-4 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface-container-low border-outline-variant/40">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-telemetry uppercase text-on-surface-variant">
                Audit Trail Integrity
              </p>
              <p className="text-xl font-bold font-telemetry text-emerald-400 mt-0.5">
                SHA-256 Verified
              </p>
            </div>
            <div className="w-9 h-9 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface-container-low border-outline-variant/40">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-telemetry uppercase text-on-surface-variant">
                Regulatory Standards
              </p>
              <p className="text-xl font-bold font-telemetry text-amber-400 mt-0.5">
                DGMS CMR 2017
              </p>
            </div>
            <div className="w-9 h-9 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <Award className="w-4 h-4 text-amber-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Cards Grid */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold font-telemetry uppercase tracking-wider text-on-surface">
          Statutory Export Catalog
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {STATUTORY_REPORTS_CATALOG.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onSelect={handleSelectReport}
              isDownloading={downloadingReportId === report.id}
            />
          ))}
        </div>
      </div>

      {/* Parameter Dialog */}
      <ReportParameterDialog
        report={selectedReport}
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedReport(null);
        }}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
      />
    </div>
  );
};

export default ReportsDashboardPage;
