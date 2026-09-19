import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ViolationCard } from "./violation-card";
import type { ComplianceViolation } from "@/types/governance";

describe("ViolationCard", () => {
  const mockViolation: ComplianceViolation = {
    id: "v-test-99",
    location_id: "loc-seam01",
    violation_type: "MISSING_SCSR",
    title: "Worker Detected Without SCSR",
    description: "Failure to equip mandatory breathing apparatus at pithead turnstile.",
    severity: "CRITICAL",
    status: "DETECTED",
    deadline_sla: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    location_name: "Pithead Incline Shaft",
    contractor_id: "CONT-COAL-01",
    reporter_name: "Ramesh Sharma",
  };

  it("renders critical severity badge, title, location, and contractor details", () => {
    const handleTransition = vi.fn();
    render(
      <ViolationCard
        violation={mockViolation}
        onOpenTransition={handleTransition}
      />
    );

    expect(screen.getByText("CRITICAL")).toBeInTheDocument();
    expect(screen.getByText("MISSING_SCSR")).toBeInTheDocument();
    expect(screen.getByText("Worker Detected Without SCSR")).toBeInTheDocument();
    expect(screen.getByText("Pithead Incline Shaft")).toBeInTheDocument();
    expect(screen.getByText("Contractor: CONT-COAL-01")).toBeInTheDocument();
    expect(screen.getByText("Logged by: Ramesh Sharma")).toBeInTheDocument();
  });

  it("triggers onOpenTransition callback when transition button is clicked", () => {
    const handleTransition = vi.fn();
    render(
      <ViolationCard
        violation={mockViolation}
        onOpenTransition={handleTransition}
      />
    );

    const button = screen.getByRole("button", { name: /serve statutory notice/i });
    expect(button).toBeInTheDocument();
    fireEvent.click(button);

    expect(handleTransition).toHaveBeenCalledWith(mockViolation);
  });

  it("renders statutory sealed badge when ticket is in STATUTORY_CLOSEOUT", () => {
    const closedViolation: ComplianceViolation = {
      ...mockViolation,
      status: "STATUTORY_CLOSEOUT",
      resolved_at: new Date().toISOString(),
    };

    render(
      <ViolationCard
        violation={closedViolation}
        onOpenTransition={vi.fn()}
      />
    );

    expect(screen.getByText("Statutorily Sealed")).toBeInTheDocument();
    expect(screen.getByText("SHA-256 Anchored")).toBeInTheDocument();
  });
});
