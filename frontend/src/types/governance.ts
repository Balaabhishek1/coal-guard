/**
 * Statutory Governance & Cryptographic Audit Ledger Data Contracts
 * Aligned strictly with Phase 3 FastAPI backend schemas and CMR 2017 regulations.
 */

export type ViolationSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type ViolationStatus =
  | "DETECTED"
  | "NOTICE_SERVED"
  | "ACTION_TAKEN"
  | "VERIFIED"
  | "STATUTORY_CLOSEOUT";

export interface ComplianceViolation {
  id: string;
  location_id: string;
  reporter_id?: string;
  contractor_id?: string;
  violation_type: string;
  title?: string;
  description?: string;
  severity: ViolationSeverity;
  status: ViolationStatus;
  deadline_sla: string;
  created_at: string;
  resolved_at?: string;
  location_name?: string;
  reporter_name?: string;
}

export interface ViolationCreatePayload {
  location_id: string;
  contractor_id?: string;
  violation_type: string;
  title: string;
  description?: string;
  severity?: ViolationSeverity;
  deadline_sla?: string;
}

export interface ViolationStatusTransitionPayload {
  status: ViolationStatus;
  remarks?: string;
}

export interface ViolationFilterParams {
  severity?: ViolationSeverity;
  status?: ViolationStatus;
  location_id?: string;
  contractor_id?: string;
  search?: string;
  skip?: number;
  limit?: number;
}

export interface AuditLedgerEntry {
  seq_id: number;
  timestamp: string;
  actor_id?: string;
  action_type: string;
  payload: Record<string, any>;
  previous_hash: string;
  current_hash: string;
}

export interface ChainVerificationResult {
  valid: boolean;
  broken_seq_id?: number;
  total_blocks_verified: number;
  total_records?: number;
  reason?: string;
}

export interface AuditLedgerParams {
  skip?: number;
  limit?: number;
}
