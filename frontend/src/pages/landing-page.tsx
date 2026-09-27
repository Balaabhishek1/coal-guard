import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/store/auth-store";

interface DistrictZone {
  id: string;
  name: string;
  depth: string;
  ch4: string;
  co: string;
  airflow: string;
  personnel: number;
  status: "NORMAL" | "CAUTION" | "TRIP_READY";
}

const DISTRICT_ZONES: DistrictZone[] = [
  {
    id: "zone-1",
    name: "Sector 4 Main Haulage & Shaft Incline",
    depth: "-280m RL",
    ch4: "0.18%",
    co: "4 PPM",
    airflow: "1,850 m3/min",
    personnel: 24,
    status: "NORMAL",
  },
  {
    id: "zone-2",
    name: "Longwall Face 3 Working Panel",
    depth: "-340m RL",
    ch4: "0.62%",
    co: "9 PPM",
    airflow: "1,420 m3/min",
    personnel: 18,
    status: "CAUTION",
  },
  {
    id: "zone-3",
    name: "Continuous Miner Incline District",
    depth: "-310m RL",
    ch4: "0.31%",
    co: "6 PPM",
    airflow: "1,600 m3/min",
    personnel: 12,
    status: "NORMAL",
  },
  {
    id: "zone-4",
    name: "Return Airway Exhaust Drift B",
    depth: "-260m RL",
    ch4: "0.78%",
    co: "14 PPM",
    airflow: "2,100 m3/min",
    personnel: 2,
    status: "TRIP_READY",
  },
];

