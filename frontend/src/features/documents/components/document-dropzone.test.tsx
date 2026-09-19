import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DocumentDropzone } from "./document-dropzone";

describe("DocumentDropzone", () => {
  it("renders document type selection buttons and dropzone instructions", () => {
    render(<DocumentDropzone onUpload={vi.fn()} />);

    expect(screen.getByText("VTC Training Slip")).toBeInTheDocument();
    expect(screen.getByText("PME Medical Record (Form O)")).toBeInTheDocument();
    expect(screen.getByText("FLPM Flameproof Certificate")).toBeInTheDocument();
    expect(screen.getByText("DGMS Statutory Approval")).toBeInTheDocument();

    expect(
      screen.getByText(/drag and drop physical certificate or/i)
    ).toBeInTheDocument();
  });

  it("allows switching document classification", () => {
    render(<DocumentDropzone onUpload={vi.fn()} />);

    const pmeButton = screen.getByRole("button", { name: /pme medical record/i });
    fireEvent.click(pmeButton);

    expect(pmeButton.className).toContain("border-primary");
  });
});
