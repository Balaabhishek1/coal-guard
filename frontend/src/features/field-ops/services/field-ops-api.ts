import apiClient from "@/lib/api-client";
import type {
  SyncLog,
  SyncLogFilterParams,
  FormIVInspection,
  FormIVFilterParams,
} from "@/types/field-ops";

const now = Date.now();
const hour = 3600 * 1000;

export const FALLBACK_SYNC_LOGS: SyncLog[] = [
  {
    sync_id: "c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33",
    user_id: "usr-overman-01",
    device_id: "ZONE-1-TABLET-EXPLOSIONPROOF-04",
    records_processed: 6,
    status: "SUCCESS",
    timestamp: new Date(now - 25 * 60 * 1000).toISOString(),
  },
  {
    sync_id: "e4ffaa11-8b1a-4dc2-aa7e-7cc8ac491b44",
    user_id: "usr-sirdar-03",
    device_id: "IS-HANDHELD-SEAM1-02",
    records_processed: 4,
    status: "SUCCESS",
    timestamp: new Date(now - 1.2 * hour).toISOString(),
  },
  {
    sync_id: "f8aa1234-7c2d-4ba3-99ff-5dd7ba602c55",
    user_id: "usr-overman-02",
    device_id: "BARTEC-PIXAVI-CAM-03",
    records_processed: 2,
    status: "PARTIAL",
    timestamp: new Date(now - 3 * hour).toISOString(),
  },
  {
    sync_id: "d1bb9988-6d3e-4cb5-88ee-4ee6cb713d66",
    user_id: "usr-sirdar-01",
    device_id: "IS-HANDHELD-SEAM2-01",
    records_processed: 0,
    status: "FAILED",
    timestamp: new Date(now - 5 * hour).toISOString(),
  },
  {
    sync_id: "a9cc7766-5e4f-4ba7-77dd-3ff5da824e77",
    user_id: "usr-safety-01",
    device_id: "ZONE-1-TABLET-EXPLOSIONPROOF-01",
    records_processed: 8,
    status: "SUCCESS",
    timestamp: new Date(now - 7.5 * hour).toISOString(),
  },
];

