import React, { useState } from "react";
import {
  Activity,
  Cpu,
  Fingerprint,
  HardHat,
  Layers,
  Lock,
  Network,
  Radio,
  Server,
  ShieldCheck,
} from "lucide-react";
import { LoginForm } from "../components/login-form";
import logoSvg from "@/assets/logo.svg";

// Role-specific workspace routes for the dynamic manifest panel
const ROLE_MANIFESTS: Record<
  string,
  {
    roleTitle: string;
    routes: Array<{ name: string; tag: string }>;
  }
> = {
  safety_officer: {
    roleTitle: "ROLE: SAFETY OFFICER / GATE OPERATOR",
    routes: [
      { name: "Pithead Gate HUD & RFID Portal", tag: "REALTIME TELEMETRY" },
      { name: "Hardware Diagnostics & Gas Interlocks", tag: "MODBUS I/O" },
      { name: "Active Incident Log & Shift Muster", tag: "COMPLIANCE SLA" },
    ],
  },
  colliery_manager: {
    roleTitle: "ROLE: COLLIERY / MINE MANAGER",
    routes: [
      { name: "Colliery Overview & Production C2", tag: "COMMAND APEX" },
      { name: "SLA Remediation Kanban Board", tag: "AUDIT PORTAL" },
      { name: "Spatial Mine Twin & GIS Visualizer", tag: "POSTGIS / 3D" },
      { name: "DGMS Statutory Reports & Form IV", tag: "LEDGER SYNC" },
    ],
  },
  overman_sirdar: {
    roleTitle: "ROLE: OVERMAN / MINING SIRDAR",
    routes: [
      { name: "Field Mobile Inspection Queue", tag: "OFFLINE SYNC" },
      { name: "District Gas & Strata Hazards", tag: "ACTIVE SHIFT" },
      { name: "Statutory Form IV Shift Handover", tag: "MANDATORY" },
    ],
  },
  dgms_regulator: {
    roleTitle: "ROLE: DGMS REGULATOR / CORPORATE HQ",
    routes: [
      { name: "National Apex Colliery Risk Heatmap", tag: "REGULATORY HUD" },
      { name: "Cryptographic SHA-256 Audit Ledger", tag: "CHAIN VERIFY" },
      { name: "Violation Analytics & Suspension Orders", tag: "STATUTORY" },
    ],
  },
  contractor_supervisor: {
    roleTitle: "ROLE: CONTRACTOR SUPERVISOR",
    routes: [
      { name: "Crew Shift Safety Gate Compliance", tag: "BIOMETRIC PAIRED" },
      { name: "PPE & Cap-Lamp Issuance Matrix", tag: "DEPOT INVENTORY" },
      { name: "Rectification Notices & Statutory Directives", tag: "CMR REG 181" },
    ],
  },
};

