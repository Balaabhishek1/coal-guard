import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FormIVInspectionTable } from "./form-iv-inspection-table";
import * as fieldOpsApi from "../services/field-ops-api";
import type { FormIVInspection } from "@/types/field-ops";

const mockInspections: FormIVInspection[] = [
  {
    id: "insp-001",
    sync_id: "batch-001",
    location_id: "loc-seam3",
    location_name: "Seam-III East Tailgate",
    inspector_id: "user-insp-01",
    inspector_name: "Amitabh Banerjee",
    inspection_time: "2026-09-20T08:00:00Z",
    created_at: "2026-09-20T08:05:00Z",
    gas_ch4_percent: 0.85, // Anomaly (>= 0.75)
    gas_co_ppm: 8.0,
    air_velocity_m_per_min: 35.0,
    roof_bolt_torque_nm: 110.0,
    strata_remarks: "Roof conditions stable, methane trace elevated.",
    is_geotagged_nfc: true,
    evidence_urls: ["https://storage.coalguard.internal/webp/face1.webp"],
  },
  {
    id: "insp-002",
    sync_id: "batch-001",
    location_id: "loc-seam1",
    location_name: "Seam-I Main Incline Gallery",
    inspector_id: "user-insp-02",
    inspector_name: "Sunil Marandi",
    inspection_time: "2026-09-20T09:00:00Z",
    created_at: "2026-09-20T09:05:00Z",
    gas_ch4_percent: 0.20,
    gas_co_ppm: 2.0,
    air_velocity_m_per_min: 42.0,
    roof_bolt_torque_nm: 125.0, // Normal
    strata_remarks: "Normal inspection, good ventilation.",
    is_geotagged_nfc: false,
    evidence_urls: [],
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

describe("FormIVInspectionTable", () => {
  it("renders Form IV inspection records from query", async () => {
    vi.spyOn(fieldOpsApi, "fetchFormIVInspections").mockResolvedValueOnce(mockInspections);

    renderWithQuery(<FormIVInspectionTable onSelectInspection={vi.fn()} />);

    expect(await screen.findByText("Seam-III East Tailgate")).toBeInTheDocument();
    expect(screen.getByText("Seam-I Main Incline Gallery")).toBeInTheDocument();
    expect(screen.getByText("Amitabh Banerjee")).toBeInTheDocument();
    expect(screen.getByText("Sunil Marandi")).toBeInTheDocument();
  });

  it("filters records by search query", async () => {
    vi.spyOn(fieldOpsApi, "fetchFormIVInspections").mockResolvedValueOnce(mockInspections);

    renderWithQuery(<FormIVInspectionTable onSelectInspection={vi.fn()} />);

    expect(await screen.findByText("Seam-III East Tailgate")).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(
      /search underground face, inspector, strata notes/i
    );
    fireEvent.change(searchInput, { target: { value: "Sunil" } });

    await waitFor(() => {
      expect(screen.queryByText("Seam-III East Tailgate")).not.toBeInTheDocument();
      expect(screen.getByText("Seam-I Main Incline Gallery")).toBeInTheDocument();
    });
  });

  it("filters for statutory anomalies only when toggle is clicked", async () => {
    vi.spyOn(fieldOpsApi, "fetchFormIVInspections").mockResolvedValueOnce(mockInspections);

    renderWithQuery(<FormIVInspectionTable onSelectInspection={vi.fn()} />);

    expect(await screen.findByText("Seam-III East Tailgate")).toBeInTheDocument();
    expect(screen.getByText("Seam-I Main Incline Gallery")).toBeInTheDocument();

    const anomalyButton = screen.getByRole("button", { name: /anomalies only/i });
    fireEvent.click(anomalyButton);

    await waitFor(() => {
      // insp-001 has CH4 = 0.85% (>= 0.75%), so it remains
      expect(screen.getByText("Seam-III East Tailgate")).toBeInTheDocument();
      // insp-002 has no statutory anomalies, so it is filtered out
      expect(screen.queryByText("Seam-I Main Incline Gallery")).not.toBeInTheDocument();
    });
  });

  it("calls onSelectInspection when clicking a row", async () => {
    vi.spyOn(fieldOpsApi, "fetchFormIVInspections").mockResolvedValueOnce(mockInspections);
    const handleSelect = vi.fn();

    renderWithQuery(<FormIVInspectionTable onSelectInspection={handleSelect} />);

    const row = await screen.findByText("Seam-III East Tailgate");
    fireEvent.click(row);

    expect(handleSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "insp-001",
        location_name: "Seam-III East Tailgate",
      })
    );
  });
});
