import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RemediationKanban } from "./remediation-kanban";
import * as governanceApi from "../services/governance-api";

const mockViolations = [
  {
    id: "v-kanban-01",
    location_id: "loc-01",
    violation_type: "MISSING_SCSR",
    title: "Worker Missing SCSR",
    severity: "CRITICAL",
    status: "DETECTED",
    deadline_sla: new Date(Date.now() + 3600 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    location_name: "Pithead Incline",
  },
  {
    id: "v-kanban-02",
    location_id: "loc-02",
    violation_type: "ROOF_BOLT_ANOMALY",
    title: "Roof Bolt Loose",
    severity: "HIGH",
    status: "NOTICE_SERVED",
    deadline_sla: new Date(Date.now() + 7200 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    location_name: "Seam-I Dip 3",
  },
];

vi.spyOn(governanceApi, "fetchViolations").mockResolvedValue(mockViolations as any);

const renderWithQuery = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

describe("RemediationKanban", () => {
  it("renders all 5 statutory columns", async () => {
    renderWithQuery(<RemediationKanban />);

    expect(screen.getByText("1. Detected")).toBeInTheDocument();
    expect(screen.getByText("2. Notice Served")).toBeInTheDocument();
    expect(screen.getByText("3. Action Taken")).toBeInTheDocument();
    expect(screen.getByText("4. Verified")).toBeInTheDocument();
    expect(screen.getByText("5. Statutory Closeout")).toBeInTheDocument();
  });

  it("displays violations in their respective columns", async () => {
    renderWithQuery(<RemediationKanban />);

    expect(await screen.findByText("Worker Missing SCSR")).toBeInTheDocument();
    expect(await screen.findByText("Roof Bolt Loose")).toBeInTheDocument();
  });

  it("filters violations by search text", async () => {
    renderWithQuery(<RemediationKanban />);

    expect(await screen.findByText("Worker Missing SCSR")).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/search violations/i);
    fireEvent.change(searchInput, { target: { value: "Roof Bolt" } });

    expect(screen.queryByText("Worker Missing SCSR")).not.toBeInTheDocument();
    expect(screen.getByText("Roof Bolt Loose")).toBeInTheDocument();
  });

  it("filters violations by severity", async () => {
    renderWithQuery(<RemediationKanban />);

    expect(await screen.findByText("Worker Missing SCSR")).toBeInTheDocument();

    const highFilterBtn = screen.getByRole("button", { name: "HIGH" });
    fireEvent.click(highFilterBtn);

    expect(screen.queryByText("Worker Missing SCSR")).not.toBeInTheDocument();
    expect(screen.getByText("Roof Bolt Loose")).toBeInTheDocument();
  });
});
