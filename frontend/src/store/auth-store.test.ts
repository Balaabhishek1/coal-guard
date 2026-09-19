import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "./auth-store";
import type { UserProfile } from "@/types/auth";

const mockUser: UserProfile = {
  id: "u-101",
  username: "safety_officer",
  full_name: "Vikram Sharma",
  email: "safety@mineguard.in",
  rfid_tag: "RFID-SAFETY-001",
  role: "SAFETY_OFFICER",
  contractor_id: null,
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
};

describe("useAuthStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.getState().logout();
  });

  it("should initialize with unauthenticated state", () => {
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it("should store token and user on setAuth", () => {
    useAuthStore.getState().setAuth("test-jwt-token-123", mockUser);

    const state = useAuthStore.getState();
    expect(state.token).toBe("test-jwt-token-123");
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);

    // Verify localStorage persistence
    const rawStorage = localStorage.getItem("coalguard-auth-session");
    expect(rawStorage).not.toBeNull();
    const parsed = JSON.parse(rawStorage!);
    expect(parsed.state.token).toBe("test-jwt-token-123");
    expect(parsed.state.user.username).toBe("safety_officer");
  });

  it("should clear state and localStorage on logout", () => {
    useAuthStore.getState().setAuth("token-to-clear", mockUser);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    useAuthStore.getState().logout();
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it("should correctly evaluate hasRole for exact match and aliases", () => {
    useAuthStore.getState().setAuth("token-123", mockUser); // role: SAFETY_OFFICER

    // Exact role
    expect(useAuthStore.getState().hasRole(["SAFETY_OFFICER"])).toBe(true);
    // Alias role
    expect(useAuthStore.getState().hasRole(["GATE_OPERATOR"])).toBe(true);
    // Unauthorized role
    expect(useAuthStore.getState().hasRole(["COLLIERY_MANAGER"])).toBe(false);
    expect(useAuthStore.getState().hasRole(["DGMS_INSPECTOR"])).toBe(false);
  });

  it("should allow ADMIN role to bypass all role requirements", () => {
    const adminUser: UserProfile = {
      ...mockUser,
      role: "ADMIN",
    };
    useAuthStore.getState().setAuth("admin-token", adminUser);

    expect(useAuthStore.getState().hasRole(["COLLIERY_MANAGER"])).toBe(true);
    expect(useAuthStore.getState().hasRole(["SAFETY_OFFICER"])).toBe(true);
    expect(useAuthStore.getState().hasRole(["DGMS_INSPECTOR"])).toBe(true);
  });

  it("should correctly evaluate Manager and Overman aliases", () => {
    const collieryMgr: UserProfile = { ...mockUser, role: "COLLIERY_MANAGER" };
    useAuthStore.getState().setAuth("token-mgr", collieryMgr);
    expect(useAuthStore.getState().hasRole(["MANAGER"])).toBe(true);
    expect(useAuthStore.getState().hasRole(["COLLIERY_MANAGER"])).toBe(true);

    const sirdar: UserProfile = { ...mockUser, role: "MINING_SIRDAR" };
    useAuthStore.getState().setAuth("token-sirdar", sirdar);
    expect(useAuthStore.getState().hasRole(["OVERMAN"])).toBe(true);
    expect(useAuthStore.getState().hasRole(["MINING_SIRDAR"])).toBe(true);
  });
});