export const LandingPage: React.FC = () => {
  const { user } = useAuthStore();
  const [selectedZone, setSelectedZone] = useState<DistrictZone>(DISTRICT_ZONES[0]);

  return (
    <div className="min-h-screen bg-[#090C12] text-[#E2E6EF] font-sans antialiased selection:bg-[#232A3B] selection:text-white">
      {/* Top Technical Navigation */}
      <header className="border-b border-[#1C2130] bg-[#0C1019] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-6 h-6 border border-[#38BDF8] bg-[#101726] flex items-center justify-center font-mono text-[11px] font-bold text-[#38BDF8]">
                CG
              </div>
              <span className="font-mono text-xs tracking-wider uppercase font-semibold text-white">
                CoalGuard // C2 Engine
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-5 text-xs font-mono text-[#8C94A6]">
              <a href="#spatial-twin" className="hover:text-white transition-colors">
                Spatial Twin
              </a>
              <a href="#statutory-matrix" className="hover:text-white transition-colors">
                CMR 2017 Matrix
              </a>
              <a href="#hardware-gateway" className="hover:text-white transition-colors">
                Hardware Gateway
              </a>
              <a href="#audit-ledger" className="hover:text-white transition-colors">
                Audit Ledger
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 border border-[#22C55E]/30 bg-[#22C55E]/10 text-[#22C55E] font-mono text-[10px] tracking-wider uppercase">
              <span className="w-1.5 h-1.5 bg-[#22C55E]" />
              DGMS C2: ACTIVE
            </div>

            {user ? (
              <Link
                to="/dashboard"
                className="h-7 px-3.5 text-xs font-mono font-medium text-[#090C12] bg-white hover:bg-zinc-200 border border-white transition-colors flex items-center"
              >
                Open Operations Console
              </Link>
            ) : (
              <Link
                to="/login"
                className="h-7 px-3.5 text-xs font-mono font-medium text-[#090C12] bg-white hover:bg-zinc-200 border border-white transition-colors flex items-center"
              >
                Console Login
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b border-[#1C2130] bg-[#0A0D15] py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="space-y-4 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 border border-[#38BDF8]/30 bg-[#38BDF8]/10 text-[#38BDF8] font-mono text-[11px] tracking-wider uppercase">
              Mission-Critical Colliery Operating Infrastructure
            </div>

            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white font-sans leading-tight">
              Autonomous Safety Governance &amp; GIS Spatial Intelligence for Underground Coal Mines
            </h1>

            <p className="text-sm sm:text-base text-[#9AA3B5] leading-relaxed max-w-2xl font-sans">
              Continuous atmospheric sensor telemetry, sub-millisecond pithead gate arbitration under DGMS Coal Mines
              Regulations 2017, and immutable cryptographic audit logging across all ventilation districts.
            </p>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to={user ? "/dashboard" : "/login"}
              className="h-9 px-5 text-xs font-mono font-semibold uppercase tracking-wider text-[#090C12] bg-white hover:bg-zinc-200 border border-white transition-colors flex items-center"
            >
              Launch Operations Console
            </Link>
            <a
              href="#statutory-matrix"
              className="h-9 px-5 text-xs font-mono font-medium uppercase tracking-wider text-[#C2C8D6] hover:text-white bg-[#121622] hover:bg-[#181D2D] border border-[#262C3E] transition-colors flex items-center"
            >
              Review Statutory Specifications
            </a>
          </div>

          {/* 4-Metric Telemetry Strip (NOT 3 feature cards) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-6">
            <div className="bg-[#0E121C] border border-[#1C2232] p-4 rounded-[3px]">
              <div className="text-[10px] font-mono text-[#8C94A6] uppercase tracking-wider">
                Gate Arbitration Speed
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">
                0.85 ms
              </div>
              <div className="text-[11px] text-[#788194] mt-0.5">
                Sub-millisecond optical &amp; RFID turnstile interlock
              </div>
            </div>

            <div className="bg-[#0E121C] border border-[#1C2232] p-4 rounded-[3px]">
              <div className="text-[10px] font-mono text-[#8C94A6] uppercase tracking-wider">
                CMR 2017 Reg. 169(3)
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-[#22C55E] mt-1">
                100% Enforced
              </div>
              <div className="text-[11px] text-[#788194] mt-0.5">
                Automated electrical trip when CH4 &gt;= 1.25%
              </div>
            </div>

            <div className="bg-[#0E121C] border border-[#1C2232] p-4 rounded-[3px]">
              <div className="text-[10px] font-mono text-[#8C94A6] uppercase tracking-wider">
                Spatial Coordinate Nodes
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-[#38BDF8] mt-1">
                10,000+
              </div>
              <div className="text-[11px] text-[#788194] mt-0.5">
                PostGIS TimescaleDB RTK underground mesh
              </div>
            </div>

            <div className="bg-[#0E121C] border border-[#1C2232] p-4 rounded-[3px]">
              <div className="text-[10px] font-mono text-[#8C94A6] uppercase tracking-wider">
                Ledger Immutability
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">
                SHA-256
              </div>
              <div className="text-[11px] text-[#788194] mt-0.5">
                Cryptographic tamper-evident statutory record
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Spatial Twin Simulation Preview */}
      <section id="spatial-twin" className="border-b border-[#1C2130] bg-[#090C12] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#38BDF8]">
                Geospatial Colliery Twin // RTK Positioning
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-sans mt-0.5">
                Ventilation District Telemetry &amp; Spatial Coordinates
              </h2>
            </div>
            <div className="text-xs font-mono text-[#8C94A6]">
              Coordinates: 23° 47' 12" N, 86° 24' 35" E | Datum: WGS 84
            </div>
          </div>

          {/* Interactive GIS Preview Shell */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 bg-[#0D111A] border border-[#1C2232] p-4 rounded-[3px]">
            {/* Left District Selector List */}
            <div className="lg:col-span-4 space-y-2">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#788194] pb-1 border-b border-[#1C2232]">
                Active Ventilation Districts
              </div>
              {DISTRICT_ZONES.map((zone) => {
                const isSelected = selectedZone.id === zone.id;
                return (
                  <button
                    key={zone.id}
                    onClick={() => setSelectedZone(zone)}
                    className={`w-full text-left p-3 border transition-colors ${
                      isSelected
                        ? "bg-[#141A29] border-[#38BDF8]/60 text-white"
                        : "bg-[#0A0D15] border-[#1A2030] text-[#9AA3B5] hover:bg-[#101420] hover:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-semibold">{zone.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 border ${
                          zone.status === "NORMAL"
                            ? "border-[#22C55E]/40 text-[#22C55E]"
                            : zone.status === "CAUTION"
                            ? "border-[#F59E0B]/40 text-[#F59E0B]"
                            : "border-[#F43F5E]/40 text-[#F43F5E]"
                        }`}
                      >
                        {zone.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-2 text-[11px] font-mono text-[#788194]">
                      <div>Depth: {zone.depth}</div>
                      <div>CH4: {zone.ch4}</div>
                      <div>Muster: {zone.personnel}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right Interactive Coordinate Visualizer */}
            <div className="lg:col-span-8 bg-[#080A10] border border-[#1A2030] p-4 rounded-[3px] flex flex-col justify-between min-h-[320px]">
              <div className="flex items-center justify-between border-b border-[#161B28] pb-2 text-xs font-mono">
                <span className="text-[#38BDF8]">
                  Sector Node: {selectedZone.name}
                </span>
                <span className="text-[#788194]">Elevation: {selectedZone.depth}</span>
              </div>

              {/* Vector Mine Geometry Schematic */}
              <div className="relative h-48 my-4 flex items-center justify-center border border-[#141824] bg-[#07090E]">
                <svg className="w-full h-full" viewBox="0 0 600 200">
                  {/* Coordinate Grid lines */}
                  <line x1="0" y1="50" x2="600" y2="50" stroke="#161B28" strokeDasharray="3 3" />
                  <line x1="0" y1="100" x2="600" y2="100" stroke="#161B28" strokeDasharray="3 3" />
                  <line x1="0" y1="150" x2="600" y2="150" stroke="#161B28" strokeDasharray="3 3" />
                  <line x1="150" y1="0" x2="150" y2="200" stroke="#161B28" strokeDasharray="3 3" />
                  <line x1="300" y1="0" x2="300" y2="200" stroke="#161B28" strokeDasharray="3 3" />
                  <line x1="450" y1="0" x2="450" y2="200" stroke="#161B28" strokeDasharray="3 3" />

                  {/* Haulage Drift Track */}
                  <path
                    d="M 20,40 L 140,80 L 260,70 L 380,130 L 520,110 L 580,160"
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth="2"
                  />

                  {/* Return Airway Track */}
                  <path
                    d="M 30,120 L 180,140 L 320,110 L 460,80 L 570,90"
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                  />

                  {/* Target Node Beacon */}
                  <circle cx="380" cy="130" r="6" fill="#38BDF8" />
                  <circle cx="380" cy="130" r="14" fill="none" stroke="#38BDF8" strokeWidth="1" opacity="0.6" />
                  <text x="395" y="134" fill="#FFFFFF" fontSize="10" fontFamily="monospace">
                    ACTIVE SECTOR BEACON [RTK LOCK]
                  </text>

                  {/* Sensor Nodes */}
                  <circle cx="140" cy="80" r="4" fill="#22C55E" />
                  <circle cx="260" cy="70" r="4" fill="#22C55E" />
                  <circle cx="520" cy="110" r="4" fill="#22C55E" />
                </svg>

                <div className="absolute bottom-2 left-2 text-[10px] font-mono text-[#626B7E]">
                  Vector Scale: 1:5000 Metric | Continuous Airway Incline
                </div>
              </div>

              {/* Node Telemetry Readout */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#161B28] text-xs font-mono">
                <div>
                  <span className="text-[10px] text-[#788194] block">METHANE (CH4)</span>
                  <span className="font-bold text-white">{selectedZone.ch4}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#788194] block">CARBON MONOXIDE</span>
                  <span className="font-bold text-white">{selectedZone.co}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#788194] block">VENTILATION FLOW</span>
                  <span className="font-bold text-white">{selectedZone.airflow}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#788194] block">ACTIVE MUSTER</span>
                  <span className="font-bold text-[#38BDF8]">{selectedZone.personnel} Personnel</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DGMS CMR 2017 Statutory Matrix Section (Structured 2-column layout) */}
      <section id="statutory-matrix" className="border-b border-[#1C2130] bg-[#0A0D15] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#22C55E]">
              Regulatory Conformance Framework
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white font-sans mt-0.5">
              Statutory Alignment: Coal Mines Regulations 2017
            </h2>
            <p className="text-xs text-[#8C94A6] max-w-xl font-sans mt-1">
              Direct implementation of safety mandates established under the Directorate General of Mines Safety (DGMS)
              and the Indian Mines Act 1952.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Regulation 169 Card */}
            <div className="bg-[#0E121C] border border-[#1C2232] p-5 rounded-[3px] space-y-3">
              <div className="flex items-center justify-between border-b border-[#1C2232] pb-2.5">
                <span className="font-mono text-xs font-bold text-[#38BDF8]">
                  CMR 2017 Regulation 169
                </span>
                <span className="font-mono text-[10px] px-2 py-0.5 border border-[#22C55E]/40 bg-[#22C55E]/10 text-[#22C55E]">
                  Statutory Mandate
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white font-sans">
                Continuous Environmental Gas Monitoring &amp; Electrical Interlocking
              </h3>
              <p className="text-xs text-[#9AA3B5] leading-relaxed">
                Automated continuous monitoring of inflammable gas (CH4), carbon monoxide (CO), oxygen (O2), and air velocity
                in return airways and coal extraction districts. Instantaneous command of electrical sectional trips upon detection
                of 1.25% CH4 concentration under statutory clause 169(3).
              </p>
              <div className="pt-2 text-[11px] font-mono text-[#788194]">
                Enforcement Protocol: Sub-millisecond Modbus TCP trip coil trigger
              </div>
            </div>

            {/* Regulation 182/184 Card */}
            <div className="bg-[#0E121C] border border-[#1C2232] p-5 rounded-[3px] space-y-3">
              <div className="flex items-center justify-between border-b border-[#1C2232] pb-2.5">
                <span className="font-mono text-xs font-bold text-[#38BDF8]">
                  CMR 2017 Regulations 182 &amp; 184
                </span>
                <span className="font-mono text-[10px] px-2 py-0.5 border border-[#22C55E]/40 bg-[#22C55E]/10 text-[#22C55E]">
                  Statutory Mandate
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white font-sans">
                Pithead Checkpoint Optical PPE &amp; SCSR Verification
              </h3>
              <p className="text-xs text-[#9AA3B5] leading-relaxed">
                Dual-stage optical neural inference arbitrating mandatory Self-Contained Self-Rescuer (SCSR) apparatus,
                safety helmets, high-visibility reflective vests, and safety boots. Fully synchronizes with RFID turnstile
                barriers to prevent uncertified or non-compliant personnel from entering underground mine shafts.
              </p>
              <div className="pt-2 text-[11px] font-mono text-[#788194]">
                Enforcement Protocol: Real-time turnstile barrier solenoid lock
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hardware Gateway Integration Section */}
      <section id="hardware-gateway" className="border-b border-[#1C2130] bg-[#090C12] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#38BDF8]">
              Edge Architecture &amp; Telemetry Protocols
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white font-sans mt-0.5">
              Industrial Hardware &amp; Field Gateway Integration
            </h2>
            <p className="text-xs text-[#8C94A6] max-w-xl font-sans mt-1">
              Engineered for extreme subterranean environments, electromagnetic interference, and zero network tolerance.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-[#0C101A] border border-[#1A2030] p-4 rounded-[3px] space-y-1.5">
              <div className="font-mono text-xs font-bold text-white">Modbus TCP / RTU</div>
              <div className="text-[10px] font-mono text-[#38BDF8]">Port 502 Industrial Bus</div>
              <p className="text-xs text-[#8C94A6]">
                Direct telemetry acquisition from certified colliery gas sensors and ventilation fan drives.
              </p>
            </div>

            <div className="bg-[#0C101A] border border-[#1A2030] p-4 rounded-[3px] space-y-1.5">
              <div className="font-mono text-xs font-bold text-white">LoRaWAN Mesh Gateway</div>
              <div className="text-[10px] font-mono text-[#38BDF8]">865 to 868 MHz Sub-GHz</div>
              <p className="text-xs text-[#8C94A6]">
                Long-range non-line-of-sight communication through curved underground stone drifts and coal pillars.
              </p>
            </div>

            <div className="bg-[#0C101A] border border-[#1A2030] p-4 rounded-[3px] space-y-1.5">
              <div className="font-mono text-xs font-bold text-white">ATEX / IECEx Cert</div>
              <div className="text-[10px] font-mono text-[#38BDF8]">Ex ia I Ma Flameproof</div>
              <p className="text-xs text-[#8C94A6]">
                Intrinsically safe edge appliances verified for installation in Degree III gassy coal seams.
              </p>
            </div>

            <div className="bg-[#0C101A] border border-[#1A2030] p-4 rounded-[3px] space-y-1.5">
              <div className="font-mono text-xs font-bold text-white">PostGIS &amp; TimescaleDB</div>
              <div className="text-[10px] font-mono text-[#38BDF8]">Spatial Time-Series Storage</div>
              <p className="text-xs text-[#8C94A6]">
                Sub-second spatial querying over millions of continuous environmental telemetry records.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cryptographic Audit Ledger Section */}
      <section id="audit-ledger" className="border-b border-[#1C2130] bg-[#0A0D15] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="max-w-2xl space-y-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#38BDF8]">
              Cryptographic Statutory Record Keeping
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white font-sans">
              Non-Repudiable SHA-256 Governance Ledger
            </h2>
            <p className="text-xs text-[#9AA3B5] leading-relaxed">
              Every safety violation, shift supervisor inspection, Form IV entry, and automated trip event is mathematically
              chained to previous records. Modifying past records invalidates the entire subsequent cryptographic chain,
              guaranteeing uncompromised evidence during DGMS regulatory inquiries.
            </p>
          </div>

          <div className="bg-[#080B12] border border-[#1A2030] p-4 rounded-[3px] font-mono text-xs space-y-2 overflow-x-auto">
            <div className="text-[#687285] text-[11px] pb-1 border-b border-[#141824]">
              Sample Cryptographic Ledger Block Structure [SHA-256 Sequence]
            </div>
            <div className="text-[#8E97AA] leading-relaxed">
              BLOCK #48291 | TIMESTAMP: 2026-03-22T08:14:02.194Z | DISTRICT: SECTOR-04-FACE<br />
              PREV_HASH: 7a8f3b04c519d08e6f1a8c9b4e3f2a10d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4<br />
              EVENT_PAYLOAD: CMR_169_3_GAS_ALERT | CH4: 1.34% | COMMAND: SECTIONAL_CIRCUIT_TRIP_SUCCESS<br />
              BLOCK_HASH: 3c9e81b47d02a5f6e891c2b3d4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3 [VERIFIED]
            </div>
          </div>
        </div>
      </section>

      {/* Footer & Legal Information */}
      <footer className="bg-[#07090F] py-12 text-xs font-mono text-[#788194]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#161B28] pb-8">
            <div className="space-y-1">
              <div className="text-white font-semibold text-sm">CoalGuard Safety Operating System</div>
              <div className="text-[11px]">Subterranean Colliery Command, Telemetry &amp; Statutory Governance</div>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <Link to="/terms" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link to="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link to="/login" className="hover:text-white transition-colors">
                Console Access
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-[#555E70]">
            <div>
              Statutory compliance framework aligned with Directorate General of Mines Safety (DGMS) and Indian Mines Act 1952.
            </div>
            <div>
              CoalGuard v1.0.0 | Enterprise Subterranean C2
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
