/**
 * Statutory Reports & PDF Exporter Types
 * Aligned with Phase 6 FastAPI Backend PDF services and CMR 2017 regulations.
 */

export type ReportType =
  | "DGMS_SHIFT_SUMMARY"
  | "MSRI_SCORECARD"
  | "AUDIT_CHAIN_VERIFICATION";

export interface ReportGeneratePayload {
  report_type: ReportType;
  start_date?: string;
  end_date?: string;
  location_id?: string;
  mine_code?: string;
  shift?: string;
}

export interface ReportMetadata {
  id: ReportType;
  title: string;
  subtitle: string;
  statutoryReference: string;
  description: string;
  badgeText: string;
  frequency: string;
  requiresParameters: boolean;
}
