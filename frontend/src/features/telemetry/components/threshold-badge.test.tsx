import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ThresholdBadge, evaluateThreshold } from "./threshold-badge";

describe("evaluateThreshold logic", () => {
  describe("CH4_PERCENT (Methane)", () => {
    it("classifies < 0.75% as SAFE", () => {
      const result = evaluateThreshold("CH4_PERCENT", 0.45);
      expect(result.status).toBe("SAFE");
      expect(result.label).toBe("STATUTORY NOMINAL");
    });

    it("classifies 0.75% to 1.24% as WARNING (Elevated)", () => {
      const result = evaluateThreshold("CH4_PERCENT", 0.85);
      expect(result.status).toBe("WARNING");
      expect(result.label).toContain("ELEVATED");
      expect(result.rule).toBe("CMR 2017 Reg. 169(1)");
    });

    it("classifies >= 1.25% as CRITICAL (Trip Interlock)", () => {
      const result = evaluateThreshold("CH4_PERCENT", 1.35);
      expect(result.status).toBe("CRITICAL");
      expect(result.label).toContain("TRIP INTERLOCK");
      expect(result.rule).toBe("CMR 2017 Reg. 169(3)");
    });
  });

  describe("CO_PPM (Carbon Monoxide)", () => {
    it("classifies < 25 PPM as SAFE", () => {
      const result = evaluateThreshold("CO_PPM", 10.0);
      expect(result.status).toBe("SAFE");
    });

    it("classifies 25 to 49.9 PPM as WARNING", () => {
      const result = evaluateThreshold("CO_PPM", 30.0);
      expect(result.status).toBe("WARNING");
      expect(result.label).toContain("CO TRACE WARNING");
    });

    it("classifies >= 50 PPM as CRITICAL (Heating Danger)", () => {
      const result = evaluateThreshold("CO_PPM", 55.0);
      expect(result.status).toBe("CRITICAL");
      expect(result.label).toContain("HEATING DANGER");
      expect(result.rule).toBe("CMR 2017 Reg. 142");
    });
  });

  describe("AIR_VELOCITY (Ventilation Airflow)", () => {
    it("classifies >= 1.0 m/s as SAFE", () => {
      const result = evaluateThreshold("AIR_VELOCITY", 1.8);
      expect(result.status).toBe("SAFE");
      expect(result.label).toBe("VENTILATION ADEQUATE");
    });

    it("classifies 0.5 to 0.99 m/s as WARNING (Subnormal)", () => {
      const result = evaluateThreshold("AIR_VELOCITY", 0.75);
      expect(result.status).toBe("WARNING");
      expect(result.label).toContain("SUBNORMAL AIRFLOW");
    });

    it("classifies < 0.5 m/s as CRITICAL (Stagnant Airflow Breach)", () => {
      const result = evaluateThreshold("AIR_VELOCITY", 0.3);
      expect(result.status).toBe("CRITICAL");
      expect(result.label).toContain("STAGNANT AIRFLOW");
      expect(result.rule).toBe("CMR 2017 Reg. 153 Breach");
    });
  });
});

describe("ThresholdBadge Component", () => {
  it("renders SAFE badge with correct label", () => {
    render(<ThresholdBadge metricType="CH4_PERCENT" value={0.35} />);
    expect(screen.getByText("STATUTORY NOMINAL")).toBeInTheDocument();
  });

  it("renders WARNING badge with correct label", () => {
    render(<ThresholdBadge metricType="CH4_PERCENT" value={0.92} />);
    expect(screen.getByText("ELEVATED (≥0.75%)")).toBeInTheDocument();
  });

  it("renders CRITICAL badge with correct label", () => {
    render(<ThresholdBadge metricType="CH4_PERCENT" value={1.42} />);
    expect(screen.getByText("TRIP INTERLOCK (≥1.25%)")).toBeInTheDocument();
  });
});
