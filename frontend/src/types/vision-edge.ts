/**
 * Vision Edge & Pithead Gate Real-Time Data Types
 * Aligned strictly with Phase 4 FastAPI WebSocket schemas and Redis Pub/Sub events.
 */

export interface WearStateDetails {
  hardhat_worn: boolean;
  vest_worn: boolean;
  scsr_worn: boolean;
}

export interface BoundingBox {
  class_name: string;
  confidence: number;
  x: number; // Normalized 0..1 or pixel value
  y: number;
  w: number;
  h: number;
}

export interface EdgeAccessEventPayload {
  rfid_tag: string;
  location_id: string;
  optical_compliance: boolean;
  credential_eligibility: boolean;
  gate_actuated: boolean;
  wear_states: WearStateDetails;
  bounding_boxes: BoundingBox[];
  worker_name?: string;
  worker_designation?: string;
  snapshot_crop_url?: string;
  timestamp?: string;
  access_log_id?: string;
  violation_ticket_created?: boolean;
}

export type WSEventType =
  | "GATE_ACCESS_ATTEMPT"
  | "GAS_SPIKE_ALERT"
  | "HARDWARE_OFFLINE"
  | "GOVERNANCE_ESCALATION"
  | "CONNECTED"
  | "PONG";

export interface WSEventMessage<T = Record<string, unknown>> {
  event_type: WSEventType;
  channel?: string;
  data: T;
  timestamp: string;
}

export interface GateCameraFeed {
  id: string;
  name: string;
  location: string;
  streamUrl?: string;
  status: "ONLINE" | "OFFLINE" | "DEGRADED";
  fps: number;
  resolution: string;
  latencyMs: number;
}

export interface LiveAlert {
  id: string;
  event_type: WSEventType;
  severity: "CRITICAL" | "WARNING" | "INFO";
  title: string;
  message: string;
  statutory_rule?: string;
  timestamp: string;
  acknowledged: boolean;
}
