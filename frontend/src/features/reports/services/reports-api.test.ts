import { describe, it, expect, vi, beforeEach } from "vitest";
import apiClient from "@/lib/api-client";
import { downloadReport, triggerBlobDownload } from "./reports-api";

vi.mock("@/lib/api-client", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("reports-api service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("downloadReport", () => {
    it("requests report binary blob from /reports/generate", async () => {
      const mockBlob = new Blob(["%PDF-1.4 dummy pdf content"], {
        type: "application/pdf",
      });

      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockBlob });

      const result = await downloadReport({
        report_type: "DGMS_SHIFT_SUMMARY",
        mine_code: "MINE-ALPHA-01",
        shift: "SHIFT_1",
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        "/reports/generate",
        expect.objectContaining({
          report_type: "DGMS_SHIFT_SUMMARY",
          mine_code: "MINE-ALPHA-01",
        }),
        { responseType: "blob" }
      );
      expect(result).toEqual(mockBlob);
    });

    it("falls back to dedicated GET endpoint when POST /reports/generate fails", async () => {
      const mockBlob = new Blob(["%PDF-1.4 fallback"], {
        type: "application/pdf",
      });

      vi.mocked(apiClient.post).mockRejectedValueOnce(new Error("POST failed"));
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockBlob });

      const result = await downloadReport({
        report_type: "MSRI_SCORECARD",
        mine_code: "MINE-ALPHA-01",
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        "/reports/msri-scorecard",
        expect.objectContaining({
          responseType: "blob",
          params: { mine_code: "MINE-ALPHA-01" },
        })
      );
      expect(result).toEqual(mockBlob);
    });
  });

  describe("triggerBlobDownload", () => {
    it("creates an object URL and clicks an anchor element", () => {
      const mockBlob = new Blob(["dummy"], { type: "application/pdf" });
      const createObjectURLMock = vi.fn().mockReturnValue("blob:http://localhost/test-uuid");
      const revokeObjectURLMock = vi.fn();

      window.URL.createObjectURL = createObjectURLMock;
      window.URL.revokeObjectURL = revokeObjectURLMock;

      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click");

      triggerBlobDownload(mockBlob, "test_report.pdf");

      expect(createObjectURLMock).toHaveBeenCalledWith(mockBlob);
      expect(clickSpy).toHaveBeenCalled();

      clickSpy.mockRestore();
    });
  });
});
