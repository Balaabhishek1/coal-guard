import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ShieldCheck,
  Calendar,
  Building2,
  Hash,
  FileText,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DigitizedCertificate, DocumentVerifyPayload } from "@/types/documents";

const entitySchema = z.object({
  corrected_document_type: z.string().min(1, "Document type is required"),
  corrected_serial_no: z.string().min(2, "Serial number is required"),
  issuing_authority: z.string().optional(),
  corrected_valid_from: z.string().optional(),
  corrected_valid_until: z.string().min(1, "Validity expiry date is required"),
  target_user_id: z.string().optional(),
  notes: z.string().optional(),
  is_verified: z.boolean().default(true),
});

type EntityFormData = z.infer<typeof entitySchema>;

interface ExtractedEntityFormProps {
  certificate: DigitizedCertificate;
  onVerify: (payload: DocumentVerifyPayload) => Promise<void>;
  isSaving?: boolean;
  className?: string;
}

export const ExtractedEntityForm: React.FC<ExtractedEntityFormProps> = ({
  certificate,
  onVerify,
  isSaving = false,
  className,
}) => {
  const [showRawText, setShowRawText] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EntityFormData>({
    resolver: zodResolver(entitySchema),
    defaultValues: {
      corrected_document_type: certificate.document_type || "VTC_SLIP",
      corrected_serial_no: certificate.extracted_serial_no || "",
      issuing_authority: certificate.issuing_authority || "",
      corrected_valid_from: certificate.valid_from ? certificate.valid_from.slice(0, 10) : "",
      corrected_valid_until: certificate.valid_until ? certificate.valid_until.slice(0, 10) : "",
      target_user_id: certificate.target_user_id || "",
      notes: "",
      is_verified: true,
    },
  });

  const onSubmit = async (data: EntityFormData) => {
    const payload: DocumentVerifyPayload = {
      is_verified: true,
      corrected_document_type: data.corrected_document_type,
      corrected_serial_no: data.corrected_serial_no,
      corrected_valid_from: data.corrected_valid_from ? new Date(data.corrected_valid_from).toISOString() : null,
      corrected_valid_until: data.corrected_valid_until ? new Date(data.corrected_valid_until).toISOString() : null,
      target_user_id: data.target_user_id || null,
      notes: data.notes || "Statutory human verification completed via OCR Digitization Studio.",
    };
    await onVerify(payload);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn("space-y-4", className)}>
      {/* Verification Status Header */}
      <div className="flex items-center justify-between p-3 rounded bg-surface-container-low border border-outline-variant/40">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-on-surface">
            Statutory Human-in-the-Loop Audit
          </span>
        </div>
        <Badge
          variant={certificate.is_verified_by_human ? "default" : "warning"}
          className="text-[11px] font-telemetry"
        >
          {certificate.is_verified_by_human ? "VERIFIED" : "PENDING AUDIT"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Document Classification */}
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-[11px] font-telemetry uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-outline" />
            <span>Document Classification</span>
          </label>
          <select
            {...register("corrected_document_type")}
            className="w-full h-8 px-2.5 rounded bg-surface-container-lowest border border-outline-variant/60 text-xs text-on-surface focus:outline-none focus:border-primary font-sans"
          >
            <option value="VTC_SLIP">VTC Training Slip (CMR Reg 28)</option>
            <option value="PME_RECORD">PME Medical Examination Form O (CMR Reg 29B)</option>
            <option value="FLPM_CERTIFICATE">FLPM Flameproof Machinery Certificate</option>
            <option value="DGMS_APPROVAL">DGMS Statutory Field Approval</option>
            <option value="FORM_IV_JOURNAL">Form IV Shift Diary Extract</option>
            <option value="OTHER">Other Statutory Colliery Record</option>
          </select>
          {errors.corrected_document_type && (
            <p className="text-[10px] text-rose-400 font-telemetry">
              {errors.corrected_document_type.message}
            </p>
          )}
        </div>

        {/* Certificate / Serial Number */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-telemetry uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-outline" />
            <span>Extracted Serial / No.</span>
          </label>
          <input
            type="text"
            {...register("corrected_serial_no")}
            placeholder="e.g. VTC/ECL/2026/0942"
            className="w-full h-8 px-2.5 rounded bg-surface-container-lowest border border-outline-variant/60 text-xs text-on-surface focus:outline-none focus:border-primary font-telemetry"
          />
          {errors.corrected_serial_no && (
            <p className="text-[10px] text-rose-400 font-telemetry">
              {errors.corrected_serial_no.message}
            </p>
          )}
        </div>

        {/* Issuing Authority */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-telemetry uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-outline" />
            <span>Issuing Authority</span>
          </label>
          <input
            type="text"
            {...register("issuing_authority")}
            placeholder="e.g. DGMS / CIMFR / ECL VTC Center"
            className="w-full h-8 px-2.5 rounded bg-surface-container-lowest border border-outline-variant/60 text-xs text-on-surface focus:outline-none focus:border-primary font-sans"
          />
        </div>

        {/* Valid From */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-telemetry uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-outline" />
            <span>Valid From (Issue Date)</span>
          </label>
          <input
            type="date"
            {...register("corrected_valid_from")}
            className="w-full h-8 px-2.5 rounded bg-surface-container-lowest border border-outline-variant/60 text-xs text-on-surface focus:outline-none focus:border-primary font-telemetry"
          />
        </div>

        {/* Valid Until / Expiry */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-telemetry uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-outline" />
            <span>Valid Until (Expiry Date) *</span>
          </label>
          <input
            type="date"
            {...register("corrected_valid_until")}
            className="w-full h-8 px-2.5 rounded bg-surface-container-lowest border border-outline-variant/60 text-xs text-on-surface focus:outline-none focus:border-primary font-telemetry"
          />
          {errors.corrected_valid_until && (
            <p className="text-[10px] text-rose-400 font-telemetry">
              {errors.corrected_valid_until.message}
            </p>
          )}
        </div>

        {/* Linked Worker Badge / User ID */}
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-[11px] font-telemetry uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-outline" />
            <span>Linked Worker Identity UUID</span>
          </label>
          <input
            type="text"
            {...register("target_user_id")}
            placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
            className="w-full h-8 px-2.5 rounded bg-surface-container-lowest border border-outline-variant/60 text-xs text-on-surface focus:outline-none focus:border-primary font-telemetry"
          />
        </div>

        {/* Review Remarks / Notes */}
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-[11px] font-telemetry uppercase tracking-wider text-on-surface-variant">
            Statutory Supervisory Review Notes
          </label>
          <textarea
            {...register("notes")}
            rows={2}
            placeholder="Add comments on physical certificate seal, watermark, or discrepancy..."
            className="w-full p-2.5 rounded bg-surface-container-lowest border border-outline-variant/60 text-xs text-on-surface focus:outline-none focus:border-primary font-sans resize-none"
          />
        </div>
      </div>

      {/* Raw OCR Text Accordion */}
      {certificate.raw_text && (
        <div className="border border-outline-variant/40 rounded overflow-hidden">
          <button
            type="button"
            onClick={() => setShowRawText(!showRawText)}
            className="w-full p-2.5 bg-surface-container-low flex items-center justify-between text-xs text-on-surface hover:bg-surface-container-high/40 transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-outline" />
              <span>Raw PaddleOCR Extracted Text Buffer</span>
            </div>
            {showRawText ? (
              <ChevronUp className="w-4 h-4 text-outline" />
            ) : (
              <ChevronDown className="w-4 h-4 text-outline" />
            )}
          </button>
          {showRawText && (
            <div className="p-3 bg-surface-container-lowest border-t border-outline-variant/30 max-h-40 overflow-y-auto">
              <pre className="text-[11px] font-telemetry text-on-surface-variant whitespace-pre-wrap leading-relaxed">
                {certificate.raw_text}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-2">
        <Button
          type="submit"
          disabled={isSaving}
          className="w-full h-9 text-xs font-semibold gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.25)]"
        >
          {isSaving ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Anchoring to Audit Ledger...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Save Statutory Verification</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default ExtractedEntityForm;
