import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ReportCard } from "./report-card";
import { STATUTORY_REPORTS_CATALOG } from "../services/reports-api";

describe("ReportCard", () => {
  const mockReport = STATUTORY_REPORTS_CATALOG[0];

  it("renders report title, subtitle, and statutory reference", () => {
    render(<ReportCard report={mockReport} onSelect={vi.fn()} />);

    expect(screen.getByText(mockReport.title)).toBeInTheDocument();
    expect(screen.getByText(mockReport.subtitle)).toBeInTheDocument();
    expect(screen.getByText(mockReport.statutoryReference)).toBeInTheDocument();
    expect(screen.getByText(mockReport.badgeText)).toBeInTheDocument();
  });

  it("triggers onSelect callback when action button is clicked", () => {
    const handleSelect = vi.fn();
    render(<ReportCard report={mockReport} onSelect={handleSelect} />);

    const button = screen.getByRole("button", { name: /configure/i });
    fireEvent.click(button);

    expect(handleSelect).toHaveBeenCalledWith(mockReport);
  });

  it("displays loading spinner when isDownloading is true", () => {
    render(
      <ReportCard
        report={mockReport}
        onSelect={vi.fn()}
        isDownloading={true}
      />
    );

    expect(screen.getByText(/generating\.\.\./i)).toBeInTheDocument();
  });
});
