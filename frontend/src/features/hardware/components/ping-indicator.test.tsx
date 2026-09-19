import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PingIndicator } from "./ping-indicator";

describe("PingIndicator", () => {
  it("renders OFFLINE state when isOnline is false", () => {
    render(<PingIndicator isOnline={false} />);
    expect(screen.getByText("OFFLINE")).toBeInTheDocument();
  });

  it("renders NORMAL latency when latency < 50ms", () => {
    render(<PingIndicator isOnline={true} latencyMs={28} />);
    expect(screen.getByText("28 ms")).toBeInTheDocument();
    expect(screen.getByText("NORMAL")).toBeInTheDocument();
  });

  it("renders DEGRADED latency when 50ms <= latency <= 250ms", () => {
    render(<PingIndicator isOnline={true} latencyMs={120} />);
    expect(screen.getByText("120 ms")).toBeInTheDocument();
    expect(screen.getByText("DEGRADED")).toBeInTheDocument();
  });

  it("renders CRITICAL latency when latency > 250ms", () => {
    render(<PingIndicator isOnline={true} latencyMs={320} />);
    expect(screen.getByText("320 ms")).toBeInTheDocument();
    expect(screen.getByText("CRITICAL")).toBeInTheDocument();
  });
});
