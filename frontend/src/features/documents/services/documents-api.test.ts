import { describe, it, expect, vi, beforeEach } from "vitest";
import apiClient from "@/lib/api-client";
import {
  uploadDocument,
  fetchDocumentStatus,
  verifyDocumentEntities,
  listDocuments,
  FALLBACK_CERTIFICATE,
  FALLBACK_DIGITIZED_DOCUMENTS,
} from "./documents-api";

vi.mock("@/lib/api-client", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

describe("documents-api service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("uploadDocument", () => {
    it("uploads physical certificate via multipart FormData to /documents/upload", async () => {
      const mockResponse = {
        task_id: "task-test-01",
        certificate_id: "cert-01",
        status: "PENDING",
        file_url: "/uploads/cert-01.pdf",
        message: "Queued",
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockResponse });

      const file = new File(["dummy content"], "vtc_cert.pdf", { type: "application/pdf" });
      const result = await uploadDocument(file, "VTC_SLIP", "usr-01");

      expect(apiClient.post).toHaveBeenCalledWith(
        "/documents/upload",
        expect.any(FormData),
        expect.objectContaining({
          headers: { "Content-Type": "multipart/form-data" },
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it("falls back to simulated async response on network failure", async () => {
      vi.mocked(apiClient.post).mockRejectedValueOnce(new Error("Network Error"));

      const file = new File(["dummy"], "pme_form.png", { type: "image/png" });
      const result = await uploadDocument(file, "PME_RECORD");

      expect(result.status).toBe("PROCESSING");
      expect(result.task_id).toMatch(/^task-sim-/);
      expect(result.certificate_id).toBeDefined();
    });
  });

  describe("fetchDocumentStatus", () => {
    it("fetches document status from /documents/{id}", async () => {
      const mockData = {
        id: "cert-01",
        document_type: "VTC_SLIP",
        extracted_serial_no: "VTC-1234",
        processing_status: "COMPLETED",
        is_verified_by_human: false,
        file_url: "https://storage.coalguard.internal/vtc.pdf",
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockData });

      const result = await fetchDocumentStatus("cert-01");
      expect(apiClient.get).toHaveBeenCalledWith("/documents/cert-01");
      expect(result).toEqual(mockData);
    });

    it("returns matching fallback certificate when API call fails", async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error("Timeout"));

      const result = await fetchDocumentStatus("cert-ocr-f6-001");
      expect(result.id).toBe("cert-ocr-f6-001");
      expect(result.extracted_serial_no).toBe("VTC/ECL/2026/UG-9042");
    });
  });

  describe("verifyDocumentEntities", () => {
    it("sends verification payload to /documents/{id}/verify", async () => {
      const mockVerified = {
        ...FALLBACK_CERTIFICATE,
        is_verified_by_human: true,
        extracted_serial_no: "VTC-CORRECTED-99",
      };

      vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: mockVerified });

      const payload = {
        is_verified: true,
        corrected_serial_no: "VTC-CORRECTED-99",
        corrected_valid_until: "2026-12-31T00:00:00Z",
      };

      const result = await verifyDocumentEntities("cert-ocr-f6-001", payload);
      expect(apiClient.patch).toHaveBeenCalledWith("/documents/cert-ocr-f6-001/verify", payload);
      expect(result.is_verified_by_human).toBe(true);
    });

    it("falls back to simulated verification when API fails", async () => {
      vi.mocked(apiClient.patch).mockRejectedValueOnce(new Error("Offline"));
      vi.mocked(apiClient.post).mockRejectedValueOnce(new Error("Offline"));

      const payload = {
        is_verified: true,
        corrected_serial_no: "VTC-SIMULATED-LOCAL",
      };

      const result = await verifyDocumentEntities("cert-ocr-f6-001", payload);
      expect(result.is_verified_by_human).toBe(true);
      expect(result.extracted_serial_no).toBe("VTC-SIMULATED-LOCAL");
    });
  });

  describe("listDocuments", () => {
    it("returns list of documents from /documents", async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: FALLBACK_DIGITIZED_DOCUMENTS });

      const result = await listDocuments({ processing_status: "COMPLETED" });
      expect(apiClient.get).toHaveBeenCalledWith("/documents", {
        params: { processing_status: "COMPLETED" },
      });
      expect(result).toEqual(FALLBACK_DIGITIZED_DOCUMENTS);
    });

    it("falls back to FALLBACK_DIGITIZED_DOCUMENTS on error", async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error("Network Error"));

      const result = await listDocuments();
      expect(result).toEqual(FALLBACK_DIGITIZED_DOCUMENTS);
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