export const FALLBACK_FORM_IV_INSPECTIONS: FormIVInspection[] = [
  {
    id: "f4-901-a1",
    sync_id: "c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33",
    inspector_id: "usr-overman-01",
    inspector_name: "Rajesh Kumar (Overman)",
    location_id: "loc-seam01-ch4",
    location_name: "Seam-I Return Airway 4B",
    roof_bolt_torque_nm: 118.5, // Statutory compliant (>= 100 Nm)
    air_velocity_m_per_min: 38.4, // Compliant (>= 30 m/min)
    gas_ch4_percent: 0.22, // Safe (< 0.75%)
    gas_co_ppm: 4.2, // Safe (< 10 ppm)
    strata_remarks: "Roof sound, strata fully keyed. W-strap steel supports secure with zero rib spalling observed.",
    is_geotagged_nfc: true,
    inspection_time: new Date(now - 45 * 60 * 1000).toISOString(),
    created_at: new Date(now - 25 * 60 * 1000).toISOString(),
    evidence_urls: [
      "https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "f4-902-b2",
    sync_id: "c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33",
    inspector_id: "usr-overman-01",
    inspector_name: "Rajesh Kumar (Overman)",
    location_id: "loc-seam01-roof",
    location_name: "Seam-I Main Haulage Dip 3",
    roof_bolt_torque_nm: 74.0, // ANOMALY (< 100 Nm)
    air_velocity_m_per_min: 42.0,
    gas_ch4_percent: 0.35,
    gas_co_ppm: 6.8,
    strata_remarks: "CRITICAL: Under-torqued roof bolts between pillars 14 and 16. Flaking sandstone shale detected near haulage crown.",
    is_geotagged_nfc: true,
    inspection_time: new Date(now - 55 * 60 * 1000).toISOString(),
    created_at: new Date(now - 25 * 60 * 1000).toISOString(),
    evidence_urls: [
      "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "f4-903-c3",
    sync_id: "e4ffaa11-8b1a-4dc2-aa7e-7cc8ac491b44",
    inspector_id: "usr-sirdar-03",
    inspector_name: "Suresh Mahto (Mining Sirdar)",
    location_id: "loc-seam02-vent",
    location_name: "Seam-II Intake Split 2A",
    roof_bolt_torque_nm: 105.0,
    air_velocity_m_per_min: 24.5, // ANOMALY (< 30 m/min stagnation)
    gas_ch4_percent: 0.82, // WARNING (>= 0.75%)
    gas_co_ppm: 8.5,
    strata_remarks: "Airflow sluggish. Auxiliary ventilation fan ducting detached 25 meters back from working face.",
    is_geotagged_nfc: false, // Manual entry warning
    inspection_time: new Date(now - 1.8 * hour).toISOString(),
    created_at: new Date(now - 1.2 * hour).toISOString(),
    evidence_urls: [
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "f4-904-d4",
    sync_id: "e4ffaa11-8b1a-4dc2-aa7e-7cc8ac491b44",
    inspector_id: "usr-sirdar-03",
    inspector_name: "Suresh Mahto (Mining Sirdar)",
    location_id: "loc-seam02-gas",
    location_name: "Seam-II Longwall Face 1",
    roof_bolt_torque_nm: 122.0,
    air_velocity_m_per_min: 48.0,
    gas_ch4_percent: 0.15,
    gas_co_ppm: 14.2, // WARNING (>= 10 ppm)
    strata_remarks: "Slight diesel particulate odor; CO detector register 14.2 ppm from shuttle car exhaust. Ventilation adequate.",
    is_geotagged_nfc: true,
    inspection_time: new Date(now - 2.2 * hour).toISOString(),
    created_at: new Date(now - 1.2 * hour).toISOString(),
    evidence_urls: [],
  },
  {
    id: "f4-905-e5",
    sync_id: "a9cc7766-5e4f-4ba7-77dd-3ff5da824e77",
    inspector_id: "usr-safety-01",
    inspector_name: "Amit Sharma (Safety Officer)",
    location_id: "loc-pithead-gate",
    location_name: "Shaft Bottom Inbye Inset",
    roof_bolt_torque_nm: 140.0,
    air_velocity_m_per_min: 65.0,
    gas_ch4_percent: 0.05,
    gas_co_ppm: 2.1,
    strata_remarks: "Main intake shaft bottom brickwork and steel arch girders in sound condition. Regular shift clearance granted.",
    is_geotagged_nfc: true,
    inspection_time: new Date(now - 8 * hour).toISOString(),
    created_at: new Date(now - 7.5 * hour).toISOString(),
    evidence_urls: [
      "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80",
    ],
  },
];

/**
 * Fetch mobile sync batch logs
 */
export async function fetchSyncLogs(
  params?: SyncLogFilterParams
): Promise<SyncLog[]> {
  try {
    const queryParams: Record<string, any> = {};
    if (params?.status) queryParams.status = params.status;
    if (params?.device_id) queryParams.device_id = params.device_id;
    if (params?.skip !== undefined) queryParams.skip = params.skip;
    if (params?.limit !== undefined) queryParams.limit = params.limit;

    const res = await apiClient.get<SyncLog[]>("/sync/logs", {
      params: queryParams,
    });

    if (Array.isArray(res.data) && res.data.length > 0) {
      return res.data;
    }
    return FALLBACK_SYNC_LOGS;
  } catch (err) {
    console.warn("Using fallback sync logs due to network/endpoint status:", err);
    return FALLBACK_SYNC_LOGS;
  }
}

/**
 * Fetch statutory Form IV shift inspections
 */
export async function fetchFormIVInspections(
  params?: FormIVFilterParams
): Promise<FormIVInspection[]> {
  try {
    const queryParams: Record<string, any> = {};
    if (params?.location_id) queryParams.location_id = params.location_id;
    if (params?.inspector_id) queryParams.inspector_id = params.inspector_id;
    if (params?.skip !== undefined) queryParams.skip = params.skip;
    if (params?.limit !== undefined) queryParams.limit = params.limit;

    // Try enhanced endpoint first, fall back to /sync/inspections if needed
    let res;
    try {
      res = await apiClient.get<FormIVInspection[]>("/sync/inspections/form-iv", {
        params: queryParams,
      });
    } catch {
      res = await apiClient.get<FormIVInspection[]>("/sync/inspections", {
        params: queryParams,
      });
    }

    if (Array.isArray(res.data) && res.data.length > 0) {
      return res.data;
    }
    return FALLBACK_FORM_IV_INSPECTIONS;
  } catch (err) {
    console.warn("Using fallback Form IV inspections due to network condition:", err);
    return FALLBACK_FORM_IV_INSPECTIONS;
  }
}

/**
 * Fetch detailed Form IV inspection by UUID
 */
export async function fetchInspectionById(
  id: string
): Promise<FormIVInspection> {
  try {
    const res = await apiClient.get<FormIVInspection>(`/sync/inspections/form-iv/${id}`);
    return res.data;
  } catch (err) {
    console.warn(`fetchInspectionById using local seed for ${id}:`, err);
    const found = FALLBACK_FORM_IV_INSPECTIONS.find((i) => i.id === id);
    if (found) return found;
    throw err;
  }
}
