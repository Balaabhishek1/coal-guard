import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./protected-route";
import { useAuthStore } from "@/store/auth-store";
import type { UserProfile } from "@/types/auth";

const mockMiner: UserProfile = {
  id: "m-1",
  username: "miner_rajesh",
  full_name: "Rajesh Kumar",
  role: "MINER",
  is_active: true,
};

const mockManager: UserProfile = {
  id: "mgr-1",
  username: "colliery_mgr",
  full_name: "Colliery Manager",
  role: "COLLIERY_MANAGER",
  is_active: true,
};

describe("ProtectedRoute Component", () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it("redirects unauthenticated user to /login", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/login" element={<div>Login Page Target</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Secret Dashboard</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Login Page Target")).toBeInTheDocument();
    expect(screen.queryByText("Secret Dashboard")).not.toBeInTheDocument();
  });

  it("renders protected component when user is authenticated with proper role", () => {
    useAuthStore.getState().setAuth("token-123", mockManager);

    render(
      <MemoryRouter initialEntries={["/manager-dashboard"]}>
        <Routes>
          <Route path="/unauthorized" element={<div>Unauthorized Target</div>} />
          <Route
            element={
              <ProtectedRoute allowedRoles={["COLLIERY_MANAGER", "MANAGER"]} />
            }
          >
            <Route
              path="/manager-dashboard"
              element={<div>Manager Dashboard Content</div>}
            />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Manager Dashboard Content")).toBeInTheDocument();
    expect(screen.queryByText("Unauthorized Target")).not.toBeInTheDocument();
  });

  it("redirects to /unauthorized when user has insufficient role permissions", () => {
    useAuthStore.getState().setAuth("token-miner", mockMiner); // Role: MINER

    render(
      <MemoryRouter initialEntries={["/manager-dashboard"]}>
        <Routes>
          <Route path="/unauthorized" element={<div>Access Denied Target</div>} />
          <Route
            element={
              <ProtectedRoute allowedRoles={["COLLIERY_MANAGER", "MANAGER"]} />
            }
          >
            <Route
              path="/manager-dashboard"
              element={<div>Manager Dashboard Content</div>}
            />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Access Denied Target")).toBeInTheDocument();
    expect(screen.queryByText("Manager Dashboard Content")).not.toBeInTheDocument();
  });
});
