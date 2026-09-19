import React, { useState } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  FileText,
  ChevronLeft,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExtractedEntityForm } from "./extracted-entity-form";
import { cn } from "@/lib/utils";
import type { DigitizedCertificate, DocumentVerifyPayload } from "@/types/documents";

interface SplitDocumentViewerProps {
  certificate: DigitizedCertificate;
  onVerify: (payload: DocumentVerifyPayload) => Promise<void>;
  onBack: () => void;
  isSaving?: boolean;
  className?: string;
}

export const SplitDocumentViewer: React.FC<SplitDocumentViewerProps> = ({
  certificate,
  onVerify,
  onBack,
  isSaving = false,
  className,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 0.25, 0.5));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);
  const handleReset = () => {
    setZoomLevel(1);
    setRotation(0);
  };

  const isPdf = certificate.file_url?.toLowerCase().includes(".pdf");

  return (
    <div className={cn("flex flex-col h-[calc(100vh-140px)] min-h-[640px] space-y-3", className)}>
      {/* Top Controls Ribbon */}
      <div className="flex items-center justify-between p-3 rounded bg-surface-container-low border border-outline-variant/40 shrink-0">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onBack}
            className="text-xs border-outline-variant gap-1 h-8"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Upload</span>
          </Button>

          <div className="h-4 w-px bg-outline-variant/40 hidden sm:block" />

          <div className="hidden sm:flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-on-surface">
              Dual-Pane Verification Studio
            </span>
            <span className="text-[11px] text-outline font-telemetry">
              &bull; ID: {certificate.id}
            </span>
          </div>
        </div>

        {/* Zoom & View Controls */}
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            className="h-8 px-2 border-outline-variant hover:bg-surface-container text-xs"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <span className="text-[11px] font-telemetry text-on-surface-variant w-12 text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            className="h-8 px-2 border-outline-variant hover:bg-surface-container text-xs"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRotate}
            className="h-8 px-2 border-outline-variant hover:bg-surface-container text-xs"
            title="Rotate 90deg"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="h-8 px-2.5 border-outline-variant hover:bg-surface-container text-[11px] font-telemetry"
          >
            Reset
          </Button>
          <a
            href={certificate.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="h-8 px-2 border border-outline-variant rounded flex items-center justify-center hover:bg-surface-container text-outline hover:text-white transition-colors ml-1"
            title="Open Original in New Tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 overflow-hidden">
        {/* Left Column: Document Canvas / Visual Preview */}
        <div className="lg:col-span-7 bg-surface-container-lowest rounded-lg border border-outline-variant/40 overflow-hidden flex flex-col relative">
          <div className="p-2 bg-surface-container-low border-b border-outline-variant/40 flex items-center justify-between text-[11px] text-outline font-telemetry shrink-0">
            <div className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-primary" />
              <span>Original Scanned Physical Artifact</span>
            </div>
            <span>{isPdf ? "PDF Document" : "Raster Image Scan"}</span>
          </div>

          <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/30">
            {isPdf ? (
              <iframe
                src={certificate.file_url}
                title="Document Preview"
                className="w-full h-full min-h-[500px] rounded border-0"
              />
            ) : (
              <div
                className="transition-transform duration-150 ease-out origin-center"
                style={{
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                }}
              >
                <img
                  src={certificate.file_url}
                  alt="Scanned certificate"
                  className="max-w-full max-h-[70vh] object-contain rounded shadow-lg select-none pointer-events-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Extracted Entity Form & Verification Actions */}
        <div className="lg:col-span-5 bg-surface-container-low rounded-lg border border-outline-variant/40 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-outline-variant/40 bg-surface-container shrink-0">
            <h4 className="text-xs font-semibold text-on-surface">
              Extracted Statutory Parameters
            </h4>
            <p className="text-[11px] text-on-surface-variant">
              Review and correct metadata parsed by PaddleOCR before anchoring to blockchain ledger.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <ExtractedEntityForm
              certificate={certificate}
              onVerify={onVerify}
              isSaving={isSaving}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplitDocumentViewer;
