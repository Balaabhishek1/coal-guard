import { describe, it, expect, beforeEach } from "vitest";
import { useGateStore } from "./gate-store";
import type { EdgeAccessEventPayload, LiveAlert } from "@/types/vision-edge";

describe("useGateStore", () => {
  beforeEach(() => {
    useGateStore.setState({
      wsConnected: false,
      selectedFeedId: "cam-gate-01",
      latestAccessEvent: null,
      recentEvents: [],
      activeAlerts: [],
    });
  });

  it("updates wsConnected state", () => {
    expect(useGateStore.getState().wsConnected).toBe(false);
    useGateStore.getState().setWsConnected(true);
    expect(useGateStore.getState().wsConnected).toBe(true);
  });

  it("adds compliant access event without triggering critical alerts", () => {
    const compliantEvent: EdgeAccessEventPayload = {
      rfid_tag: "RFID-001",
      location_id: "loc-01",
      worker_name: "Compliant Miner",
      optical_compliance: true,
      credential_eligibility: true,
      gate_actuated: true,
      wear_states: { hardhat_worn: true, vest_worn: true, scsr_worn: true },
      bounding_boxes: [],
    };

    useGateStore.getState().addAccessEvent(compliantEvent);
    expect(useGateStore.getState().latestAccessEvent).toEqual(compliantEvent);
    expect(useGateStore.getState().recentEvents.length).toBe(1);
    expect(useGateStore.getState().activeAlerts.length).toBe(0);
  });

  it("automatically generates critical alert when PPE non-compliance occurs", () => {
    const infractionEvent: EdgeAccessEventPayload = {
      rfid_tag: "RFID-002",
      location_id: "loc-01",
      worker_name: "Non-compliant Miner",
      optical_compliance: false,
      credential_eligibility: true,
      gate_actuated: false,
      wear_states: { hardhat_worn: true, vest_worn: false, scsr_worn: false },
      bounding_boxes: [],
    };

    useGateStore.getState().addAccessEvent(infractionEvent);
    expect(useGateStore.getState().latestAccessEvent).toEqual(infractionEvent);
    expect(useGateStore.getState().activeAlerts.length).toBe(1);

    const alert = useGateStore.getState().activeAlerts[0];
    expect(alert.severity).toBe("CRITICAL");
    expect(alert.title).toContain("UNAUTHORIZED PITHEAD INGRESS BLOCKED");
    expect(alert.message).toContain("SCSR Respirator");
  });

  it("dismisses and clears alerts correctly", () => {
    const alert: LiveAlert = {
      id: "alert-123",
      event_type: "GAS_SPIKE_ALERT",
      severity: "CRITICAL",
      title: "Test Alert",
      message: "Test Message",
      timestamp: "2026-09-20T00:00:00Z",
      acknowledged: false,
    };

    useGateStore.getState().addAlert(alert);
    expect(useGateStore.getState().activeAlerts.length).toBe(1);

    useGateStore.getState().dismissAlert("alert-123");
    expect(useGateStore.getState().activeAlerts.length).toBe(0);
  });

  it("simulateAccessAttempt generates and records simulated events", () => {
    const event = useGateStore.getState().simulateAccessAttempt(false, "scsr");
    expect(event.optical_compliance).toBe(false);
    expect(event.wear_states.scsr_worn).toBe(false);
    expect(event.gate_actuated).toBe(false);
    expect(useGateStore.getState().latestAccessEvent).toBeDefined();
    expect(useGateStore.getState().activeAlerts.length).toBeGreaterThan(0);
  });
});
