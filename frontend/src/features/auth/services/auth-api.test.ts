import { describe, it, expect, vi, beforeEach } from "vitest";
import apiClient from "@/lib/api-client";
import { loginApi, getMeApi, DEMO_USERS } from "./auth-api";

vi.mock("@/lib/api-client", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("auth-api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loginApi", () => {
    it("returns API response when backend succeeds", async () => {
      const mockResponse = {
        access_token: "live-token-123",
        token_type: "bearer",
        expires_in: 3600,
        user: {
          id: "usr-live-01",
          username: "manager@mineguard.in",
          full_name: "Live Manager",
          email: "manager@mineguard.in",
          role: "COLLIERY_MANAGER",
          is_active: true,
        },
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockResponse });

      const result = await loginApi({
        username: "manager@mineguard.in",
        password: "ValidPassword123!",
      });

      expect(apiClient.post).toHaveBeenCalledWith("/auth/login", {
        username: "manager@mineguard.in",
        password: "ValidPassword123!",
      });
      expect(result).toEqual(mockResponse);
    });

    it("activates resilient statutory session on network/backend error", async () => {
      vi.mocked(apiClient.post).mockRejectedValueOnce(new Error("Network Error"));

      const result = await loginApi({
        username: "safety@mineguard.in",
        password: "AnyPassword!",
      });

      expect(result.access_token).toContain("statutory-jwt-safety_officer");
      expect(result.user?.role).toBe("SAFETY_OFFICER");
      expect(result.user?.email).toBe("safety@mineguard.in");
    });

    it("activates miner session when RFID is used and network is offline", async () => {
      vi.mocked(apiClient.post).mockRejectedValueOnce(new Error("Network Error"));

      const result = await loginApi({
        rfid_tag_or_username: "RFID-ELIGIBLE-001",
        password: "MinerPassword!",
      });

      expect(result.user?.role).toBe("MINER");
      expect(result.user?.rfid_tag).toBe("RFID-ELIGIBLE-001");
    });

    it("propagates 401 unauthorized errors from live backend", async () => {
      const authError = {
        response: {
          status: 401,
          data: { detail: "Invalid colliery credentials" },
        },
      };
      vi.mocked(apiClient.post).mockRejectedValueOnce(authError);

      await expect(
        loginApi({
          username: "manager@mineguard.in",
          password: "WrongPassword!",
        })
      ).rejects.toEqual(authError);
    });

    it("infers role for custom demo username on network error", async () => {
      vi.mocked(apiClient.post).mockRejectedValueOnce(new Error("Connection Refused"));

      const result = await loginApi({
        username: "dgms-inspector-custom@gov.in",
        password: "password123",
      });

      expect(result.user?.role).toBe("DGMS_INSPECTOR");
    });
  });

  describe("getMeApi", () => {
    it("returns profile from API when available", async () => {
      const mockProfile = DEMO_USERS["manager@mineguard.in"];
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockProfile });

      const result = await getMeApi();
      expect(apiClient.get).toHaveBeenCalledWith("/auth/me");
      expect(result).toEqual(mockProfile);
    });

    it("falls back to default demo user on error", async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error("Network Error"));

      const result = await getMeApi();
      expect(result).toEqual(DEMO_USERS["manager@mineguard.in"]);
    });
  });
});
