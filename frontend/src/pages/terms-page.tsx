import React from "react";
import { Link } from "react-router-dom";

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0A0D14] text-[#E1E4EA] font-sans antialiased selection:bg-[#252A38] selection:text-white">
      {/* Top Navigation */}
      <header className="border-b border-[#1E2230] bg-[#0E111A] sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group text-decoration-none">
            <div className="w-6 h-6 border border-[#38BDF8] bg-[#111624] flex items-center justify-center font-mono text-[11px] font-bold text-[#38BDF8]">
              CG
            </div>
            <span className="font-mono text-xs tracking-wider uppercase font-semibold text-white">
              CoalGuard // Statutory C2
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/privacy"
              className="text-xs font-mono text-[#8E95A5] hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to="/login"
              className="h-7 px-3 text-xs font-mono font-medium text-[#0A0D14] bg-white hover:bg-zinc-200 border border-white transition-colors flex items-center"
            >
              Console Login
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <div className="space-y-2 border-b border-[#1E2230] pb-6">
          <div className="inline-block px-2 py-0.5 border border-[#38BDF8]/40 bg-[#38BDF8]/10 text-[#38BDF8] font-mono text-[10px] tracking-wider uppercase">
            Statutory Legal Framework: Indian Mines Act 1952 &amp; CMR 2017
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
            Statutory Terms of Service &amp; Colliery Operating Regulations
          </h1>
          <p className="text-xs font-mono text-[#8E95A5]">
            Effective Date: March 1, 2026 | Document Reference: CG-STAT-TOS-2026-V2 | DGMS Circular Approved
          </p>
        </div>

        {/* Section 1 */}
        <section className="space-y-3 bg-[#0E111A] border border-[#1E2230] p-5 rounded-[3px]">
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[#38BDF8] flex items-center gap-2">
            <span>01.</span> Statutory Scope &amp; Legal Precedence
          </h2>
          <p className="text-xs leading-relaxed text-[#B0B7C6]">
            CoalGuard operates as an enterprise Colliery Command, Control, and Telemetry (C2) monitoring infrastructure.
            Use of this system is governed by the statutory provisions of the Mines Act 1952, Coal Mines Regulations (CMR) 2017,
            and the Occupational Safety, Health and Working Conditions Code 2020. In any event of discrepancy between automated
            software directives and statutory orders issued by the Directorate General of Mines Safety (DGMS) or appointed
            Colliery Managers, statutory mine regulations shall take absolute precedence.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3 bg-[#0E111A] border border-[#1E2230] p-5 rounded-[3px]">
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[#38BDF8] flex items-center gap-2">
            <span>02.</span> Colliery Manager &amp; Supervisory Personnel Accountability
          </h2>
          <p className="text-xs leading-relaxed text-[#B0B7C6]">
            Under CMR 2017 Regulations 27, 34, 43, and 47, ultimate statutory responsibility for mine ventilation, strata stability,
            and underground worker safety rests with the certified Colliery Manager, Safety Officers, Overmen, and Mining Sirdars.
            CoalGuard provides decision support, automated sensor telemetry, and cryptographic verification logs.
            Supervisory personnel must independently verify safety conditions during mandatory Form IV statutory shift inspections.
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-3 bg-[#0E111A] border border-[#1E2230] p-5 rounded-[3px]">
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[#38BDF8] flex items-center gap-2">
            <span>03.</span> Automated Electrical Trips &amp; Interlock Directives
          </h2>
          <p className="text-xs leading-relaxed text-[#B0B7C6]">
            In strict compliance with CMR 2017 Regulation 169(3), CoalGuard features automated trip interfaces connected to
            district circuit breakers. When inflammable gas (methane / CH4) concentration reaches or exceeds 1.25% in any return
            airway or working face, the system automatically commands electrical isolations. Operators acknowledge that
            overriding an automated safety interlock requires authenticated dual-key authorization by a certified Colliery Manager
            and creates an immutable cryptographic record reported to regional DGMS inspectorates.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-3 bg-[#0E111A] border border-[#1E2230] p-5 rounded-[3px]">
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[#38BDF8] flex items-center gap-2">
            <span>04.</span> Cryptographic Audit Ledger &amp; Non-Repudiation
          </h2>
          <p className="text-xs leading-relaxed text-[#B0B7C6]">
            All shift muster access attempts, PPE breach detections, Form IV diary entries, and emergency trip commands are
            anchored in a SHA-256 cryptographic hash-chain ledger. Each block incorporates the cryptographic hash of the preceding
            record. Users acknowledge and agree that ledger entries are legally admissible statutory records, non-repudiable, and
            subject to subpoena and audit by the Ministry of Coal and DGMS courts of inquiry.
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-3 bg-[#0E111A] border border-[#1E2230] p-5 rounded-[3px]">
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[#38BDF8] flex items-center gap-2">
            <span>05.</span> Hardware Sensor Compatibility &amp; Intrinsic Safety
          </h2>
          <p className="text-xs leading-relaxed text-[#B0B7C6]">
            All edge transponders, gas sensors, RFID interrogators, and LoRaWAN gateways interfacing with CoalGuard inside
            underground hazardous zones (Gassy Mines Degree I, II, and III) must hold valid DGMS Approval and intrinsic safety
            certifications (IS/IEC 60079-11 Ex ia / ib). Deploying non-certified or modified hardware immediately voids warranty
            and triggers automated alert logging under Section 72 of the Mines Act 1952.
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-3 bg-[#0E111A] border border-[#1E2230] p-5 rounded-[3px]">
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[#38BDF8] flex items-center gap-2">
            <span>06.</span> Emergency Evacuation Directives &amp; Limitation of Liability
          </h2>
          <p className="text-xs leading-relaxed text-[#B0B7C6]">
            During spontaneous combustion emergencies, carbon monoxide surges (CO &gt;= 50 PPM), or catastrophic ventilation
            failures, CoalGuard automatically activates colliery audible klaxons and evacuation beacons. The platform licensor
            shall not be liable for losses resulting from network communication outages caused by physical rockfall or intentional
            cable severance, provided fail-safe watchdog timer routines are executed as specified in technical manual CG-ENG-2026.
          </p>
        </section>

        {/* Bottom Back Button */}
        <div className="pt-4 flex items-center justify-between border-t border-[#1E2230]">
          <Link
            to="/"
            className="text-xs font-mono text-[#38BDF8] hover:underline flex items-center gap-1.5"
          >
            &larr; Return to CoalGuard Portal
          </Link>
          <span className="text-[11px] font-mono text-[#8E95A5]">
            Mines Act 1952 Statutory Compliance Repository
          </span>
        </div>
      </main>
    </div>
  );
};

export default TermsPage;
