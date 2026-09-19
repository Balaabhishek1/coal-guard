import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileDown,
  FileText,
  Fingerprint,
  HardHat,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Map,
  Network,
  RefreshCw,
  ServerCrash,
  ShieldCheck,
  Ticket,
  Users,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { formatStatutoryDateTime } from "@/lib/utils";
import logoSvg from "@/assets/logo.svg";
import type { UserRole } from "@/types/auth";

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles: UserRole[];
  badgeText?: string;
}

const NAV_ITEMS: NavItem[] = [
  // Safety Officer & Pithead Operator
  {
    name: "Pithead Gate HUD",
    path: "/gate-hud",
    icon: ShieldCheck,
    allowedRoles: [
      "SAFETY_OFFICER",
      "GATE_OPERATOR",
      "COLLIERY_MANAGER",
      "MANAGER",
      "OVERMAN",
      "ADMIN",
    ],
    badgeText: "LIVE",
  },
  {
    name: "Active Incident Log",
    path: "/incident-log",
    icon: AlertTriangle,
    allowedRoles: ["SAFETY_OFFICER", "GATE_OPERATOR", "ADMIN"],
  },
  {
    name: "Hardware Diagnostics",
    path: "/hardware-matrix",
    icon: ServerCrash,
    allowedRoles: ["SAFETY_OFFICER", "COLLIERY_MANAGER", "MANAGER", "ADMIN"],
  },
  {
    name: "Shift Inbye/Outbye Muster",
    path: "/muster-roll",
    icon: Users,
    allowedRoles: ["SAFETY_OFFICER", "COLLIERY_MANAGER", "MANAGER", "ADMIN"],
  },

  // Colliery / Mine Manager
  {
    name: "Colliery Overview",
    path: "/manager-dashboard",
    icon: LayoutDashboard,
    allowedRoles: ["COLLIERY_MANAGER", "MANAGER", "ADMIN"],
  },
  {
    name: "SLA Remediation Board",
    path: "/remediation-board",
    icon: ListChecks,
    allowedRoles: ["COLLIERY_MANAGER", "MANAGER", "ADMIN"],
  },
  {
    name: "Spatial Mine Twin",
    path: "/gis-twin",
    icon: Map,
    allowedRoles: ["COLLIERY_MANAGER", "MANAGER", "DGMS_INSPECTOR", "ADMIN"],
  },
  {
    name: "Workforce & VTC",
    path: "/workforce-compliance",
    icon: BadgeCheck,
    allowedRoles: ["COLLIERY_MANAGER", "MANAGER", "ADMIN"],
  },
  {
    name: "Atmospheric Telemetry",
    path: "/environmental-trends",
    icon: Activity,
    allowedRoles: [
      "SAFETY_OFFICER",
      "COLLIERY_MANAGER",
      "MANAGER",
      "DGMS_INSPECTOR",
      "OVERMAN",
      "ADMIN",
    ],
  },
  {
    name: "DGMS Statutory Reports",
    path: "/statutory-reports",
    icon: FileText,
    allowedRoles: ["COLLIERY_MANAGER", "MANAGER", "DGMS_INSPECTOR", "ADMIN"],
  },

  // Field Inspector & Overman
  {
    name: "Mobile Sync Queue",
    path: "/field-queue",
    icon: RefreshCw,
    allowedRoles: ["OVERMAN", "MINING_SIRDAR", "ADMIN"],
  },
  {
    name: "District Hazards",
    path: "/district-remediation",
    icon: ClipboardList,
    allowedRoles: ["OVERMAN", "MINING_SIRDAR", "ADMIN"],
  },
  {
    name: "Form IV Shift Diary",
    path: "/shift-diary",
    icon: BookOpen,
    allowedRoles: ["OVERMAN", "MINING_SIRDAR", "ADMIN"],
  },

  // Corporate HQ & DGMS Regulator
  {
    name: "Apex Risk Heatmap",
    path: "/apex-overview",
    icon: Network,
    allowedRoles: ["CORPORATE_HQ", "DGMS_INSPECTOR", "ADMIN"],
  },
  {
    name: "Cryptographic Audit Ledger",
    path: "/audit-ledger",
    icon: Fingerprint,
    allowedRoles: ["CORPORATE_HQ", "DGMS_INSPECTOR", "ADMIN"],
  },
  {
    name: "Violation Analytics",
    path: "/regulatory-violations",
    icon: BarChart3,
    allowedRoles: ["CORPORATE_HQ", "DGMS_INSPECTOR", "ADMIN"],
  },
  {
    name: "Statutory Audit Center",
    path: "/audit-exporter",
    icon: FileDown,
    allowedRoles: ["CORPORATE_HQ", "DGMS_INSPECTOR", "ADMIN"],
  },

  // Contractor Supervisor
  {
    name: "Crew Safety Compliance",
    path: "/contractor-workforce",
    icon: HardHat,
    allowedRoles: ["CONTRACTOR_SUPERVISOR", "ADMIN"],
  },
  {
    name: "Safety Notices",
    path: "/contractor-tickets",
    icon: Ticket,
    allowedRoles: ["CONTRACTOR_SUPERVISOR", "ADMIN"],
  },
];

