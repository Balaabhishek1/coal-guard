import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth-store";
import ProtectedRoute from "@/components/protected-route";
import MainLayout from "@/layouts/main-layout";
import LoginPage from "@/features/auth/pages/login-page";
import DashboardPage from "@/pages/dashboard-page";
import UnauthorizedPage from "@/pages/unauthorized-page";
import WorkspacePlaceholder from "@/pages/workspace-placeholder";
import HardwareMatrixPage from "@/features/hardware/pages/hardware-matrix-page";
import TelemetryDashboardPage from "@/features/telemetry/pages/telemetry-dashboard-page";
import GateHudPage from "@/features/cctv-gate/pages/gate-hud-page";
import RemediationPage from "@/features/governance/pages/remediation-page";
import AuditLedgerPage from "@/features/governance/pages/audit-ledger-page";
import SyncDashboardPage from "@/features/field-ops/pages/sync-dashboard-page";
import FormIVExplorerPage from "@/features/field-ops/pages/form-iv-explorer-page";
import OcrStudioPage from "@/features/documents/pages/ocr-studio-page";
import ReportsDashboardPage from "@/features/reports/pages/reports-dashboard-page";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Role-aware root redirect component
const RootRedirect: React.FC = () => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;

  const role = String(user.role).toUpperCase();

  switch (role) {
    case "SAFETY_OFFICER":
    case "GATE_OPERATOR":
      return <Navigate to="/gate-hud" replace />;
    case "COLLIERY_MANAGER":
    case "MANAGER":
      return <Navigate to="/manager-dashboard" replace />;
    case "OVERMAN":
    case "MINING_SIRDAR":
      return <Navigate to="/district-remediation" replace />;
    case "DGMS_INSPECTOR":
    case "CORPORATE_HQ":
      return <Navigate to="/apex-overview" replace />;
    case "CONTRACTOR_SUPERVISOR":
      return <Navigate to="/contractor-workforce" replace />;
    default:
      return <Navigate to="/dashboard" replace />;
  }
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Protected Shell Layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<RootRedirect />} />
              <Route path="/dashboard" element={<DashboardPage />} />

              {/* Safety Officer & Gate Operator Workspace */}
              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      "SAFETY_OFFICER",
                      "GATE_OPERATOR",
                      "COLLIERY_MANAGER",
                      "MANAGER",
                      "OVERMAN",
                      "ADMIN",
                    ]}
                  />
                }
              >
                <Route path="/gate-hud" element={<GateHudPage />} />
                <Route
                  path="/incident-log"
                  element={
                    <WorkspacePlaceholder
                      title="Active Incident Log"
                      subtitle="Underground Shift Safety Violations & Rapid Escalation Feed"
                      phaseText="PHASE 3 AUDIT COMPONENT"
                      statutoryRole="SAFETY_OFFICER / GATE_OPERATOR"
                    />
                  }
                />
              </Route>

              {/* Hardware Diagnostics & Muster (Safety Officer + Manager) */}
              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      "SAFETY_OFFICER",
                      "COLLIERY_MANAGER",
                      "MANAGER",
                      "ADMIN",
                    ]}
                  />
                }
              >
                <Route path="/hardware-matrix" element={<HardwareMatrixPage />} />
                <Route path="/diagnostics" element={<HardwareMatrixPage />} />
                <Route
                  path="/muster-roll"
                  element={
                    <WorkspacePlaceholder
                      title="Shift Inbye/Outbye Muster Roll"
                      subtitle="Live Underground Personnel Counting & Biometric Tracking"
                      phaseText="PHASE 2 ACTIVE COMPONENT"
                      statutoryRole="SAFETY_OFFICER / COLLIERY_MANAGER"
                    />
                  }
                />
              </Route>

              {/* Colliery / Mine Manager Workspace */}
              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={["COLLIERY_MANAGER", "MANAGER", "ADMIN"]}
                  />
                }
              >
                <Route
                  path="/manager-dashboard"
                  element={
                    <WorkspacePlaceholder
                      title="Colliery Operational Overview"
                      subtitle="High-level KPI Aggregation, Shift Production & Threat Matrix"
                      phaseText="PHASE 4 ACTIVE COMPONENT"
                      statutoryRole="COLLIERY_MANAGER"
                    />
                  }
                />
                <Route
                  path="/workforce-compliance"
                  element={
                    <WorkspacePlaceholder
                      title="Workforce & VTC Credentials"
                      subtitle="Underground Training Expiry and Medical Compliance Auditing"
                      phaseText="PHASE 4 ACTIVE COMPONENT"
                      statutoryRole="COLLIERY_MANAGER"
                    />
                  }
                />
              </Route>

              {/* Statutory Governance: Remediation Kanban (Manager, Overman, Safety Officer, Admin) */}
              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      "COLLIERY_MANAGER",
                      "MANAGER",
                      "OVERMAN",
                      "SAFETY_OFFICER",
                      "ADMIN",
                    ]}
                  />
                }
              >
                <Route
                  path="/governance/remediation"
                  element={<RemediationPage />}
                />
                <Route
                  path="/remediation-board"
                  element={<RemediationPage />}
                />
              </Route>

              {/* Atmospheric Gas Telemetry & Environmental HUD (Safety Officers, Managers, Regulators, Overmen) */}
              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      "SAFETY_OFFICER",
                      "COLLIERY_MANAGER",
                      "MANAGER",
                      "DGMS_INSPECTOR",
                      "OVERMAN",
                      "ADMIN",
                    ]}
                  />
                }
              >
                <Route
                  path="/environmental-trends"
                  element={<TelemetryDashboardPage />}
                />
                <Route
                  path="/telemetry"
                  element={<TelemetryDashboardPage />}
                />
              </Route>

              {/* Spatial Mine Twin & Reports (Manager + DGMS) */}
              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      "COLLIERY_MANAGER",
                      "MANAGER",
                      "DGMS_INSPECTOR",
                      "ADMIN",
                    ]}
                  />
                }
              >
                <Route
                  path="/gis-twin"
                  element={
                    <WorkspacePlaceholder
                      title="Spatial Mine Twin & GIS Visualizer"
                      subtitle="2D/3D PostGIS Seams, Gallery Vectors, and Geofences via MapLibre GL"
                      phaseText="PHASE 2/3 SPATIAL ENGINE"
                      statutoryRole="COLLIERY_MANAGER / DGMS_INSPECTOR"
                    />
                  }
                />
                <Route
                  path="/statutory-reports"
                  element={<ReportsDashboardPage />}
                />
                <Route
                  path="/reports"
                  element={<ReportsDashboardPage />}
                />
              </Route>

              {/* Multimodal OCR Digitization Studio */}
              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      "COLLIERY_MANAGER",
                      "MANAGER",
                      "OVERMAN",
                      "SAFETY_OFFICER",
                      "ADMIN",
                    ]}
                  />
                }
              >
                <Route
                  path="/documents/ocr"
                  element={<OcrStudioPage />}
                />
                <Route
                  path="/ocr-studio"
                  element={<OcrStudioPage />}
                />
              </Route>

              {/* Field Operations: Mobile Sync Dashboard */}
              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      "OVERMAN",
                      "MINING_SIRDAR",
                      "COLLIERY_MANAGER",
                      "MANAGER",
                      "ADMIN",
                    ]}
                  />
                }
              >
                <Route
                  path="/field-ops/sync-logs"
                  element={<SyncDashboardPage />}
                />
                <Route
                  path="/field-queue"
                  element={<SyncDashboardPage />}
                />
              </Route>

              {/* Field Operations: CMR 2017 Form IV Inspection Explorer */}
              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      "OVERMAN",
                      "MINING_SIRDAR",
                      "COLLIERY_MANAGER",
                      "MANAGER",
                      "DGMS_INSPECTOR",
                      "ADMIN",
                    ]}
                  />
                }
              >
                <Route
                  path="/field-ops/form-iv"
                  element={<FormIVExplorerPage />}
                />
                <Route
                  path="/shift-diary"
                  element={<FormIVExplorerPage />}
                />
              </Route>

              {/* Field Inspector & Overman Workspace */}
              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={["OVERMAN", "MINING_SIRDAR", "ADMIN"]}
                  />
                }
              >
                <Route
                  path="/district-remediation"
                  element={
                    <WorkspacePlaceholder
                      title="Ventilation District Hazards"
                      subtitle="Assigned Underground Safety Tickets & Corrective Action Directives"
                      phaseText="PHASE 5 FIELD OPS"
                      statutoryRole="OVERMAN / MINING_SIRDAR"
                    />
                  }
                />
              </Route>

              {/* Statutory Governance: Cryptographic Audit Ledger (Manager, DGMS Inspector, Admin, Corporate HQ) */}
              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      "COLLIERY_MANAGER",
                      "MANAGER",
                      "DGMS_INSPECTOR",
                      "ADMIN",
                      "CORPORATE_HQ",
                    ]}
                  />
                }
              >
                <Route
                  path="/governance/audit-ledger"
                  element={<AuditLedgerPage />}
                />
                <Route
                  path="/audit-ledger"
                  element={<AuditLedgerPage />}
                />
              </Route>

              {/* Corporate HQ & DGMS Regulatory Workspace */}
              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={["CORPORATE_HQ", "DGMS_INSPECTOR", "ADMIN"]}
                  />
                }
              >
                <Route
                  path="/apex-overview"
                  element={
                    <WorkspacePlaceholder
                      title="Apex Risk Heatmap & Governance"
                      subtitle="Multi-Subsidiary Risk Scoring, MSRI Aggregations, and Alert Feeds"
                      phaseText="PHASE 4 REGULATORY C2"
                      statutoryRole="CORPORATE_HQ / DGMS_INSPECTOR"
                    />
                  }
                />
                <Route
                  path="/regulatory-violations"
                  element={
                    <WorkspacePlaceholder
                      title="Regulatory Violation Analytics"
                      subtitle="DGMS Violation Trends, Repeat Offender Profiling & Root Cause Reports"
                      phaseText="PHASE 4 ANALYTICS"
                      statutoryRole="CORPORATE_HQ / DGMS_INSPECTOR"
                    />
                  }
                />
                <Route
                  path="/audit-exporter"
                  element={<ReportsDashboardPage />}
                />
              </Route>

              {/* Contractor Supervisor Workspace */}
              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={["CONTRACTOR_SUPERVISOR", "ADMIN"]}
                  />
                }
              >
                <Route
                  path="/contractor-workforce"
                  element={
                    <WorkspacePlaceholder
                      title="Crew Safety Compliance Matrix"
                      subtitle="Outsourced Personnel VTC/PME Certification & Gate Clearances"
                      phaseText="PHASE 4 WORKFORCE"
                      statutoryRole="CONTRACTOR_SUPERVISOR"
                    />
                  }
                />
                <Route
                  path="/contractor-tickets"
                  element={
                    <WorkspacePlaceholder
                      title="Contractor Safety Notices"
                      subtitle="Rectification Directives Issued by Colliery Safety Officers"
                      phaseText="PHASE 4 REMEDIATION"
                      statutoryRole="CONTRACTOR_SUPERVISOR"
                    />
                  }
                />
              </Route>
            </Route>
          </Route>

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
