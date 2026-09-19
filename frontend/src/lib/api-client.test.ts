import { describe, it, expect, beforeEach } from "vitest";
import apiClient from "./api-client";
import { useAuthStore } from "@/store/auth-store";
import type { UserProfile } from "@/types/auth";

const testUser: UserProfile = {
  id: "u-1",
  username: "test_user",
  full_name: "Test User",
  role: "SAFETY_OFFICER",
  is_active: true,
};

describe("apiClient Interceptors", () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it("should have correct base URL from environment or fallback", () => {
    expect(apiClient.defaults.baseURL).toBeDefined();
    expect(apiClient.defaults.baseURL).toContain("/api/v1");
  });

  it("should attach Authorization header when token exists in Zustand store", async () => {
    useAuthStore.getState().setAuth("jwt-token-alpha", testUser);

    // Call request interceptor manually
    const interceptor = (apiClient.interceptors.request as any).handlers[0];
    const config = await interceptor.fulfilled({ headers: {} });

    expect(config.headers.Authorization).toBe("Bearer jwt-token-alpha");
  });

  it("should not attach Authorization header when token is null", async () => {
    useAuthStore.getState().logout();

    const interceptor = (apiClient.interceptors.request as any).handlers[0];
    const config = await interceptor.fulfilled({ headers: {} });

    expect(config.headers.Authorization).toBeUndefined();
  });
});
