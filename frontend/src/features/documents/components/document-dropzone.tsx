import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud,
  FileText,
  FileCheck,
  X,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DocumentType } from "@/types/documents";

interface DocumentDropzoneProps {
  onUpload: (file: File, documentType: DocumentType) => Promise<void>;
  isUploading?: boolean;
  className?: string;
}

const DOCUMENT_TYPES: { label: string; value: DocumentType; description: string }[] = [
  {
    label: "VTC Training Slip",
    value: "VTC_SLIP",
    description: "Vocational training refresher certificate under CMR 2017 Reg 28",
  },
  {
    label: "PME Medical Record (Form O)",
    value: "PME_RECORD",
    description: "Periodical Medical Examination fitness under CMR 2017 Reg 29B",
  },
  {
    label: "FLPM Flameproof Certificate",
    value: "FLPM_CERTIFICATE",
    description: "Flameproof mining apparatus test certificate (Group I Methane)",
  },
  {
    label: "DGMS Statutory Approval",
    value: "DGMS_APPROVAL",
    description: "Statutory field trial or equipment approval issued by DGMS Dhanbad",
  },
  {
    label: "Other Statutory Document",
    value: "OTHER",
    description: "General statutory shift journal, pass, or vendor declaration",
  },
];

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

export const DocumentDropzone: React.FC<DocumentDropzoneProps> = ({
  onUpload,
  isUploading = false,
  className,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<DocumentType>("VTC_SLIP");
  const [fileError, setFileError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    setFileError(null);
    if (fileRejections.length > 0) {
      const rejection = fileRejections[0];
      if (rejection.file.size > MAX_FILE_SIZE_BYTES) {
        setFileError("File exceeds statutory limit of 15MB. Please upload a compressed document.");
      } else {
        setFileError("Invalid format. Please upload PDF, PNG, JPEG, or WebP files.");
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/webp": [".webp"],
    },
    maxSize: MAX_FILE_SIZE_BYTES,
    multiple: false,
    disabled: isUploading,
  });

  const handleClearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setFileError(null);
  };

  const handleStartUpload = async () => {
    if (!selectedFile) return;
    await onUpload(selectedFile, docType);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Document Type Selector Header */}
      <div className="bg-surface-container-low p-4 rounded border border-outline-variant/50">
        <label className="block text-xs font-telemetry uppercase tracking-wider text-on-surface-variant mb-2">
          Initial Statutory Classification
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {DOCUMENT_TYPES.map((dt) => (
            <button
              key={dt.value}
              type="button"
              onClick={() => setDocType(dt.value)}
              className={cn(
                "p-2.5 rounded border text-left transition-all",
                docType === dt.value
                  ? "bg-primary/10 border-primary shadow-[0_0_8px_rgba(255,183,77,0.15)]"
                  : "bg-surface-container-lowest border-outline-variant/40 hover:border-outline-variant"
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn("text-xs font-semibold", docType === dt.value ? "text-primary" : "text-on-surface")}>
                  {dt.label}
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant/80 mt-1 line-clamp-2 leading-relaxed">
                {dt.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Drag and Drop Zone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all relative overflow-hidden",
          isDragActive
            ? "border-primary bg-primary/5 scale-[1.005]"
            : selectedFile
            ? "border-emerald-500/50 bg-emerald-500/5"
            : "border-outline-variant/60 hover:border-outline bg-surface-container-lowest",
          isUploading && "pointer-events-none opacity-60"
        )}
      >
        <input {...getInputProps()} />

        {selectedFile ? (
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <FileCheck className="w-6 h-6 text-emerald-400" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold text-on-surface">
                {selectedFile.name}
              </p>
              <p className="text-xs text-outline font-telemetry">
                {formatFileSize(selectedFile.size)} &bull; {selectedFile.type || "Document"}
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClearFile}
              className="text-xs border-outline-variant hover:bg-surface-container gap-1 mt-2 text-rose-300"
            >
              <X className="w-3.5 h-3.5" />
              <span>Remove Selected File</span>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-surface-container-high border border-outline-variant/40 flex items-center justify-center">
              <UploadCloud className="w-7 h-7 text-primary animate-bounce-slow" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold text-on-surface">
                Drag and drop physical certificate or <span className="text-primary underline">browse</span>
              </p>
              <p className="text-xs text-outline">
                Supports scanned PDF, PNG, JPEG, and WebP up to 15MB
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2 text-[11px] text-outline font-telemetry">
              <FileText className="w-3.5 h-3.5" />
              <span>Intrinsic-safe OCR pipeline with PaddleOCR angle detection</span>
            </div>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {fileError && (
        <div className="p-3 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{fileError}</span>
        </div>
      )}

      {/* Upload Action Button */}
      {selectedFile && (
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={handleStartUpload}
            disabled={isUploading}
            className="w-full sm:w-auto text-xs px-6 py-2 gap-2 bg-primary text-primary-foreground font-semibold"
          >
            {isUploading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                <span>Uploading to OCR Engine...</span>
              </>
            ) : (
              <>
                <span>Process Document with PaddleOCR</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default DocumentDropzone;