export const MainLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, hasRole } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  // Filter navigation items by active user role permissions
  const authorizedNavItems = NAV_ITEMS.filter((item) =>
    hasRole(item.allowedRoles)
  );

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col">
      {/* Topbar */}
      <header className="h-14 bg-surface-container-lowest border-b border-outline-variant/40 flex items-center justify-between px-space-md shrink-0 z-40">
        <div className="flex items-center gap-space-md">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-surface-container p-1 border border-outline-variant/40 flex items-center justify-center">
              <img
                src={logoSvg}
                alt="CoalGuard Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-headline-sm tracking-tight text-on-surface leading-tight">
                CoalGuard C2
              </span>
              <span className="font-telemetry-micro text-telemetry-micro text-on-surface-variant uppercase tracking-wider">
                MINE RESILIENCE ENGINE
              </span>
            </div>
          </Link>
        </div>

        {/* Live Operational Status & Timestamp */}
        <div className="hidden md:flex items-center gap-space-lg font-telemetry-sm text-telemetry-sm">
          <div className="flex items-center gap-2 px-space-sm py-1 bg-surface-container-low rounded border border-outline-variant/30">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-on-surface-variant font-telemetry-micro uppercase">
              NODE: BCCL-09 // ONLINE
            </span>
          </div>

          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="text-outline uppercase text-[10px]">IST:</span>
            <span className="text-on-surface font-mono">
              {formatStatutoryDateTime(currentTime)}
            </span>
          </div>
        </div>

        {/* User Badge & Actions */}
        <div className="flex items-center gap-space-md">
          {user && (
            <div className="flex items-center gap-2 px-2.5 py-1 bg-surface-container rounded border border-outline-variant/30">
              <div className="w-6 h-6 rounded bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                {user.full_name?.charAt(0) || "U"}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-label-sm font-semibold text-on-surface truncate max-w-[140px]">
                  {user.full_name}
                </span>
                <span className="text-[10px] font-telemetry uppercase text-primary truncate max-w-[140px]">
                  {user.role}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            title="Sign Out of Session"
            className="p-1.5 rounded text-on-surface-variant hover:text-rose-400 hover:bg-surface-container transition-colors border border-transparent hover:border-outline-variant/40"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Body: Sidebar + Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Collapsible Sidebar */}
        <aside
          className={`${
            collapsed ? "w-16" : "w-64"
          } bg-surface-container-lowest border-r border-outline-variant/40 flex flex-col justify-between transition-all duration-200 shrink-0 select-none`}
        >
          <div className="flex-1 overflow-y-auto py-space-sm space-y-1 px-2">
            <div className="px-2 pb-2 text-[10px] font-telemetry uppercase tracking-wider text-outline flex items-center justify-between">
              {!collapsed && <span>STATUTORY WORKSPACES</span>}
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface ml-auto"
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? (
                  <ChevronRight className="w-3.5 h-3.5" />
                ) : (
                  <ChevronLeft className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Navigation items list */}
            {authorizedNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={collapsed ? item.name : undefined}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded text-body-sm transition-all border ${
                    isActive
                      ? "bg-primary-container/15 border-primary-container/40 text-primary font-medium"
                      : "border-transparent text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? "text-primary" : "text-on-surface-variant"
                    }`}
                  />
                  {!collapsed && (
                    <span className="truncate flex-1">{item.name}</span>
                  )}
                  {!collapsed && item.badgeText && (
                    <span className="text-[9px] font-telemetry px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 uppercase font-semibold">
                      {item.badgeText}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Sidebar Footer Indicator */}
          {!collapsed && (
            <div className="p-space-sm bg-surface-container-low border-t border-outline-variant/30 text-[11px] font-telemetry text-on-surface-variant space-y-1">
              <div className="flex items-center justify-between text-outline text-[10px]">
                <span>CMR-2017 REGULATION</span>
                <span className="text-emerald-400 font-semibold">ENFORCED</span>
              </div>
              <div className="text-[10px] text-outline break-all">
                SESSION: <span className="text-on-surface">0xFD88...2A7C</span>
              </div>
            </div>
          )}
        </aside>

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto bg-background p-space-lg">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
