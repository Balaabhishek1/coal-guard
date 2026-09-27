import React from "react";
import { Link } from "react-router-dom";

export const PrivacyPage: React.FC = () => {
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
              to="/terms"
              className="text-xs font-mono text-[#8E95A5] hover:text-white transition-colors"
            >
              Terms of Service
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
          <div className="inline-block px-2 py-0.5 border border-[#22C55E]/40 bg-[#22C55E]/10 text-[#22C55E] font-mono text-[10px] tracking-wider uppercase">
            Workforce Telemetry &amp; Biometric Privacy Standards
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
            Underground Personnel Telemetry &amp; Data Privacy Policy
          </h1>
          <p className="text-xs font-mono text-[#8E95A5]">
            Revision: 2026.3 | Classification: Restricted Colliery Safety Record | ISO 27001 &amp; DPDP Act 2023 Aligned
          </p>
        </div>

        {/* Section 1 */}
        <section className="space-y-3 bg-[#0E111A] border border-[#1E2230] p-5 rounded-[3px]">
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[#22C55E] flex items-center gap-2">
            <span>01.</span> Scope of Collected Colliery Data
          </h2>
          <p className="text-xs leading-relaxed text-[#B0B7C6]">
            CoalGuard processes telemetry strictly required for statutory mine safety, underground muster verification,
            and ventilation hazard management. Data types include:
          </p>
          <ul className="text-xs space-y-1.5 text-[#8E95A5] pl-4 list-disc marker:text-[#38BDF8]">
            <li>Underground Personnel RFID &amp; Transponder Beacon IDs (Inbye / Outbye shaft movements)</li>
            <li>Vocational Training Certificate (VTC) and Periodic Medical Examination (PME) credentials</li>
            <li>Optical PPE compliance arbitration snapshots captured at pithead access turnstiles</li>
            <li>Continuous atmospheric sensor readings (CH4, CO, O2, Air Velocity, Strata Convergence)</li>
            <li>Statutory shift supervisor Form IV shift reports and signed digital declarations</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="space-y-3 bg-[#0E111A] border border-[#1E2230] p-5 rounded-[3px]">
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[#22C55E] flex items-center gap-2">
            <span>02.</span> Worker Biometric Hash Security
          </h2>
          <p className="text-xs leading-relaxed text-[#B0B7C6]">
            Raw biometric identifiers (such as fingerprints or facial embeddings) are never stored in plaintext.
            All biometric verification templates are salted and transformed using one-way cryptographic hashing
            (SHA-256 with Argon2id) inside local colliery hardware security modules (HSM). Reconstructed biometric images
            cannot be derived from the stored tokens under any operating condition.
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-3 bg-[#0E111A] border border-[#1E2230] p-5 rounded-[3px]">
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[#22C55E] flex items-center gap-2">
            <span>03.</span> Real-Time Spatial Tracking Limitations
          </h2>
          <p className="text-xs leading-relaxed text-[#B0B7C6]">
            Underground spatial transponder beacons operate strictly within designated mine ventilation districts and haulage
            corridors for emergency muster accountability (CMR 2017 Regulation 184). Personnel location data is processed solely
            for safety zoning, lone worker collapse detection, and explosion barrier positioning. Spatial tracking automatically
            deactivates upon passing the surface pithead collar outbye gate.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-3 bg-[#0E111A] border border-[#1E2230] p-5 rounded-[3px]">
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[#22C55E] flex items-center gap-2">
            <span>04.</span> Statutory Retention Periods (CMR 2017 Compliance)
          </h2>
          <p className="text-xs leading-relaxed text-[#B0B7C6]">
            In compliance with statutory requirements enforced by the Directorate General of Mines Safety:
          </p>
          <ul className="text-xs space-y-1.5 text-[#8E95A5] pl-4 list-disc marker:text-[#38BDF8]">
            <li>Shift muster logs and gate entry records are archived for a minimum statutory period of 3 years.</li>
            <li>Continuous environmental sensor records and trip logs are retained for 5 years in TimescaleDB partitions.</li>
            <li>Cryptographic SHA-256 audit ledger blocks are retained permanently as non-destructible historical records.</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="space-y-3 bg-[#0E111A] border border-[#1E2230] p-5 rounded-[3px]">
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[#22C55E] flex items-center gap-2">
            <span>05.</span> Zero Third-Party Commercial Exploitation
          </h2>
          <p className="text-xs leading-relaxed text-[#B0B7C6]">
            CoalGuard enforces an absolute prohibition against commercial advertising, third-party data broker transmission,
            or behavioral profiling. All colliery data is strictly confined to colliery on-premise appliances or dedicated
            encrypted sovereign cloud infrastructure authorized by the colliery operator.
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-3 bg-[#0E111A] border border-[#1E2230] p-5 rounded-[3px]">
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[#22C55E] flex items-center gap-2">
            <span>06.</span> Worker Access &amp; Rectification Rights
          </h2>
          <p className="text-xs leading-relaxed text-[#B0B7C6]">
            Under the Digital Personal Data Protection Act 2023, colliery employees and contractor personnel have the right to
            inspect their digitized VTC training status, PME validity records, and recorded PPE compliance ratings via the
            Colliery Safety Officer or mobile shift terminal. Rectification requests regarding incorrect credential data must be
            processed within 48 hours of formal notice.
          </p>
        </section>

        {/* Bottom Back Button */}
        <div className="pt-4 flex items-center justify-between border-t border-[#1E2230]">
          <Link
            to="/"
            className="text-xs font-mono text-[#22C55E] hover:underline flex items-center gap-1.5"
          >
            &larr; Return to CoalGuard Portal
          </Link>
          <span className="text-[11px] font-mono text-[#8E95A5]">
            DGMS Statutory Safety Records Administration
          </span>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPage;
