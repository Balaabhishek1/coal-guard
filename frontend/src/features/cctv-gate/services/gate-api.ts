import apiClient from "@/lib/api-client";
import type { EdgeAccessEventPayload } from "@/types/vision-edge";

export interface AccessAttemptLogResponse {
  access_log_id: string;
  rfid_tag: string;
  location_id: string;
  worker_id?: string;
  worker_name?: string;
  optical_compliance: boolean;
  credential_eligibility: boolean;
  gate_actuated: boolean;
  wear_states: {
    hardhat_worn: boolean;
    vest_worn: boolean;
    scsr_worn: boolean;
  };
  snapshot_crop_url?: string;
  timestamp: string;
}

export interface AccessAttemptSubmitResponse {
  status: string;
  access_log_id: string;
  violation_ticket_created: boolean;
  violation_id?: string;
  timestamp: string;
}

export interface WsStatsResponse {
  active_clients: number;
  monitored_channels: string[];
  listener_running: boolean;
}

/**
 * Fetch historical access logs from the vision-edge service
 */
export async function fetchRecentAccessLogs(
  limit: number = 20
): Promise<AccessAttemptLogResponse[]> {
  try {
    const response = await apiClient.get<AccessAttemptLogResponse[]>(
      `/vision-edge/logs?limit=${limit}`
    );
    return response.data;
  } catch (err) {
    console.warn("Using simulated access attempt logs:", err);
    return [
      {
        access_log_id: "log-seed-01",
        rfid_tag: "RFID-MINER-0091",
        location_id: "loc-pithead-gate-01",
        worker_name: "Ramesh Kumar (Face Driller)",
        optical_compliance: true,
        credential_eligibility: true,
        gate_actuated: true,
        wear_states: { hardhat_worn: true, vest_worn: true, scsr_worn: true },
        timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      },
      {
        access_log_id: "log-seed-02",
        rfid_tag: "RFID-MINER-0044",
        location_id: "loc-pithead-gate-01",
        worker_name: "Sanjay Murmu (Shotfirer)",
        optical_compliance: false,
        credential_eligibility: true,
        gate_actuated: false,
        wear_states: { hardhat_worn: true, vest_worn: true, scsr_worn: false },
        timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
      },
      {
        access_log_id: "log-seed-03",
        rfid_tag: "RFID-MINER-0012",
        location_id: "loc-pithead-gate-01",
        worker_name: "Alok Chatterjee (Overman)",
        optical_compliance: true,
        credential_eligibility: true,
        gate_actuated: true,
        wear_states: { hardhat_worn: true, vest_worn: true, scsr_worn: true },
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      },
    ];
  }
}

/**
 * Ingest post-turnstile actuation metadata from edge vision mini-PCs
 */
export async function submitAccessAttempt(
  payload: EdgeAccessEventPayload
): Promise<AccessAttemptSubmitResponse> {
  const response = await apiClient.post<AccessAttemptSubmitResponse>(
    "/vision-edge/events/access-attempt",
    payload
  );
  return response.data;
}

/**
 * Retrieve active WebSocket gateway connection count and channel statuses
 */
export async function fetchWsStats(): Promise<WsStatsResponse> {
  const response = await apiClient.get<WsStatsResponse>("/ws/stats");
  return response.data;
}
