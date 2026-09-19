import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SlaCountdownTimer } from "./sla-countdown-timer";

describe("SlaCountdownTimer", () => {
  it("renders safe countdown in emerald when more than 2 hours remain", () => {
    const futureDeadline = new Date(Date.now() + 5 * 3600 * 1000).toISOString();

    const { container } = render(<SlaCountdownTimer deadlineSla={futureDeadline} />);
    expect(container.textContent).toMatch(/\d+h \d+m \d+s/);
    expect(container.firstChild).toHaveClass("text-emerald-400");
  });

  it("renders warning state in amber when less than 2 hours remain", () => {
    const warningDeadline = new Date(Date.now() + 1 * 3600 * 1000).toISOString();

    const { container } = render(<SlaCountdownTimer deadlineSla={warningDeadline} />);
    expect(container.firstChild).toHaveClass("text-amber-400");
  });

  it("renders pulsing rose alert when SLA is breached", () => {
    const breachedDeadline = new Date(Date.now() - 3600 * 1000).toISOString();

    const { container } = render(<SlaCountdownTimer deadlineSla={breachedDeadline} />);
    expect(container.textContent).toContain("BREACHED");
    expect(container.firstChild).toHaveClass("text-rose-400");
    expect(container.firstChild).toHaveClass("animate-pulse");
  });

  it("renders statutory closeout checkmark when ticket is resolved", () => {
    const deadline = new Date(Date.now() + 5 * 3600 * 1000).toISOString();
    const resolvedAt = new Date().toISOString();

    render(<SlaCountdownTimer deadlineSla={deadline} resolvedAt={resolvedAt} />);
    expect(screen.getByText("STATUTORY CLOSEOUT")).toBeInTheDocument();
  });
});
