import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuditLedgerTable } from "./audit-ledger-table";
import * as governanceApi from "../services/governance-api";

const mockEntries = [
  {
    seq_id: 1045,
    timestamp: "2026-09-20T10:30:00Z",
    actor_id: "usr-mgr-01",
    action_type: "STATUTORY_CLOSEOUT",
    payload: {
      violation_id: "v-test-01",
      inspector: "Devendra Verma",
      statutory_code: "CMR-2017-REG-182",
    },
    previous_hash: "3a7b689ef23c10928e19c02ff448651a2d48074903e198ba4df908b1a20c3ef1",
    current_hash: "a9104bd38914c62e588100bbcd2491aef6839f990192837482a17cbef8902c4b",
  },
];

vi.spyOn(governanceApi, "fetchAuditLedger").mockResolvedValue(mockEntries);

const renderWithQuery = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

describe("AuditLedgerTable", () => {
  it("renders table headers and row data correctly", async () => {
    renderWithQuery(<AuditLedgerTable />);

    expect(screen.getByText(/Block \/ Seq/i)).toBeInTheDocument();
    expect(screen.getByText(/Action Type/i)).toBeInTheDocument();
    expect(screen.getByText(/Hash Linkage/i)).toBeInTheDocument();

    expect(await screen.findByText("#001045")).toBeInTheDocument();
    expect(screen.getByText("CLOSEOUT")).toBeInTheDocument();
    expect(screen.getByText("usr-mgr-01")).toBeInTheDocument();
  });

  it("expands raw JSON payload drawer when row is clicked", async () => {
    renderWithQuery(<AuditLedgerTable />);

    const rowSeq = await screen.findByText("#001045");
    fireEvent.click(rowSeq);

    await waitFor(() => {
      expect(
        screen.getByText(/Statutory Payload Record \(Block #1045\)/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/Devendra Verma/i)).toBeInTheDocument();
      expect(screen.getByText(/CMR-2017-REG-182/i)).toBeInTheDocument();
    });
  });
});
