/**
 * Environmental Telemetry & Atmospheric Gas Ingestion Types
 * Aligned strictly with CMR 2017 Regulations and TimescaleDB hypertable schemas.
 */

export type MetricType =
  | "CH4_PERCENT"
  | "CO_PPM"
  | "AIR_VELOCITY"
  | "TEMPERATURE"
  | "HUMIDITY";

export type ThresholdStatus = "SAFE" | "WARNING" | "CRITICAL";

export interface GasReadingPoint {
  bucket: string;
  avg_reading: number;
  peak_reading: number;
  count?: number;
}

export interface GasHistoryResponse {
  metric_type: MetricType;
  time_range: string;
  points: GasReadingPoint[];
}

export interface StatutoryAlert {
  alert_type: string;
  severity: "WARNING" | "CRITICAL";
  metric: string;
  value: number;
  threshold: number;
  statutory_rule: string;
  message: string;
  timestamp: string;
}

export interface LatestDeviceTelemetry {
  hardware_id: string;
  count: number;
  readings: Array<{
    time: string;
    metric_type: string;
    reading_value: number;
  }>;
}

export interface GasMetricConfig {
  key: MetricType;
  label: string;
  symbol: string;
  unit: string;
  nominalRange: string;
  warningThreshold: number;
  criticalThreshold: number;
  statutoryRule: string;
}

export const STATUTORY_METRIC_CONFIGS: Record<MetricType, GasMetricConfig> = {
  CH4_PERCENT: {
    key: "CH4_PERCENT",
    label: "Methane Concentration",
    symbol: "CH4",
    unit: "% VOL",
    nominalRange: "0.00% - 0.74%",
    warningThreshold: 0.75,
    criticalThreshold: 1.25,
    statutoryRule: "CMR 2017 Reg. 169(3) Power Trip",
  },
  CO_PPM: {
    key: "CO_PPM",
    label: "Carbon Monoxide Trace",
    symbol: "CO",
    unit: "PPM",
    nominalRange: "0.0 - 24.9 PPM",
    warningThreshold: 25.0,
    criticalThreshold: 50.0,
    statutoryRule: "CMR 2017 Reg. 142 Spontaneous Heating",
  },
  AIR_VELOCITY: {
    key: "AIR_VELOCITY",
    label: "Ventilation Airflow Velocity",
    symbol: "Air Velocity",
    unit: "m/s",
    nominalRange: ">= 1.0 m/s",
    warningThreshold: 1.0, // Below 1.0 is warning
    criticalThreshold: 0.5, // Below 0.5 is critical
    statutoryRule: "CMR 2017 Reg. 153 Minimum Ventilation",
  },
  TEMPERATURE: {
    key: "TEMPERATURE",
    label: "Ambient Gallery Temperature",
    symbol: "Temp",
    unit: "°C",
    nominalRange: "20.0°C - 30.0°C",
    warningThreshold: 33.5,
    criticalThreshold: 38.0,
    statutoryRule: "CMR 2017 Thermal Stress Protocol",
  },
  HUMIDITY: {
    key: "HUMIDITY",
    label: "Relative Humidity",
    symbol: "RH",
    unit: "%",
    nominalRange: "40% - 75%",
    warningThreshold: 85.0,
    criticalThreshold: 95.0,
    statutoryRule: "CMR 2017 Psychrometric Balance",
  },
};
