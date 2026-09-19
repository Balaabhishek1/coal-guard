import { describe, it, expect, vi, beforeEach } from "vitest";
import apiClient from "@/lib/api-client";
import {
  fetchHardwareMatrix,
  registerDevice,
  sendHeartbeat,
  FALLBACK_HARDWARE_DEVICES,
} from "./hardware-api";
import type { HardwareRegisterPayload } from "@/types/hardware";

vi.mock("@/lib/api-client", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("hardware-api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchHardwareMatrix", () => {
    it("returns devices from the API when available", async () => {
      const mockDevices = [
        {
          hardware_id: "hw-test-01",
          device_name: "TEST-SENSOR",
          device_type: "GAS_SENSOR_CH4",
          is_online: true,
          location_name: "Shaft 1",
          ip_address: "192.168.1.10",
          protocol: "MQTT",
          latency_ms: 15.0,
          last_heartbeat: new Date().toISOString(),
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockDevices });

      const result = await fetchHardwareMatrix();
      expect(apiClient.get).toHaveBeenCalledWith("/hardware/matrix");
      expect(result).toEqual(mockDevices);
    });

    it("falls back to FALLBACK_HARDWARE_DEVICES when API returns empty array", async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [] });

      const result = await fetchHardwareMatrix();
      expect(apiClient.get).toHaveBeenCalledWith("/hardware/matrix");
      expect(result).toEqual(FALLBACK_HARDWARE_DEVICES);
    });

    it("falls back to FALLBACK_HARDWARE_DEVICES on API network error", async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error("Network Error"));

      const result = await fetchHardwareMatrix();
      expect(apiClient.get).toHaveBeenCalledWith("/hardware/matrix");
      expect(result).toEqual(FALLBACK_HARDWARE_DEVICES);
    });
  });

  describe("registerDevice", () => {
    it("submits hardware payload and returns registered response", async () => {
      const payload: HardwareRegisterPayload = {
        device_name: "NEW-ANEMO-01",
        device_type: "AIR_MONITOR",
        location_id: "loc-intake-02",
        ip_address: "192.168.10.99",
        protocol: "MODBUS",
      };

      const mockResponse = {
        id: "hw-gen-1234",
        device_name: payload.device_name,
        device_type: payload.device_type,
        location_id: payload.location_id,
        ip_address: payload.ip_address,
        protocol: payload.protocol,
        is_online: true,
        created_at: new Date().toISOString(),
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockResponse });

      const result = await registerDevice(payload);
      expect(apiClient.post).toHaveBeenCalledWith("/hardware/register", payload);
      expect(result).toEqual(mockResponse);
    });
  });

  describe("sendHeartbeat", () => {
    it("transmits edge ping payload to /hardware/heartbeat", async () => {
      const pingPayload = {
        hardware_id: "hw-cam-01",
        latency_ms: 22.4,
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: { status: "acknowledged", is_online: true },
      });

      const result = await sendHeartbeat(pingPayload);
      expect(apiClient.post).toHaveBeenCalledWith("/hardware/heartbeat", pingPayload);
      expect(result).toEqual({ status: "acknowledged", is_online: true });
    });
  });
});
