import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LoginForm } from "./login-form";
import * as authApi from "../services/auth-api";
import { useAuthStore } from "@/store/auth-store";

vi.mock("../services/auth-api");

describe("LoginForm Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().logout();
  });

  it("renders all form elements, role buttons, and statutory declaration", () => {
    render(
      <MemoryRouter>
        <LoginForm activeRoleId="safety_officer" onRoleChange={() => {}} />
      </MemoryRouter>
    );

    expect(screen.getByText("Safety Officer / Gate Op")).toBeInTheDocument();
    expect(screen.getByText("Colliery / Mine Manager")).toBeInTheDocument();
    expect(screen.getByText("Overman / Mining Sirdar")).toBeInTheDocument();
    expect(screen.getByText("DGMS Regulator / HQ")).toBeInTheDocument();
    expect(screen.getByText("Contractor Supervisor")).toBeInTheDocument();

    expect(screen.getByLabelText(/Credential \/ RFID \/ Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Statutory Passphrase \/ PIN/i)).toBeInTheDocument();
    expect(screen.getByText(/CMR 2017 Regulations & Mines Act 1952/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Sign In to Operational Workspace/i })
    ).toBeInTheDocument();
  });

  it("triggers RFID simulation and populates RFID tag on tap", async () => {
    render(
      <MemoryRouter>
        <LoginForm activeRoleId="safety_officer" onRoleChange={() => {}} />
      </MemoryRouter>
    );

    const rfidTapBtn = screen.getByRole("button", { name: /Simulate RFID Tap/i });
    fireEvent.click(rfidTapBtn);

    const identifierInput = screen.getByLabelText(
      /Credential \/ RFID \/ Email/i
    ) as HTMLInputElement;

    await waitFor(
      () => {
        expect(identifierInput.value).toBe("RFID-ELIGIBLE-001");
      },
      { timeout: 1000 }
    );
  });

  it("submits login and stores auth on valid credentials", async () => {
    const mockAuthResponse = {
      access_token: "jwt-mock-token-xyz",
      token_type: "bearer",
      user: {
        id: "u-1",
        username: "safety_officer",
        full_name: "Vikram Sharma",
        role: "SAFETY_OFFICER" as const,
        is_active: true,
      },
    };

    vi.spyOn(authApi, "loginApi").mockResolvedValue(mockAuthResponse);

    render(
      <MemoryRouter>
        <LoginForm activeRoleId="safety_officer" onRoleChange={() => {}} />
      </MemoryRouter>
    );

    const submitBtn = screen.getByRole("button", {
      name: /Sign In to Operational Workspace/i,
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(authApi.loginApi).toHaveBeenCalled();
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().token).toBe("jwt-mock-token-xyz");
    });
  });

  it("displays statutory arbitration error message when API rejects", async () => {
    vi.spyOn(authApi, "loginApi").mockRejectedValue({
      response: {
        data: {
          detail: "Invalid colliery identification credentials or incorrect password",
        },
      },
    });

    render(
      <MemoryRouter>
        <LoginForm activeRoleId="safety_officer" onRoleChange={() => {}} />
      </MemoryRouter>
    );

    const submitBtn = screen.getByRole("button", {
      name: /Sign In to Operational Workspace/i,
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Invalid colliery identification credentials or incorrect password"
        )
      ).toBeInTheDocument();
    });
  });
});
