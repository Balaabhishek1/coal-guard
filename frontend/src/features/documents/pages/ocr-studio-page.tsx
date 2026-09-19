import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ScanLine,
  FileCheck,
  Clock,
  ShieldCheck,
  FileSpreadsheet,
  AlertCircle,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { DocumentDropzone } from "../components/document-dropzone";
import { OcrProcessingProgress } from "../components/ocr-processing-progress";
import { SplitDocumentViewer } from "../components/split-document-viewer";
import {
  uploadDocument,
  verifyDocumentEntities,
  listDocuments,
} from "../services/documents-api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatStatutoryDateTime } from "@/lib/utils";
import type {
  DigitizedCertificate,
  DocumentType,
  DocumentVerifyPayload,
} from "@/types/documents";

export const OcrStudioPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [activeCertificate, setActiveCertificate] = useState<DigitizedCertificate | null>(null);
  const [studioState, setStudioState] = useState<"UPLOAD" | "PROCESSING" | "VERIFYING">("UPLOAD");
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Historical documents query
  const { data: documents = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ["digitized-documents-list"],
    queryFn: () => listDocuments(),
  });

  // Verify mutation
  const verifyMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: DocumentVerifyPayload }) =>
      verifyDocumentEntities(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["digitized-documents-list"] });
      setSuccessBanner(`Statutory certificate #${updated.extracted_serial_no || updated.id} verified and anchored to audit ledger.`);
      setActiveCertificate(null);
      setActiveDocumentId(null);
      setStudioState("UPLOAD");
      setTimeout(() => setSuccessBanner(null), 5000);
    },
  });

  const handleUpload = async (file: File, documentType: DocumentType) => {
    try {
      const res = await uploadDocument(file, documentType);
      const docId = res.certificate_id || res.document_id || res.task_id;
      setActiveDocumentId(docId);
      setStudioState("PROCESSING");
    } catch (err) {
      console.error("Failed to start upload:", err);
    }
  };

  const handleOcrComplete = (certificate: DigitizedCertificate) => {
    setActiveCertificate(certificate);
    setStudioState("VERIFYING");
  };

  const handleInspectHistorical = (cert: DigitizedCertificate) => {
    setActiveCertificate(cert);
    setActiveDocumentId(cert.id);
    setStudioState("VERIFYING");
  };

  const handleBackToUpload = () => {
    setActiveCertificate(null);
    setActiveDocumentId(null);
    setStudioState("UPLOAD");
  };

  // Metrics
  const totalDocs = documents.length;
  const pendingReview = documents.filter((d) => !d.is_verified_by_human).length;
  const completedReview = documents.filter((d) => d.is_verified_by_human).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/30 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ScanLine className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold text-on-surface">
              Multimodal OCR Digitization Studio
            </h1>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            Statutory AI extraction of legacy paper certificates (VTC, PME, FLPM, DGMS approvals) with human verification.
          </p>
        </div>

        {studioState !== "UPLOAD" && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackToUpload}
            className="text-xs border-outline-variant gap-1.5"
          >
            <span>Upload Another Document</span>
          </Button>
        )}
      </div>

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="p-3.5 rounded bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between shadow-[0_0_12px_rgba(16,185,129,0.15)] animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-400/80 hover:text-emerald-300 text-[11px] font-telemetry"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Studio View Switching */}
      {studioState === "PROCESSING" && activeDocumentId && (
        <OcrProcessingProgress
          documentId={activeDocumentId}
          onComplete={handleOcrComplete}
          onError={() => setStudioState("UPLOAD")}
        />
      )}

      {studioState === "VERIFYING" && activeCertificate && (
        <SplitDocumentViewer
          certificate={activeCertificate}
          onVerify={async (payload) => {
            await verifyMutation.mutateAsync({ id: activeCertificate.id, payload });
          }}
          onBack={handleBackToUpload}
          isSaving={verifyMutation.isPending}
        />
      )}

      {studioState === "UPLOAD" && (
        <>
          {/* KPI Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="bg-surface-container-low border-outline-variant/40">
              <CardContent className="p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-telemetry uppercase text-on-surface-variant">
                    Total Ingested Certificates
                  </p>
                  <p className="text-xl font-bold font-telemetry text-on-surface mt-0.5">
                    {totalDocs}
                  </p>
                </div>
                <div className="w-9 h-9 rounded bg-primary/10 border border-primary/30 flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-surface-container-low border-outline-variant/40">
              <CardContent className="p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-telemetry uppercase text-on-surface-variant">
                    Awaiting Statutory Sign-off
                  </p>
                  <p className="text-xl font-bold font-telemetry text-amber-400 mt-0.5">
                    {pendingReview}
                  </p>
                </div>
                <div className="w-9 h-9 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-surface-container-low border-outline-variant/40">
              <CardContent className="p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-telemetry uppercase text-on-surface-variant">
                    Human Verified & Anchored
                  </p>
                  <p className="text-xl font-bold font-telemetry text-emerald-400 mt-0.5">
                    {completedReview}
                  </p>
                </div>
                <div className="w-9 h-9 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upload Dropzone */}
          <DocumentDropzone onUpload={handleUpload} />

          {/* Historical Documents Registry Table */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold font-telemetry uppercase tracking-wider text-on-surface">
                Historical Digitized Certificates Registry
              </h3>
              <span className="text-[11px] text-outline font-telemetry">
                {documents.length} records archived
              </span>
            </div>

            <div className="rounded border border-outline-variant/40 overflow-hidden bg-surface-container-lowest shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-sans text-xs">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-outline-variant/40 text-on-surface-variant text-[11px] font-telemetry uppercase tracking-wider">
                      <th className="py-2.5 px-3">Date Uploaded</th>
                      <th className="py-2.5 px-3">Classification</th>
                      <th className="py-2.5 px-3">Extracted Serial No</th>
                      <th className="py-2.5 px-3">Issuing Authority</th>
                      <th className="py-2.5 px-3">Validity Window</th>
                      <th className="py-2.5 px-3">Human Audit</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20 font-telemetry">
                    {isLoadingHistory ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-outline">
                          Loading digitized certificates archive...
                        </td>
                      </tr>
                    ) : documents.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-outline">
                          No legacy certificates ingested yet. Drop files above to start.
                        </td>
                      </tr>
                    ) : (
                      documents.map((cert) => (
                        <tr
                          key={cert.id}
                          className="hover:bg-surface-container-high/40 transition-colors"
                        >
                          <td className="py-2.5 px-3 text-on-surface-variant whitespace-nowrap">
                            {formatStatutoryDateTime(cert.created_at)}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-1.5 py-0.5 rounded bg-surface-container border border-outline-variant/40 text-[11px] font-semibold text-primary">
                              {cert.document_type}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-on-surface">
                            {cert.extracted_serial_no || "Unparsed"}
                          </td>
                          <td className="py-2.5 px-3 text-on-surface-variant font-sans max-w-[200px] truncate">
                            {cert.issuing_authority || "CSIR / DGMS Board"}
                          </td>
                          <td className="py-2.5 px-3 text-on-surface-variant whitespace-nowrap">
                            {cert.valid_until ? cert.valid_until.slice(0, 10) : "Indefinite"}
                          </td>
                          <td className="py-2.5 px-3">
                            {cert.is_verified_by_human ? (
                              <Badge variant="default" className="text-[10px] gap-1">
                                <FileCheck className="w-3 h-3" />
                                <span>VERIFIED</span>
                              </Badge>
                            ) : (
                              <Badge variant="warning" className="text-[10px] gap-1">
                                <AlertCircle className="w-3 h-3" />
                                <span>UNVERIFIED</span>
                              </Badge>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleInspectHistorical(cert)}
                              className="h-7 text-xs gap-1 border-outline-variant hover:bg-surface-container px-2.5"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Inspect</span>
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default OcrStudioPage;
