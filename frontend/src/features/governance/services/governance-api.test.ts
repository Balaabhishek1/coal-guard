import { describe, it, expect, vi, beforeEach } from "vitest";
import apiClient from "@/lib/api-client";
import {
  fetchViolations,
  updateViolationStatus,
  fetchAuditLedger,
  verifyAuditChain,
  triggerSlaSweep,
  FALLBACK_VIOLATIONS,
  FALLBACK_AUDIT_LEDGER,
} from "./governance-api";

vi.mock("@/lib/api-client", () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
  },
}));

describe("governance-api service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchViolations", () => {
    it("returns violations from API on success", async () => {
      const mockData = [
        {
          id: "v-test-01",
          location_id: "loc-01",
          violation_type: "MISSING_SCSR",
          severity: "CRITICAL",
          status: "DETECTED",
          deadline_sla: "2026-09-20T12:00:00Z",
          created_at: "2026-09-20T08:00:00Z",
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockData });

      const result = await fetchViolations({ severity: "CRITICAL" });
      expect(apiClient.get).toHaveBeenCalledWith("/governance/violations", {
        params: { severity: "CRITICAL" },
      });
      expect(result).toEqual(mockData);
    });

    it("falls back to FALLBACK_VIOLATIONS on network failure", async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error("Network Error"));

      const result = await fetchViolations();
      expect(result).toEqual(FALLBACK_VIOLATIONS);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("updateViolationStatus", () => {
    it("patches status transition with remarks", async () => {
      const mockUpdated = {
        id: "v-test-01",
        status: "NOTICE_SERVED",
        severity: "CRITICAL",
      };

      vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: mockUpdated });

      const result = await updateViolationStatus(
        "v-test-01",
        "NOTICE_SERVED",
        "Formal notice memo dispatched"
      );

      expect(apiClient.patch).toHaveBeenCalledWith(
        "/governance/violations/v-test-01/status",
        {
          status: "NOTICE_SERVED",
          remarks: "Formal notice memo dispatched",
        }
      );
      expect(result).toEqual(mockUpdated);
    });
  });

  describe("fetchAuditLedger", () => {
    it("fetches audit ledger with pagination parameters", async () => {
      const mockRecords = [
        {
          seq_id: 101,
          timestamp: "2026-09-20T10:00:00Z",
          action_type: "STATUTORY_CLOSEOUT",
          payload: { ticket_id: "v-test-01" },
          previous_hash: "0000000000000000000000000000000000000000000000000000000000000000",
          current_hash: "a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90",
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockRecords });

      const result = await fetchAuditLedger(2, 20);
      expect(apiClient.get).toHaveBeenCalledWith("/governance/audit-ledger", {
        params: { skip: 20, limit: 20 },
      });
      expect(result).toEqual(mockRecords);
    });

    it("falls back to FALLBACK_AUDIT_LEDGER on error", async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error("Timeout"));

      const result = await fetchAuditLedger(1, 50);
      expect(result).toEqual(FALLBACK_AUDIT_LEDGER);
    });
  });

  describe("verifyAuditChain", () => {
    it("calls verification endpoint and returns parsed integrity report", async () => {
      const mockResponse = {
        valid: true,
        total_records: 1045,
        total_blocks_verified: 1045,
        reason: "Zero corruption",
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockResponse });

      const result = await verifyAuditChain();
      expect(apiClient.get).toHaveBeenCalledWith("/governance/audit-ledger/verify");
      expect(result.valid).toBe(true);
      expect(result.total_blocks_verified).toBe(1045);
    });

    it("returns valid fallback on error", async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error("Offline"));

      const result = await verifyAuditChain();
      expect(result.valid).toBe(true);
      expect(result.total_blocks_verified).toBe(1045);
    });
  });

  describe("triggerSlaSweep", () => {
    it("triggers POST to /governance/sla/sweep", async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { escalated_count: 3 } });

      const result = await triggerSlaSweep();
      expect(apiClient.post).toHaveBeenCalledWith("/governance/sla/sweep");
      expect(result).toEqual({ escalated_count: 3 });
    });
  });
});
