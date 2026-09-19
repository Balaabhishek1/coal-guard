/**
 * Document Digitization & OCR Types
 * Aligned with Phase 6 FastAPI Backend schemas and DGMS statutory compliance.
 */

export type ProcessingStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export type DocumentType =
  | "VTC_SLIP"
  | "PME_RECORD"
  | "FLPM_CERTIFICATE"
  | "DGMS_APPROVAL"
  | "FORM_IV_JOURNAL"
  | "OTHER";

export interface DocumentUploadResponse {
  task_id: string;
  certificate_id: string;
  document_id?: string;
  status: ProcessingStatus | string;
  file_url: string;
  message?: string;
}

export interface DigitizedCertificate {
  id: string;
  document_type: DocumentType | string;
  extracted_serial_no?: string | null;
  issuing_authority?: string | null;
  target_user_id?: string | null;
  target_hardware_id?: string | null;
  valid_from?: string | null;
  valid_until?: string | null;
  raw_text?: string | null;
  file_url: string;
  processing_status: ProcessingStatus;
  is_verified_by_human: boolean;
  created_at?: string;
}

export interface DocumentVerifyPayload {
  is_verified: boolean;
  corrected_document_type?: string | null;
  corrected_serial_no?: string | null;
  corrected_valid_from?: string | null;
  corrected_valid_until?: string | null;
  target_user_id?: string | null;
  target_hardware_id?: string | null;
  notes?: string | null;
}

export interface DocumentListFilterParams {
  document_type?: string;
  processing_status?: ProcessingStatus;
  is_verified?: boolean;
  skip?: number;
  limit?: number;
}
