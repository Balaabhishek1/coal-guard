import { describe, it, expect, vi, beforeEach } from "vitest";
import apiClient from "@/lib/api-client";
import {
  fetchRecentAccessLogs,
  submitAccessAttempt,
  fetchWsStats,
} from "./gate-api";
import type { EdgeAccessEventPayload } from "@/types/vision-edge";

vi.mock("@/lib/api-client", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("gate-api service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchRecentAccessLogs", () => {
    it("returns access logs on successful API response", async () => {
      const mockLogs = [
        {
          access_log_id: "log-123",
          rfid_tag: "RFID-001",
          location_id: "loc-01",
          worker_name: "Test Worker",
          optical_compliance: true,
          credential_eligibility: true,
          gate_actuated: true,
          wear_states: { hardhat_worn: true, vest_worn: true, scsr_worn: true },
          timestamp: "2026-09-20T00:00:00Z",
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockLogs });

      const logs = await fetchRecentAccessLogs(10);
      expect(apiClient.get).toHaveBeenCalledWith("/vision-edge/logs?limit=10");
      expect(logs).toEqual(mockLogs);
    });

    it("falls back to simulated access logs on network failure", async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error("Network Down"));

      const logs = await fetchRecentAccessLogs(20);
      expect(apiClient.get).toHaveBeenCalledWith("/vision-edge/logs?limit=20");
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].rfid_tag).toBe("RFID-MINER-0091");
    });
  });

  describe("submitAccessAttempt", () => {
    it("posts edge access attempt payload to API endpoint", async () => {
      const payload: EdgeAccessEventPayload = {
        rfid_tag: "RFID-999",
        location_id: "loc-gate-01",
        optical_compliance: true,
        credential_eligibility: true,
        gate_actuated: true,
        wear_states: { hardhat_worn: true, vest_worn: true, scsr_worn: true },
        bounding_boxes: [],
      };

      const mockResponse = {
        status: "logged",
        access_log_id: "log-abc-999",
        violation_ticket_created: false,
        timestamp: "2026-09-20T00:00:00Z",
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockResponse });

      const result = await submitAccessAttempt(payload);
      expect(apiClient.post).toHaveBeenCalledWith(
        "/vision-edge/events/access-attempt",
        payload
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe("fetchWsStats", () => {
    it("queries WebSocket gateway health stats", async () => {
      const mockStats = {
        active_clients: 3,
        monitored_channels: ["control_room", "telemetry"],
        listener_running: true,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockStats });

      const result = await fetchWsStats();
      expect(apiClient.get).toHaveBeenCalledWith("/ws/stats");
      expect(result).toEqual(mockStats);
    });
  });
});
