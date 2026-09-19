import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ExtractedEntityForm } from "./extracted-entity-form";
import { FALLBACK_CERTIFICATE } from "../services/documents-api";

describe("ExtractedEntityForm", () => {
  it("pre-populates extracted fields from certificate", () => {
    render(
      <ExtractedEntityForm
        certificate={FALLBACK_CERTIFICATE}
        onVerify={vi.fn()}
      />
    );

    const serialInput = screen.getByDisplayValue("VTC/ECL/2026/UG-9042");
    expect(serialInput).toBeInTheDocument();

    const authorityInput = screen.getByDisplayValue(
      "Directorate General of Mines Safety (DGMS) / ECL VTC Center"
    );
    expect(authorityInput).toBeInTheDocument();
  });

  it("submits verified data and calls onVerify callback", async () => {
    const handleVerify = vi.fn().mockResolvedValue(undefined);

    render(
      <ExtractedEntityForm
        certificate={FALLBACK_CERTIFICATE}
        onVerify={handleVerify}
      />
    );

    const submitBtn = screen.getByRole("button", {
      name: /confirm & save statutory verification/i,
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleVerify).toHaveBeenCalledWith(
        expect.objectContaining({
          is_verified: true,
          corrected_serial_no: "VTC/ECL/2026/UG-9042",
        })
      );
    });
  });

  it("toggles raw OCR text accordion", () => {
    render(
      <ExtractedEntityForm
        certificate={FALLBACK_CERTIFICATE}
        onVerify={vi.fn()}
      />
    );

    const accordionBtn = screen.getByText(/raw paddleocr extracted text buffer/i);
    expect(screen.queryByText(/EASTERN COALFIELDS LIMITED/i)).not.toBeInTheDocument();

    fireEvent.click(accordionBtn);
    expect(screen.getByText(/EASTERN COALFIELDS LIMITED/i)).toBeInTheDocument();
  });
});
