import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MetricCard } from "./metric-card";

describe("MetricCard", () => {
  it("renders metric symbol, label, formatted value and unit", () => {
    render(
      <MetricCard
        metricType="CH4_PERCENT"
        value={0.42}
        peakValue={0.65}
        deltaPercent={1.5}
      />
    );

    expect(screen.getByText("CH4")).toBeInTheDocument();
    expect(screen.getByText("Methane Concentration")).toBeInTheDocument();
    expect(screen.getByText("0.42")).toBeInTheDocument();
    expect(screen.getByText("% VOL")).toBeInTheDocument();
    expect(screen.getByText("+1.5%")).toBeInTheDocument();
    expect(screen.getByText(/PEAK: 0.65/)).toBeInTheDocument();
    expect(screen.getByText("STATUTORY NOMINAL")).toBeInTheDocument();
  });

  it("handles click callback for selection", () => {
    const handleClick = vi.fn();
    render(
      <MetricCard
        metricType="CO_PPM"
        value={12.0}
        onClick={handleClick}
        isSelected={false}
      />
    );

    fireEvent.click(screen.getByText("Carbon Monoxide Trace"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renders with active border styling when isSelected is true", () => {
    const { container } = render(
      <MetricCard
        metricType="AIR_VELOCITY"
        value={1.9}
        isSelected={true}
      />
    );

    const cardElement = container.querySelector(".border-primary-container");
    expect(cardElement).toBeInTheDocument();
  });
});
