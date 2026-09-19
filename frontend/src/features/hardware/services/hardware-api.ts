import apiClient from "@/lib/api-client";
import type {
  HardwareDevice,
  HardwareRegisterPayload,
  HardwareRegisterResponse,
  HeartbeatPayload,
} from "@/types/hardware";

// Fallback seed devices for colliery control room simulation if DB is empty
export const FALLBACK_HARDWARE_DEVICES: HardwareDevice[] = [
  {
    hardware_id: "hw-cam-01",
    device_name: "CAM-PITHEAD-01-OPTICAL",
    device_type: "CCTV_CAMERA",
    is_online: true,
    location_name: "Pithead Incline Shaft Collar",
    ip_address: "192.168.10.14",
    protocol: "RTSP",
    latency_ms: 24.2,
    last_heartbeat: new Date().toISOString(),
  },
  {
    hardware_id: "hw-turnstile-01",
    device_name: "TURNSTILE-GATE-MAIN-01",
    device_type: "TURNSTILE",
    is_online: true,
    location_name: "Pithead Descent Checkpoint",
    ip_address: "192.168.10.21",
    protocol: "MODBUS",
    latency_ms: 18.5,
    last_heartbeat: new Date().toISOString(),
  },
  {
    hardware_id: "hw-ch4-seam01",
    device_name: "ETD-SEAM-01-CH4-MONITOR",
    device_type: "GAS_SENSOR_CH4",
    is_online: true,
    location_name: "Seam-I Return Airway 4B",
    ip_address: "192.168.20.101",
    protocol: "MQTT",
    latency_ms: 38.7,
    last_heartbeat: new Date().toISOString(),
  },
  {
    hardware_id: "hw-co-seam01",
    device_name: "ETD-SEAM-01-CO-TRANSDUCER",
    device_type: "GAS_SENSOR_CO",
    is_online: true,
    location_name: "Seam-I Intake Gallery 2A",
    ip_address: "192.168.20.102",
    protocol: "MODBUS",
    latency_ms: 42.1,
    last_heartbeat: new Date().toISOString(),
  },
  {
    hardware_id: "hw-air-01",
    device_name: "AIR-VELOCITY-ANEMO-03",
    device_type: "AIR_MONITOR",
    is_online: true,
    location_name: "Main Fan Evasee Exhaust",
    ip_address: "192.168.10.55",
    protocol: "MODBUS",
    latency_ms: 12.8,
    last_heartbeat: new Date().toISOString(),
  },
  {
    hardware_id: "hw-cam-deep",
    device_name: "CAM-SEAM02-HAULAGE-04",
    device_type: "CCTV_CAMERA",
    is_online: false,
    location_name: "Seam-II Haulage Junction",
    ip_address: "192.168.30.12",
    protocol: "RTSP",
    latency_ms: 310.0,
    last_heartbeat: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    hardware_id: "hw-rfid-incline",
    device_name: "RFID-BEACON-SHAFT-BOTTOM",
    device_type: "RFID_BEACON",
    is_online: true,
    location_name: "Shaft Bottom Inbye Inset",
    ip_address: "192.168.10.88",
    protocol: "WIEGAND",
    latency_ms: 82.4,
    last_heartbeat: new Date().toISOString(),
  },
];

/**
 * Fetch diagnostic hardware health matrix across colliery
 */
export async function fetchHardwareMatrix(): Promise<HardwareDevice[]> {
  try {
    const response = await apiClient.get<HardwareDevice[]>("/hardware/matrix");
    if (Array.isArray(response.data) && response.data.length > 0) {
      return response.data;
    }
    return FALLBACK_HARDWARE_DEVICES;
  } catch (err) {
    console.warn("Using fallback hardware matrix due to network/database initialization:", err);
    return FALLBACK_HARDWARE_DEVICES;
  }
}

/**
 * Register a new colliery hardware asset into the network
 */
export async function registerDevice(
  payload: HardwareRegisterPayload
): Promise<HardwareRegisterResponse> {
  const response = await apiClient.post<HardwareRegisterResponse>(
    "/hardware/register",
    payload
  );
  return response.data;
}

/**
 * Transmit heartbeat ping for an edge hardware node
 */
export async function sendHeartbeat(
  payload: HeartbeatPayload
): Promise<{ status: string; is_online: boolean }> {
  const response = await apiClient.post("/hardware/heartbeat", payload);
  return response.data;
}
