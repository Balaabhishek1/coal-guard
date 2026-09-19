/**
 * Hardware Diagnostics & Edge Gateway Types
 * Aligned strictly with Phase 2 FastAPI schemas and colliery hardware registry.
 */

export type DeviceType =
  | "TURNSTILE"
  | "CCTV_CAMERA"
  | "GAS_SENSOR_CH4"
  | "GAS_SENSOR_CO"
  | "AIR_MONITOR"
  | "RFID_BEACON";

export type ProtocolType =
  | "MODBUS"
  | "RTSP"
  | "MQTT"
  | "WIEGAND"
  | "HTTP";

export type DeviceStatus = "ONLINE" | "OFFLINE" | "DEGRADED";

export interface HardwareDevice {
  hardware_id: string;
  device_name: string;
  device_type: DeviceType;
  is_online: boolean;
  last_heartbeat?: string | null;
  location_id?: string | null;
  location_name?: string | null;
  ip_address?: string | null;
  protocol?: ProtocolType | null;
  latency_ms?: number | null;
}

export interface HardwareRegisterPayload {
  device_name: string;
  device_type: DeviceType;
  location_id?: string | null;
  ip_address?: string | null;
  protocol: ProtocolType;
}

export interface HardwareRegisterResponse {
  id: string;
  device_name: string;
  device_type: string;
  location_id?: string | null;
  ip_address?: string | null;
  protocol: string;
  is_online: boolean;
  last_heartbeat?: string | null;
  created_at: string;
}

export interface HeartbeatPayload {
  hardware_id: string;
  status?: DeviceStatus;
  latency_ms?: number;
}
