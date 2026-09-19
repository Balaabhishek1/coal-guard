import { describe, it, expect, vi, beforeEach } from "vitest";
import apiClient from "@/lib/api-client";
import {
  fetchSyncLogs,
  fetchFormIVInspections,
  fetchInspectionById,
  FALLBACK_SYNC_LOGS,
  FALLBACK_FORM_IV_INSPECTIONS,
} from "./field-ops-api";

vi.mock("@/lib/api-client", () => ({
  default: {
    get: vi.fn(),
  },
}));

describe("field-ops-api service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchSyncLogs", () => {
    it("returns sync logs from backend API on success", async () => {
      const mockData = [
        {
          sync_id: "sync-test-01",
          device_id: "DEVICE-UG-01",
          user_id: "user-01",
          records_processed: 14,
          status: "SUCCESS",
          timestamp: "2026-09-20T08:30:00Z",
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockData });

      const result = await fetchSyncLogs({ limit: 20 });
      expect(apiClient.get).toHaveBeenCalledWith("/sync/logs", {
        params: { limit: 20 },
      });
      expect(result).toEqual(mockData);
    });

    it("falls back to FALLBACK_SYNC_LOGS on network error", async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error("Network Error"));

      const result = await fetchSyncLogs();
      expect(result).toEqual(FALLBACK_SYNC_LOGS);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("fetchFormIVInspections", () => {
    it("returns Form IV inspections from API on success", async () => {
      const mockData = [
        {
          id: "insp-01",
          sync_id: "sync-01",
          location_id: "loc-01",
          location_name: "Seam-III East Tailgate",
          inspector_id: "insp-user-01",
          inspector_name: "Amitabh Banerjee",
          inspection_time: "2026-09-20T07:15:00Z",
          gas_ch4_percent: 0.82,
          gas_co_ppm: 12.5,
          air_velocity_m_per_min: 24.0,
          roof_bolt_torque_nm: 85.0,
          is_geotagged_nfc: true,
          evidence_urls: ["https://storage.coalguard.internal/webp/insp-01-01.webp"],
          strata_remarks: "Urgent: Air velocity below statutory threshold.",
          created_at: "2026-09-20T07:30:00Z",
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockData });

      const result = await fetchFormIVInspections({ location_id: "loc-01" });
      expect(apiClient.get).toHaveBeenCalledWith("/sync/inspections/form-iv", {
        params: { location_id: "loc-01" },
      });
      expect(result).toEqual(mockData);
    });

    it("falls back to FALLBACK_FORM_IV_INSPECTIONS on API error", async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error("Connection refused"));

      const result = await fetchFormIVInspections();
      expect(result).toEqual(FALLBACK_FORM_IV_INSPECTIONS);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("fetchInspectionById", () => {
    it("returns inspection details by id from API on success", async () => {
      const mockDetail = {
        id: "insp-01",
        sync_id: "sync-01",
        location_id: "loc-01",
        location_name: "Seam-III East Tailgate",
        inspector_id: "insp-user-01",
        inspector_name: "Amitabh Banerjee",
        inspection_time: "2026-09-20T07:15:00Z",
        gas_ch4_percent: 0.82,
        gas_co_ppm: 12.5,
        air_velocity_m_per_min: 24.0,
        roof_bolt_torque_nm: 85.0,
        is_geotagged_nfc: true,
        evidence_urls: ["https://storage.coalguard.internal/webp/insp-01-01.webp"],
        strata_remarks: "Urgent: Air velocity below statutory threshold.",
        created_at: "2026-09-20T07:30:00Z",
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockDetail });

      const result = await fetchInspectionById("insp-01");
      expect(apiClient.get).toHaveBeenCalledWith("/sync/inspections/form-iv/insp-01");
      expect(result).toEqual(mockDetail);
    });

    it("falls back to matching fallback record when API fails", async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error("Backend Offline"));

      const result = await fetchInspectionById("f4-901-a1");
      expect(result.id).toBe("f4-901-a1");
      expect(result.location_name).toBe("Seam-I Return Airway 4B");
    });

    it("throws error when ID is neither on backend nor in fallback seed", async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error("Not found"));

      await expect(fetchInspectionById("non-existent-id")).rejects.toThrow("Not found");
    });
  });
});
