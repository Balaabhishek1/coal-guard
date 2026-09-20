import React, { useState } from "react";
import { LoginForm } from "../components/login-form";
import { ThemeToggle } from "@/components/theme-toggle";

export const LoginPage: React.FC = () => {
  const [activeRoleId, setActiveRoleId] = useState("safety_officer");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0c0d12] text-slate-900 dark:text-[#f3f4f6] flex flex-col justify-between antialiased transition-colors duration-200 selection:bg-amber-400/20">
      {/* Top Header Bar */}
      <header className="w-full bg-white dark:bg-[#101218] border-b border-slate-200 dark:border-white/[0.06] py-3 px-6 z-50 transition-colors">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Brand with CoalGuard Logo from Tab Title Bar */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#161822] border border-slate-200 dark:border-white/[0.08] p-1 flex items-center justify-center shadow-sm">
              <img
                src="/logo.svg"
                alt="CoalGuard Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white leading-tight">
                CoalGuard
              </span>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                Smart Coal Mining Governance Platform
              </span>
            </div>
          </div>

          {/* Right Status Pill & Theme Switcher */}
          <div className="flex items-center gap-3 text-xs">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-[#161822] border border-slate-200 dark:border-white/[0.06] text-slate-700 dark:text-zinc-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Operations Gateway Active</span>
            </div>
            <span className="text-slate-400 dark:text-zinc-500 font-mono text-[11px] hidden md:inline">
              DGMS CMR-2017
            </span>

            {/* Dark / Light Mode Working Toggle */}
            <ThemeToggle variant="pill" />
          </div>
        </div>
      </header>

      {/* Centered Main Login Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-xl mx-auto">
          <div className="rounded-3xl bg-white dark:bg-[#141620] border border-slate-200 dark:border-white/[0.08] shadow-xl dark:shadow-[0_16px_50px_rgba(0,0,0,0.8)] p-6 sm:p-8 transition-colors">
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Operations Sign In
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
                Select your operational role preset or enter credentials to access your dispatch and safety console.
              </p>
            </div>

            {/* Login Form Component */}
            <LoginForm
              activeRoleId={activeRoleId}
              onRoleChange={setActiveRoleId}
            />
          </div>

          {/* Footer Note */}
          <div className="text-center mt-6 text-xs text-slate-500 dark:text-zinc-500 space-y-1">
            <p>Statutory colliery compliance enforced under DGMS CMR-2017 Regulations.</p>
            <p className="text-[11px] text-slate-400 dark:text-zinc-600 font-mono">
              SHA-256 Audit Anchor Active • FIPS 140-3 Hardware Token Ready
            </p>
          </div>
        </div>
      </main>

      {/* Subtle Bottom Bar */}
      <footer className="py-3 px-6 text-center text-[11px] text-slate-400 dark:text-zinc-600 border-t border-slate-200 dark:border-white/[0.04]">
        <span>CoalGuard Platform © 2026 CoalGuard Governance. All rights reserved.</span>
      </footer>
    </div>
  );
};

export default LoginPage;
