/**
 * Field Operations, Mobile Offline Sync & Form IV Inspection Types
 * Aligned with Phase 5 FastAPI Backend schemas and DGMS CMR 2017 regulations.
 */

export type SyncStatus = "SUCCESS" | "PARTIAL" | "FAILED";

export interface SyncLog {
  sync_id: string;
  user_id: string;
  device_id: string;
  records_processed: number;
  status: SyncStatus;
  timestamp: string;
}

export interface FormIVInspection {
  id: string;
  sync_id: string;
  inspector_id: string;
  inspector_name?: string;
  location_id: string;
  location_name?: string;
  roof_bolt_torque_nm?: number;
  air_velocity_m_per_min?: number;
  gas_ch4_percent?: number;
  gas_co_ppm?: number;
  strata_remarks?: string;
  is_geotagged_nfc: boolean;
  inspection_time: string;
  created_at: string;
  evidence_urls?: string[];
}

export interface SyncLogFilterParams {
  status?: SyncStatus;
  device_id?: string;
  user_id?: string;
  skip?: number;
  limit?: number;
}

export interface FormIVFilterParams {
  location_id?: string;
  inspector_id?: string;
  skip?: number;
  limit?: number;
  search?: string;
  anomaly_only?: boolean;
}
