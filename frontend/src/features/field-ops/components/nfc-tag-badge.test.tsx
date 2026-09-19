import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { NfcTagBadge } from "./nfc-tag-badge";

describe("NfcTagBadge", () => {
  it("renders verified emerald badge with 'NFC Geotagged' when isGeotagged is true", () => {
    render(<NfcTagBadge isGeotagged={true} />);

    const badge = screen.getByText("NFC Geotagged");
    expect(badge).toBeInTheDocument();
    expect(badge.closest("div")).toHaveClass("text-emerald-300");
  });

  it("renders compact 'NFC' text when compact mode is enabled", () => {
    render(<NfcTagBadge isGeotagged={true} compact={true} />);

    expect(screen.getByText("NFC")).toBeInTheDocument();
    expect(screen.queryByText("NFC Geotagged")).not.toBeInTheDocument();
  });

  it("renders warning amber badge with 'Manual Coordinate' when isGeotagged is false", () => {
    render(<NfcTagBadge isGeotagged={false} />);

    const badge = screen.getByText("Manual Coordinate");
    expect(badge).toBeInTheDocument();
    expect(badge.closest("div")).toHaveClass("text-amber-300");
  });

  it("renders compact 'Manual' text when isGeotagged is false and compact is true", () => {
    render(<NfcTagBadge isGeotagged={false} compact={true} />);

    expect(screen.getByText("Manual")).toBeInTheDocument();
  });
});
