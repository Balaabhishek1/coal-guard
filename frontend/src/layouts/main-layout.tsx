import React, { useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import {
  Activity,
  Bell,
  Compass,
  FileDown,
  FileText,
  Fingerprint,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Search,
  Server,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { ThemeToggle } from "@/components/theme-toggle";
import type { UserRole } from "@/types/auth";

interface NavDockItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles?: UserRole[];
  badge?: string;
}

const DOCK_ITEMS: NavDockItem[] = [
  {
    name: "Operations Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Spatial Mine Twin",
    path: "/gis-twin",
    icon: Compass,
    allowedRoles: ["COLLIERY_MANAGER", "MANAGER", "DGMS_INSPECTOR", "ADMIN"],
  },
  {
    name: "Pithead Gate HUD",
    path: "/gate-hud",
    icon: ShieldCheck,
    badge: "LIVE",
  },
  {
    name: "SLA Remediation Board",
    path: "/governance/remediation",
    icon: ListChecks,
    allowedRoles: [
      "COLLIERY_MANAGER",
      "MANAGER",
      "OVERMAN",
      "SAFETY_OFFICER",
      "ADMIN",
    ],
  },
  {
    name: "Atmospheric Telemetry",
    path: "/environmental-trends",
    icon: Activity,
  },
  {
    name: "Hardware Matrix",
    path: "/hardware-matrix",
    icon: Server,
    allowedRoles: ["SAFETY_OFFICER", "COLLIERY_MANAGER", "MANAGER", "ADMIN"],
  },
  {
    name: "OCR Digitization Studio",
    path: "/documents/ocr",
    icon: FileText,
    allowedRoles: [
      "COLLIERY_MANAGER",
      "MANAGER",
      "OVERMAN",
      "SAFETY_OFFICER",
      "ADMIN",
    ],
  },
  {
    name: "Cryptographic Audit Ledger",
    path: "/governance/audit-ledger",
    icon: Fingerprint,
    allowedRoles: [
      "COLLIERY_MANAGER",
      "MANAGER",
      "DGMS_INSPECTOR",
      "CORPORATE_HQ",
      "ADMIN",
    ],
  },
  {
    name: "Statutory Reports",
    path: "/reports",
    icon: FileDown,
    allowedRoles: ["COLLIERY_MANAGER", "MANAGER", "DGMS_INSPECTOR", "ADMIN"],
  },
];

export const MainLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, hasRole } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const filteredDockItems = DOCK_ITEMS.filter((item) => {
    if (!item.allowedRoles) return true;
    return hasRole(item.allowedRoles);
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0c0d12] text-slate-900 dark:text-[#f3f4f6] flex flex-col antialiased transition-colors duration-200 selection:bg-amber-400/20">
      {/* Outer System Navigation Header */}
      <header className="h-14 bg-white dark:bg-[#101218] border-b border-slate-200 dark:border-white/[0.06] flex items-center justify-between px-4 sm:px-6 shrink-0 z-40 select-none transition-colors">
        {/* Left: CoalGuard Brand & Operations Summary Stat Pills */}
        <div className="flex items-center gap-3 lg:gap-4 overflow-x-auto no-scrollbar py-1">
          {/* Brand with Original CoalGuard Shield Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5 shrink-0 mr-1 group">
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#161822] border border-slate-200 dark:border-white/[0.08] p-1 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <img
                src="/logo.svg"
                alt="CoalGuard"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white leading-tight">
                CoalGuard
              </span>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400 hidden sm:inline leading-none">
                Smart Governance
              </span>
            </div>
          </Link>

          {/* Stat Summary Chips */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="h-7 px-3 rounded-full bg-slate-100 dark:bg-[#181a24] border border-slate-200 dark:border-white/[0.06] flex items-center gap-1.5 text-xs text-slate-700 dark:text-zinc-300 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Active <strong className="text-slate-900 dark:text-white font-semibold">8/10</strong></span>
            </div>

            <div className="h-7 px-3 rounded-full bg-slate-100 dark:bg-[#181a24] border border-slate-200 dark:border-white/[0.06] flex items-center gap-1.5 text-xs text-slate-700 dark:text-zinc-300 font-medium">
              <span>Drivers <strong className="text-slate-900 dark:text-white font-semibold">6/8</strong></span>
            </div>

            <div className="h-7 px-3 rounded-full bg-slate-100 dark:bg-[#181a24] border border-slate-200 dark:border-white/[0.06] flex items-center gap-1.5 text-xs text-slate-700 dark:text-zinc-300 font-medium">
              <span>Trips <strong className="text-slate-900 dark:text-white font-semibold">5</strong></span>
            </div>

            <div className="hidden md:flex h-7 px-3 rounded-full bg-slate-100 dark:bg-[#181a24] border border-slate-200 dark:border-white/[0.06] items-center gap-1.5 text-xs text-slate-700 dark:text-zinc-300 font-medium">
              <span>Avg Fuel <strong className="text-slate-900 dark:text-white font-semibold">14.2%</strong></span>
            </div>

            <div className="hidden lg:flex h-7 px-3 rounded-full bg-slate-100 dark:bg-[#181a24] border border-slate-200 dark:border-white/[0.06] items-center gap-1.5 text-xs text-slate-700 dark:text-zinc-300 font-medium">
              <span>On-time <strong className="text-slate-900 dark:text-white font-semibold">94.2%</strong></span>
            </div>
          </div>
        </div>

        {/* Right: Search, Theme Toggle, Notifications & User Profile */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Pill Search Input */}
          <div className="relative hidden md:flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vehicles, trips or more..."
              className="w-52 lg:w-64 h-8 pl-8 pr-9 rounded-full bg-slate-100 dark:bg-[#181a24] border border-slate-200 dark:border-white/[0.06] text-xs text-slate-900 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-slate-400 dark:focus:border-white/20 transition-colors"
            />
            <span className="absolute right-2.5 text-[10px] text-slate-400 dark:text-zinc-500 font-mono bg-white dark:bg-white/[0.04] px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/[0.06] pointer-events-none">
              ⌘K
            </span>
          </div>

          {/* Working Dark / Light Mode Toggle Button */}
          <ThemeToggle variant="icon" />

          {/* Notifications Bell */}
          <button
            title="Notifications"
            className="relative w-8 h-8 rounded-full bg-slate-100 dark:bg-[#181a24] hover:bg-slate-200 dark:hover:bg-[#202332] border border-slate-200 dark:border-white/[0.06] flex items-center justify-center text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <Bell className="w-3.5 h-3.5" />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-amber-500 text-black font-bold text-[9px] flex items-center justify-center">
              1
            </span>
          </button>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full bg-slate-100 dark:bg-[#181a24] border border-slate-200 dark:border-white/[0.06]">
            <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 font-semibold text-xs flex items-center justify-center">
              {user?.full_name?.charAt(0) || "U"}
            </div>
            <div className="flex flex-col text-left leading-tight hidden sm:flex">
              <span className="text-xs font-medium text-slate-900 dark:text-white truncate max-w-[120px]">
                {user?.full_name || "Lina Nguyen"}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400 capitalize truncate max-w-[120px]">
                {user?.role ? String(user.role).toLowerCase().replace(/_/g, " ") : "Manager"}
              </span>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="text-slate-400 dark:text-zinc-500 hover:text-rose-500 dark:hover:text-rose-400 ml-1 transition-colors p-0.5"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Shell: Left Dock + Content Viewport */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sleek Vertical Dock Sidebar */}
        <aside className="w-16 bg-white dark:bg-[#101218] border-r border-slate-200 dark:border-white/[0.06] flex flex-col items-center justify-between py-4 shrink-0 select-none z-30 transition-colors">
          {/* Navigation Icon Stack */}
          <div className="flex flex-col items-center gap-2 w-full px-2">
            {filteredDockItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.path ||
                (item.path === "/dashboard" && location.pathname === "/manager-dashboard") ||
                (item.path === "/dashboard" && location.pathname === "/");

              return (
                <div
                  key={item.path}
                  className="relative group w-full flex justify-center"
                  onMouseEnter={() => setActiveTooltip(item.path)}
                  onMouseLeave={() => setActiveTooltip(null)}
                >
                  <Link
                    to={item.path}
                    aria-label={item.name}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      isActive
                        ? "bg-slate-900 text-white dark:bg-white dark:text-black shadow-sm font-semibold"
                        : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06]"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </Link>

                  {/* Tooltip on Hover */}
                  {activeTooltip === item.path && (
                    <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-slate-900 text-white dark:bg-[#1b1e2a] dark:text-white text-xs px-3 py-1.5 rounded-lg border border-slate-700 dark:border-white/10 shadow-xl whitespace-nowrap z-50 pointer-events-none">
                      <span>{item.name}</span>
                      {item.badge && (
                        <span className="ml-1.5 text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Dock Footer: Theme Toggle, Settings & LogOut */}
          <div className="flex flex-col items-center gap-2 w-full px-2 pt-4 border-t border-slate-200 dark:border-white/[0.06]">
            <Link
              to="/diagnostics"
              title="System Settings"
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
            >
              <Settings className="w-4 h-4" />
            </Link>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 dark:text-zinc-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </aside>

        {/* Primary Page Canvas / Viewport */}
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0c0d12] p-4 sm:p-6 lg:p-7 transition-colors">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