export const LoginPage: React.FC = () => {
  const [activeRoleId, setActiveRoleId] = useState("safety_officer");
  const manifest = ROLE_MANIFESTS[activeRoleId] || ROLE_MANIFESTS.safety_officer;

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col justify-between selection:bg-primary-container selection:text-white">
      {/* Top Header Bar */}
      <header className="w-full bg-surface-container-lowest border-b border-outline-variant/30 z-50">
        <div className="w-full px-margin-desktop py-space-sm flex flex-wrap items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-md">
            <div className="flex items-center gap-space-xs px-space-sm py-1 bg-surface-container rounded border border-outline-variant/30">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-telemetry-micro text-telemetry-micro text-on-surface-variant uppercase tracking-wider">
                DGMS STATUTORY PORTAL
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-space-xs px-space-sm py-1 bg-surface-container rounded border border-outline-variant/30">
              <Layers className="w-3.5 h-3.5 text-primary" />
              <span className="font-telemetry-micro text-telemetry-micro text-on-surface-variant uppercase tracking-wider">
                NODE: IND-EAST-MINE-09
              </span>
            </div>
          </div>

          <div className="flex items-center gap-space-md">
            <div className="flex items-center gap-space-xs px-space-sm py-1 bg-surface-container-low rounded border border-outline-variant/30">
              <Lock className="w-3.5 h-3.5 text-primary" />
              <span className="font-telemetry-micro text-telemetry-micro text-on-surface">
                TLS 1.3 // FIPS 140-3
              </span>
            </div>
            <div className="flex items-center gap-space-xs">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-telemetry-micro text-telemetry-micro text-emerald-400 font-semibold uppercase">
                SYS_ACTIVE
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center w-full px-gutter-desktop py-space-xl">
        <div className="flex flex-col w-full max-w-6xl mx-auto space-y-space-lg">
          {/* Top Command Telemetry Bar */}
          <div className="flex flex-wrap items-center justify-between gap-space-sm bg-surface-container-low px-space-md py-2 rounded border border-outline-variant/30 text-on-surface-variant shadow-sm">
            <div className="flex flex-wrap items-center gap-space-sm font-telemetry-micro text-telemetry-micro uppercase">
              <span className="inline-flex items-center gap-1.5 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                AIR-GAP ENCLAVE 09-EAST
              </span>
              <span className="text-outline-variant">/</span>
              <span className="text-on-surface">SESSION NONCE: 0xFD882A7C</span>
              <span className="text-outline-variant">/</span>
              <span className="text-sky-400">CMR-2017 CLUSTER NODE: ON-PREM</span>
            </div>

            <div className="flex items-center gap-space-md font-telemetry-micro text-telemetry-micro">
              <div className="flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  PKI HSM: <span className="text-amber-400">LUNA-PCIE-ACTIVE</span>
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Fingerprint className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  SHA-256 AUDIT:{" "}
                  <span className="text-emerald-400 font-semibold">SYNCED</span>
                </span>
              </div>
            </div>
          </div>

          {/* Gateway Main Shell Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
            {/* Left Column: Branding, Statutory Mandate & Dynamic Route Manifest */}
            <div className="lg:col-span-5 flex flex-col space-y-space-md">
              {/* Authority Header Card */}
              <div className="bg-surface-container p-space-lg rounded border border-outline-variant/40 shadow-md relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
                <div className="flex items-start gap-space-md">
                  <div className="w-14 h-14 rounded bg-surface-container-lowest p-2 border border-outline-variant/50 shadow-sm flex items-center justify-center shrink-0">
                    <img
                      src={logoSvg}
                      alt="CoalGuard Emblem"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-space-xs mb-1">
                      <span className="font-telemetry-micro text-telemetry-micro uppercase bg-sky-500/15 text-sky-300 px-1.5 py-0.5 rounded border border-sky-500/30">
                        STATUTORY ACCESS GATEWAY
                      </span>
                      <span className="font-telemetry-micro text-telemetry-micro text-amber-400 bg-amber-500/15 px-1 py-0.5 rounded border border-amber-500/30">
                        SEC-181
                      </span>
                    </div>
                    <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight truncate">
                      CoalGuard C2 Engine
                    </h1>
                    <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">
                      DGMS Statutory Oversight & Colliery Operational Intelligence Portal (CMR 2017)
                    </p>
                  </div>
                </div>

                <div className="mt-space-md pt-space-sm bg-surface-container-low/80 p-space-md rounded border border-outline-variant/20">
                  <div className="flex items-center justify-between font-telemetry-micro text-telemetry-micro text-outline mb-1">
                    <span className="uppercase">STATUTORY ANCHOR ROOT</span>
                    <span className="font-telemetry-sm text-emerald-400">
                      DGMS-HQ-DHN-001
                    </span>
                  </div>
                  <p className="font-telemetry-sm text-telemetry-sm text-on-surface-variant break-all">
                    URN:{" "}
                    <span className="text-sky-300">
                      urn:dgms:cmr2017:portal:v4-c2:incline-cluster-east
                    </span>
                  </p>
                </div>
              </div>

              {/* Live Routed Manifest Panel */}
              <div className="bg-surface-container-low p-space-md rounded border border-outline-variant/30 shadow-sm">
                <div className="flex items-center justify-between pb-space-xs mb-space-sm border-b border-outline-variant/20">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-primary" />
                    <span className="font-telemetry-micro text-telemetry-micro uppercase tracking-wider text-on-surface">
                      Target Workspaces for Active Role
                    </span>
                  </div>
                  <span className="font-telemetry-micro text-telemetry-micro text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                    {manifest.roleTitle}
                  </span>
                </div>

                <div className="space-y-1.5 font-telemetry-sm text-telemetry-sm">
                  {manifest.routes.map((route, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-space-sm py-1.5 bg-surface-container rounded border border-outline-variant/20 text-on-surface"
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {route.name}
                      </span>
                      <span className="text-on-surface-variant font-telemetry-micro text-telemetry-micro uppercase">
                        {route.tag}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Gas Baseline Visualizer Widget */}
                <div className="mt-space-md p-space-sm bg-surface-container-lowest rounded border border-outline-variant/20">
                  <div className="flex justify-between items-center text-on-surface-variant font-telemetry-micro text-telemetry-micro mb-1">
                    <span>CH4 REALTIME BOUND (CMR REG 181-B)</span>
                    <span className="text-emerald-400 font-telemetry-sm font-semibold">
                      0.28% VOL (NORMAL)
                    </span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2 rounded overflow-hidden flex">
                    <div className="bg-emerald-500 h-full" style={{ width: "28%" }} />
                    <div className="bg-surface-container-lowest h-full w-0.5" />
                    <div className="bg-amber-500 h-full opacity-50" style={{ width: "32%" }} />
                    <div className="bg-rose-500 h-full opacity-40" style={{ width: "40%" }} />
                  </div>
                  <div className="flex justify-between text-[9px] font-telemetry-micro text-outline mt-1.5">
                    <span>0.00%</span>
                    <span className="text-amber-400">WARN ≥ 0.75%</span>
                    <span className="text-rose-400">TRIP ≥ 1.25%</span>
                  </div>
                </div>
              </div>

              {/* Quick Operational Shortcuts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-xs">
                <div className="flex items-center gap-2.5 p-space-sm bg-surface-container border border-outline-variant/30 rounded text-on-surface">
                  <Radio className="w-5 h-5 text-amber-400 shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-label-sm truncate">
                      Emergency Turnstile
                    </span>
                    <span className="font-telemetry-micro text-telemetry-micro text-on-surface-variant">
                      Instant Gate Override
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 p-space-sm bg-surface-container border border-outline-variant/30 rounded text-on-surface">
                  <HardHat className="w-5 h-5 text-primary shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-label-sm truncate">
                      Colliery Workforce
                    </span>
                    <span className="font-telemetry-micro text-telemetry-micro text-on-surface-variant">
                      VTC / PME Status
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Statutory Authentication Matrix */}
            <div className="lg:col-span-7 flex flex-col bg-surface-container p-space-lg rounded border border-outline-variant/40 shadow-xl space-y-space-md">
              <LoginForm
                activeRoleId={activeRoleId}
                onRoleChange={setActiveRoleId}
              />

              {/* Auth Footnote Warnings */}
              <div className="flex flex-wrap items-center justify-between text-outline font-telemetry-micro text-telemetry-micro pt-space-xs border-t border-outline-variant/20">
                <span>GOVERNMENT OF INDIA • MINISTRY OF LABOUR &amp; EMPLOYMENT</span>
                <div className="flex items-center gap-3">
                  <span className="text-primary hover:underline cursor-pointer">
                    Statutory NDA
                  </span>
                  <span>•</span>
                  <span className="text-primary hover:underline cursor-pointer">
                    FIPS 140-3 Specs
                  </span>
                  <span>•</span>
                  <span>Mine C2 Ext: 9022</span>
                </div>
              </div>
            </div>
          </div>

          {/* Operational Telemetry Dashboard Matrix (Bottom Bar) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md pt-space-xs">
            {/* Modbus TCP Mesh Status */}
            <div className="bg-surface-container-low p-space-md rounded border border-outline-variant/30 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-space-sm">
                <div className="w-9 h-9 rounded bg-surface-container flex items-center justify-center text-primary border border-outline-variant/30">
                  <Network className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-label-md text-on-surface">
                    Modbus TCP Mesh
                  </div>
                  <div className="font-telemetry-micro text-telemetry-micro text-emerald-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Online (32 Transducers)</span>
                  </div>
                </div>
              </div>
              <div className="text-right font-telemetry-sm text-telemetry-sm">
                <div className="text-on-surface font-semibold">2.4 ms</div>
                <div className="font-telemetry-micro text-telemetry-micro text-outline">
                  LATENCY
                </div>
              </div>
            </div>

            {/* DGMS PKI Trust Anchor */}
            <div className="bg-surface-container-low p-space-md rounded border border-outline-variant/30 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-space-sm">
                <div className="w-9 h-9 rounded bg-surface-container flex items-center justify-center text-emerald-400 border border-outline-variant/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-label-md text-on-surface">
                    DGMS PKI Trust Anchor
                  </div>
                  <div className="font-telemetry-micro text-telemetry-micro text-emerald-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Verified (CCA India Root)</span>
                  </div>
                </div>
              </div>
              <div className="text-right font-telemetry-sm text-telemetry-sm">
                <div className="text-on-surface font-semibold">TLS 1.3</div>
                <div className="font-telemetry-micro text-telemetry-micro text-outline">
                  CIPHER-SUITE
                </div>
              </div>
            </div>

            {/* WASM SHA-256 Engine */}
            <div className="bg-surface-container-low p-space-md rounded border border-outline-variant/30 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-space-sm">
                <div className="w-9 h-9 rounded bg-surface-container flex items-center justify-center text-amber-400 border border-outline-variant/30">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-label-md text-on-surface">
                    WASM SHA-256 Engine
                  </div>
                  <div className="font-telemetry-micro text-telemetry-micro text-emerald-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Ready (Zero-Knowledge Proofs)</span>
                  </div>
                </div>
              </div>
              <div className="text-right font-telemetry-sm text-telemetry-sm">
                <div className="text-on-surface font-semibold">64-bit SIMD</div>
                <div className="font-telemetry-micro text-telemetry-micro text-outline">
                  RUNTIME
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
