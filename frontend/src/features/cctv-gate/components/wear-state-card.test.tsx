import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { WearStateCard } from "./wear-state-card";
import type { EdgeAccessEventPayload } from "@/types/vision-edge";

describe("WearStateCard", () => {
  it("renders placeholder when event is null", () => {
    render(<WearStateCard event={null} />);
    expect(
      screen.getByText("Awaiting Turnstile Ingress Event")
    ).toBeInTheDocument();
  });

  it("renders compliant worker details and unlocked turnstile status", () => {
    const compliantEvent: EdgeAccessEventPayload = {
      rfid_tag: "RFID-MINER-0091",
      location_id: "loc-01",
      worker_name: "Ramesh Kumar",
      worker_designation: "Driller",
      optical_compliance: true,
      credential_eligibility: true,
      gate_actuated: true,
      wear_states: { hardhat_worn: true, vest_worn: true, scsr_worn: true },
      bounding_boxes: [],
    };

    render(<WearStateCard event={compliantEvent} />);
    expect(screen.getByText("Ramesh Kumar")).toBeInTheDocument();
    expect(screen.getByText("RFID-MINER-0091")).toBeInTheDocument();
    expect(
      screen.getByText("UNLOCKED // CLEARANCE GRANTED")
    ).toBeInTheDocument();
    expect(screen.getByText("ALL STATUTORY CHECKS PASSED")).toBeInTheDocument();
    expect(screen.getAllByText("CONFIRMED").length).toBe(2);
    expect(screen.getByText("EQUIPPED")).toBeInTheDocument();
  });

  it("renders infraction warning and denied interlock when PPE is missing", () => {
    const infractionEvent: EdgeAccessEventPayload = {
      rfid_tag: "RFID-MINER-0044",
      location_id: "loc-01",
      worker_name: "Sanjay Murmu",
      worker_designation: "Shotfirer",
      optical_compliance: false,
      credential_eligibility: true,
      gate_actuated: false,
      wear_states: { hardhat_worn: false, vest_worn: true, scsr_worn: false },
      bounding_boxes: [],
      violation_ticket_created: true,
    };

    render(<WearStateCard event={infractionEvent} />);
    expect(screen.getByText("Sanjay Murmu")).toBeInTheDocument();
    expect(
      screen.getByText("INTERLOCK HELD // ACCESS DENIED")
    ).toBeInTheDocument();
    expect(screen.getByText("INFRACTIONS DETECTED")).toBeInTheDocument();
    expect(screen.getByText("MISSING")).toBeInTheDocument();
    expect(screen.getByText("UNATTACHED")).toBeInTheDocument();
    expect(
      screen.getByText("COMPLIANCE VIOLATION TICKET AUTO-DISPATCHED")
    ).toBeInTheDocument();
  });
});
