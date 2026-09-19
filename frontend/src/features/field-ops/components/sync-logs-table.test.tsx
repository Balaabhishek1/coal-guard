import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SyncLogsTable } from "./sync-logs-table";
import * as fieldOpsApi from "../services/field-ops-api";
import type { SyncLog } from "@/types/field-ops";

const mockSyncLogs: SyncLog[] = [
  {
    sync_id: "SYNC-20260920-001",
    device_id: "TAB-EX-0092-UG",
    user_id: "overman-user-01",
    records_processed: 14,
    status: "SUCCESS",
    timestamp: "2026-09-20T08:35:10Z",
  },
  {
    sync_id: "SYNC-20260920-002",
    device_id: "MOB-EX-0118-UG",
    user_id: "sirdar-user-04",
    records_processed: 6,
    status: "PARTIAL",
    timestamp: "2026-09-20T08:42:15Z",
  },
  {
    sync_id: "SYNC-20260920-003",
    device_id: "MOB-EX-0055-UG",
    user_id: "sirdar-user-08",
    records_processed: 0,
    status: "FAILED",
    timestamp: "2026-09-20T08:50:00Z",
  },
];

const renderWithQuery = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

describe("SyncLogsTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    });
  });

  it("renders sync logs with status badges and device IDs", async () => {
    vi.spyOn(fieldOpsApi, "fetchSyncLogs").mockResolvedValueOnce(mockSyncLogs);

    renderWithQuery(<SyncLogsTable />);

    expect(await screen.findByText("TAB-EX-0092-UG")).toBeInTheDocument();
    expect(screen.getByText("MOB-EX-0118-UG")).toBeInTheDocument();
    expect(screen.getByText("MOB-EX-0055-UG")).toBeInTheDocument();

    // Verify status badges are rendered in table
    expect(screen.getAllByText("SUCCESS").length).toBeGreaterThanOrEqual(2); // filter button + badge
    expect(screen.getAllByText("PARTIAL").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("FAILED").length).toBeGreaterThanOrEqual(2);
  });

  it("filters sync logs by status buttons", async () => {
    vi.spyOn(fieldOpsApi, "fetchSyncLogs").mockResolvedValueOnce(mockSyncLogs);

    renderWithQuery(<SyncLogsTable />);

    expect(await screen.findByText("TAB-EX-0092-UG")).toBeInTheDocument();

    const failedButtons = screen.getAllByRole("button", { name: "FAILED" });
    fireEvent.click(failedButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText("TAB-EX-0092-UG")).not.toBeInTheDocument();
      expect(screen.queryByText("MOB-EX-0118-UG")).not.toBeInTheDocument();
      expect(screen.getByText("MOB-EX-0055-UG")).toBeInTheDocument();
    });
  });

  it("copies device ID to clipboard when copy button is clicked", async () => {
    vi.spyOn(fieldOpsApi, "fetchSyncLogs").mockResolvedValueOnce(mockSyncLogs);

    renderWithQuery(<SyncLogsTable />);

    expect(await screen.findByText("TAB-EX-0092-UG")).toBeInTheDocument();

    const copyButtons = screen.getAllByTitle(/copy device identifier/i);
    expect(copyButtons.length).toBeGreaterThan(0);
    fireEvent.click(copyButtons[0]);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("TAB-EX-0092-UG");
  });
});
