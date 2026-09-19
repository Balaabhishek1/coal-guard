import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { RealTimeAlertBanner } from "./real-time-alert-banner";
import { useGateStore } from "@/store/gate-store";
import type { LiveAlert } from "@/types/vision-edge";

describe("RealTimeAlertBanner", () => {
  beforeEach(() => {
    useGateStore.setState({ activeAlerts: [] });
  });

  it("renders nothing when there are no active alerts", () => {
    const { container } = render(<RealTimeAlertBanner />);
    expect(container.firstChild).toBeNull();
  });

  it("renders critical alert banner with title, message, and rule", () => {
    const mockAlert: LiveAlert = {
      id: "alert-test-01",
      event_type: "GAS_SPIKE_ALERT",
      severity: "CRITICAL",
      title: "METHANE CONTINUOUS TRIP BREACH",
      message: "Sensor 4B detected 1.35% CH4 level.",
      statutory_rule: "CMR 2017 Reg. 169(3)",
      timestamp: "2026-09-20T00:00:00Z",
      acknowledged: false,
    };

    useGateStore.setState({ activeAlerts: [mockAlert] });
    render(<RealTimeAlertBanner />);

    expect(
      screen.getByText("METHANE CONTINUOUS TRIP BREACH")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Sensor 4B detected 1.35% CH4 level.")
    ).toBeInTheDocument();
    expect(screen.getByText(/CMR 2017 Reg. 169\(3\)/)).toBeInTheDocument();
  });

  it("dismisses alert when Acknowledge button is clicked", () => {
    const mockAlert: LiveAlert = {
      id: "alert-test-02",
      event_type: "GATE_ACCESS_ATTEMPT",
      severity: "CRITICAL",
      title: "UNAUTHORIZED ACCESS",
      message: "Turnstile blocked.",
      timestamp: "2026-09-20T00:00:00Z",
      acknowledged: false,
    };

    useGateStore.setState({ activeAlerts: [mockAlert] });
    render(<RealTimeAlertBanner />);

    const acknowledgeBtn = screen.getByRole("button", { name: /acknowledge/i });
    fireEvent.click(acknowledgeBtn);

    expect(useGateStore.getState().activeAlerts.length).toBe(0);
  });
});
