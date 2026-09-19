import apiClient from "@/lib/api-client";
import type { ReportGeneratePayload, ReportMetadata } from "@/types/reports";

export const STATUTORY_REPORTS_CATALOG: ReportMetadata[] = [
  {
    id: "DGMS_SHIFT_SUMMARY",
    title: "DGMS CMR 2017 Form IV Shift Report",
    subtitle: "Official Shift Safety & Statutory Atmospheric Journal",
    statutoryReference: "Regulation 182 / Form IV, Coal Mines Regulations 2017",
    description:
      "Comprehensive underground shift log compiling statutory air velocities, CH4/CO gas thresholds, pithead turnstile biometric muster, and pending high-priority violations.",
    badgeText: "CMR FORM IV",
    frequency: "Every Shift (Shift 1 / 2 / 3)",
    requiresParameters: true,
  },
  {
    id: "MSRI_SCORECARD",
    title: "Mine Safety Risk Index (MSRI) Scorecard",
    subtitle: "Executive Safety Scorecard & Hazard Dispersion Matrix",
    statutoryReference: "DGMS Circular No. 04 / Technical Standard 2021",
    description:
      "Aggregated risk index scorecard evaluating structural ventilation stability, roof-bolt torque anomalies, contractor PPE compliance rates, and machine explosion-proof health.",
    badgeText: "EXECUTIVE MSRI",
    frequency: "Daily / Weekly Audit",
    requiresParameters: false,
  },
  {
    id: "AUDIT_CHAIN_VERIFICATION",
    title: "Cryptographic Audit Ledger Certificate",
    subtitle: "SHA-256 Tamper-Proof Hash Chain Integrity Proof",
    statutoryReference: "Indian Evidence Act Sec 65B & CMR Statutory Proof",
    description:
      "Statutory cryptographic audit certificate detailing linear SHA-256 hash chains, block heights, nonces, and timestamped root hashes proving zero alteration in safety records.",
    badgeText: "SHA-256 PROOF",
    frequency: "On Demand / Regulatory Audit",
    requiresParameters: false,
  },
];

/**
 * Downloads a statutory report from backend as a binary PDF Blob
 */
export async function downloadReport(
  payload: ReportGeneratePayload
): Promise<Blob> {
  try {
    // Attempt POST /reports/generate first
    const res = await apiClient.post("/reports/generate", payload, {
      responseType: "blob",
    });
    return res.data;
  } catch (err) {
    console.warn("POST /reports/generate failed, trying dedicated GET endpoint:", err);

    // Fallback to dedicated GET endpoints
    let endpoint = "/reports/dgms-shift";
    const params: Record<string, string> = {};

    if (payload.mine_code) params.mine_code = payload.mine_code;
    if (payload.shift) params.shift = payload.shift;

    if (payload.report_type === "MSRI_SCORECARD") {
      endpoint = "/reports/msri-scorecard";
    } else if (payload.report_type === "AUDIT_CHAIN_VERIFICATION") {
      endpoint = "/reports/audit-chain-proof";
    }

    const getRes = await apiClient.get(endpoint, {
      params,
      responseType: "blob",
    });
    return getRes.data;
  }
}

/**
 * Programmatically triggers a browser file download from a binary Blob
 */
export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => window.URL.revokeObjectURL(url), 1000);
}
