import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChainVerificationBadge } from "./chain-verification-badge";
import * as governanceApi from "../services/governance-api";

const renderWithQuery = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

describe("ChainVerificationBadge", () => {
  it("renders default Verify Chain Integrity button", () => {
    renderWithQuery(<ChainVerificationBadge />);
    expect(screen.getByText("Verify Chain Integrity")).toBeInTheDocument();
  });

  it("verifies chain and renders emerald badge with block count on success", async () => {
    vi.spyOn(governanceApi, "verifyAuditChain").mockResolvedValueOnce({
      valid: true,
      total_blocks_verified: 1045,
      total_records: 1045,
    });

    renderWithQuery(<ChainVerificationBadge />);

    const button = screen.getByRole("button", { name: /verify chain integrity/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Chain Verified \(1,045 Blocks\)/i)).toBeInTheDocument();
    });
  });

  it("identifies broken sequence ID and shows rose warning on tampered chain", async () => {
    vi.spyOn(governanceApi, "verifyAuditChain").mockResolvedValueOnce({
      valid: false,
      broken_seq_id: 1042,
      total_blocks_verified: 1041,
      reason: "Hash mismatch at sequence 1042",
    });

    renderWithQuery(<ChainVerificationBadge />);

    const button = screen.getByRole("button", { name: /verify chain integrity/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/TAMPER DETECTED: Block #1042/i)).toBeInTheDocument();
    });
  });
});
