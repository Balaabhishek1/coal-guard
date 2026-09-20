import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ChevronDown,
  Compass,
  Crosshair,
  ExternalLink,
  Fuel,
  Minus,
  Plus,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Truck,
  Wind,
  X,
} from "lucide-react";
import { useThemeStore } from "@/store/theme-store";

interface VehicleAsset {
  id: string;
  name: string;
  code: string;
  type: string;
  status: "Active" | "Idle" | "Maintenance" | "Offline";
  driver: string;
  from: string;
  to: string;
  progressPercent: number;
  totalDistance: string;
  eta: string;
  distanceRemaining: string;
  speedMph: number;
  fuelGal: string;
  fuelPercent: number;
  alert?: string;
  coords: { x: number; y: number };
}

const VEHICLES: VehicleAsset[] = [
  {
    id: "v-1",
    name: "Volvo FH16",
    code: "TK-4821-HX",
    type: "Heavy Coal Hauler",
    status: "Active",
    driver: "Lina Nguyen (Operator)",
    from: "Dallas, TX",
    to: "Memphis, TN",
    progressPercent: 72,
    totalDistance: "282.7 mi",
    eta: "~1h 8m",
    distanceRemaining: "72.8 mi distance remaining",
    speedMph: 55,
    fuelGal: "1.17 gal",
    fuelPercent: 78,
    alert: "Required Break: 24 min (After 4h of driving)",
    coords: { x: 52, y: 72 },
  },
  {
    id: "v-2",
    name: "Scania G440",
    code: "TK-1092-B",
    type: "Pit Hauler Shuttle",
    status: "Active",
    driver: "Manoj Verma",
    from: "Pithead 04",
    to: "Coal Washery 02",
    progressPercent: 45,
    totalDistance: "14.2 km",
    eta: "~25m",
    distanceRemaining: "7.8 km remaining",
    speedMph: 38,
    fuelGal: "4.20 gal",
    fuelPercent: 88,
    coords: { x: 32, y: 78 },
  },
  {
    id: "v-3",
    name: "Komatsu HD785",
    code: "TK-3301-A",
    type: "Surface Dumper",
    status: "Idle",
    driver: "Rajesh Murmu",
    from: "Stockpile East",
    to: "Rail Loading Silo",
    progressPercent: 95,
    totalDistance: "6.5 km",
    eta: "~4m",
    distanceRemaining: "0.3 km remaining",
    speedMph: 0,
    fuelGal: "2.80 gal",
    fuelPercent: 62,
    coords: { x: 65, y: 42 },
  },
  {
    id: "v-4",
    name: "Caterpillar 777G",
    code: "TK-7719-M",
    type: "Strata Support Rig",
    status: "Maintenance",
    driver: "Technician Bay",
    from: "Workshop 3",
    to: "Standby",
    progressPercent: 0,
    totalDistance: "0.0 km",
    eta: "Service",
    distanceRemaining: "Bay 4 Inspection",
    speedMph: 0,
    fuelGal: "0.90 gal",
    fuelPercent: 40,
    alert: "Brake Lining & Hydraulic Pressure Calibration",
    coords: { x: 78, y: 68 },
  },
];

export const DashboardPage: React.FC = () => {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [showRoutes, setShowRoutes] = useState<boolean>(true);
  const [showAlerts, setShowAlerts] = useState<boolean>(true);
  const [selectedAsset, setSelectedAsset] = useState<VehicleAsset>(VEHICLES[0]);
  const [cardMinimized, setCardMinimized] = useState<boolean>(false);
  const [mapZoom, setMapZoom] = useState<number>(100);

  const filteredAssets = VEHICLES.filter((v) => {
    if (activeFilter === "All") return true;
    return v.status === activeFilter;
  });

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto">
      {/* Operations Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Operations Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Tuesday, April 9, 2024 • Real-time overview
          </p>
        </div>

        {/* Time Filter Pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button className="h-8 px-3.5 rounded-full bg-white dark:bg-[#161822] hover:bg-slate-100 dark:hover:bg-[#1f2230] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-700 dark:text-zinc-200 font-medium flex items-center gap-1.5 transition-colors shadow-sm dark:shadow-none">
            <span>Last 7 Days</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-400" />
          </button>
        </div>
      </div>

      {/* Filter Tabs & Toggle Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {[
            { label: "All", count: 12 },
            { label: "Active", count: 8 },
            { label: "Idle", count: 2 },
            { label: "Maintenance", count: 1 },
            { label: "Offline", count: 1 },
          ].map((tab) => {
            const isActive = activeFilter === tab.label;
            return (
              <button
                key={tab.label}
                onClick={() => setActiveFilter(tab.label)}
                className={`h-7 px-3.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 ${
                  isActive
                    ? "bg-slate-900 text-white dark:bg-white dark:text-black shadow-sm font-semibold"
                    : "bg-white dark:bg-[#161822] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1e212f] border border-slate-200 dark:border-white/[0.06]"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[11px] ${
                    isActive ? "text-slate-300 dark:text-zinc-600" : "text-slate-400 dark:text-zinc-500"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}

          <button
            title="Custom Filter"
            className="w-7 h-7 rounded-full bg-white dark:bg-[#161822] hover:bg-slate-100 dark:hover:bg-[#1e212f] border border-slate-200 dark:border-white/[0.06] flex items-center justify-center text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0 ml-0.5"
          >
            <SlidersHorizontal className="w-3 h-3" />
          </button>
        </div>

        {/* Right Toggle Switches */}
        <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-zinc-300 select-none self-end md:self-auto">
          {/* Show Routes Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-slate-500 dark:text-zinc-400">Show routes</span>
            <div
              onClick={() => setShowRoutes(!showRoutes)}
              className={`w-9 h-5 rounded-full transition-colors relative flex items-center p-0.5 ${
                showRoutes ? "bg-emerald-500" : "bg-slate-300 dark:bg-[#252938]"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${
                  showRoutes ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </div>
          </label>

          {/* Show Alerts Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-slate-500 dark:text-zinc-400">Show alerts</span>
            <div
              onClick={() => setShowAlerts(!showAlerts)}
              className={`w-9 h-5 rounded-full transition-colors relative flex items-center p-0.5 ${
                showAlerts ? "bg-emerald-500" : "bg-slate-300 dark:bg-[#252938]"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${
                  showAlerts ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </div>
          </label>
        </div>
      </div>

      {/* Main Spatial Operations Canvas with Floating Asset Card & Compass */}
      <div className="relative w-full h-[620px] lg:h-[680px] rounded-3xl bg-slate-100 dark:bg-[#0f1118] border border-slate-200 dark:border-white/[0.08] overflow-hidden shadow-xl dark:shadow-2xl transition-colors">
        {/* Stylized Topological Vector Canvas */}
        <div
          className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing transition-transform duration-300"
          style={{ transform: `scale(${mapZoom / 100})` }}
        >
          {/* Base vector map SVG */}
          <svg className="w-full h-full opacity-80 dark:opacity-70" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="mapGrid"
                width="80"
                height="80"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 80 0 L 0 0 0 80"
                  fill="none"
                  stroke={isDark ? "#1c202e" : "#e2e8f0"}
                  strokeWidth="0.8"
                />
              </pattern>
              {/* Route glowing gradient */}
              <linearGradient id="routeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#eab308" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="1" />
              </linearGradient>
            </defs>

            {/* Subtle background grid */}
            <rect width="100%" height="100%" fill={isDark ? "#0f1118" : "#f8fafc"} />
            <rect width="100%" height="100%" fill="url(#mapGrid)" />

            {/* Stylized roads / mining sectors & tracks */}
            <g stroke={isDark ? "#1e2333" : "#cbd5e1"} strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M 50 180 Q 220 220, 380 140 T 700 240 T 1100 180 T 1500 280" />
              <path d="M 120 40 L 260 320 L 480 400 L 780 340 L 980 520 L 1400 480" />
              <path d="M 280 580 L 420 440 L 640 480 L 920 380 L 1200 420 L 1480 620" />
              <path d="M 460 120 L 520 380 L 740 540 L 860 620 L 1150 560" />
              <path d="M 780 80 Q 940 180, 1020 380 T 1320 620" />
              <path d="M 180 500 Q 380 620, 680 540 T 1120 620" />
            </g>

            {/* Minor roads / seam galleries */}
            <g stroke={isDark ? "#171a26" : "#e2e8f0"} strokeWidth="2.5" fill="none" strokeLinecap="round">
              <path d="M 80 120 L 240 160 L 320 280" />
              <path d="M 380 260 L 520 240 L 600 360" />
              <path d="M 640 180 L 780 200 L 880 140" />
              <path d="M 920 240 L 1080 300 L 1220 220" />
              <path d="M 500 480 L 640 560 L 780 500" />
              <path d="M 880 440 L 1020 480 L 1160 380" />
            </g>

            {/* Active Highlighted Route */}
            {showRoutes && (
              <g>
                <path
                  d="M 260 320 L 420 440 L 580 490 L 740 530"
                  stroke="url(#routeGlow)"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  strokeDasharray="8 4"
                />
                {/* Route radar ripple at destination */}
                <circle cx="740" cy="530" r="28" fill="#eab308" fillOpacity="0.15" className="animate-ping" />
                <circle cx="740" cy="530" r="16" fill="#eab308" fillOpacity="0.25" />
                <circle cx="740" cy="530" r="5" fill="#fef08a" />
              </g>
            )}

            {/* Vehicle positions on the map filtered by current selection */}
            <g>
              {filteredAssets.map((asset, idx) => {
                const isSelected = selectedAsset.id === asset.id;
                const posX = asset.coords.x * 14;
                const posY = asset.coords.y * 7;
                return (
                  <g
                    key={asset.id}
                    transform={`translate(${posX}, ${posY}) rotate(${idx * 25 - 15})`}
                    onClick={() => {
                      setSelectedAsset(asset);
                      setCardMinimized(false);
                    }}
                    className="cursor-pointer"
                  >
                    <rect
                      x="-10"
                      y="-18"
                      width="20"
                      height="36"
                      rx="4"
                      fill={isSelected ? (isDark ? "#ffffff" : "#0f172a") : (isDark ? "#94a3b8" : "#64748b")}
                      stroke={isSelected ? "#eab308" : (isDark ? "#334155" : "#94a3b8")}
                      strokeWidth={isSelected ? "2" : "1.5"}
                      filter={isSelected ? "drop-shadow(0 2px 8px rgba(234,179,8,0.5))" : undefined}
                    />
                    <rect x="-7" y="-14" width="14" height="8" rx="2" fill={isDark ? "#1e2230" : "#ffffff"} />
                    {isSelected && <circle cx="0" cy="0" r="3" fill="#eab308" />}
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* 3D-Styled Realistic Compass Rose Widget (Top-Right Corner) */}
        <div className="absolute top-4 right-4 z-20 pointer-events-none select-none">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white/90 dark:bg-[#12141c] border-2 border-slate-300 dark:border-[#2b3042] shadow-lg dark:shadow-[0_8px_30px_rgb(0,0,0,0.7)] flex items-center justify-center relative backdrop-blur-md transition-colors">
            <div className="absolute inset-1 rounded-full border border-slate-200 dark:border-white/[0.08]" />
            <div className="absolute inset-2.5 rounded-full bg-slate-50 dark:bg-[#0d0f15] border border-slate-200 dark:border-white/[0.05] flex items-center justify-center">
              <span className="absolute top-1 text-[9px] font-mono text-slate-600 dark:text-zinc-400 font-semibold">N</span>
              <span className="absolute bottom-1 text-[9px] font-mono text-slate-400 dark:text-zinc-500 font-semibold">S</span>
              <span className="absolute left-1.5 text-[9px] font-mono text-slate-400 dark:text-zinc-500 font-semibold">W</span>
              <span className="absolute right-1.5 text-[9px] font-mono text-slate-400 dark:text-zinc-500 font-semibold">E</span>

              {/* Red / White Directional Needle */}
              <div className="w-full h-full relative flex items-center justify-center -rotate-45">
                <div className="absolute top-3 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[20px] border-b-rose-500" />
                <div className="absolute bottom-3 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[20px] border-t-slate-400 dark:border-t-zinc-300" />
                <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-zinc-900 border-2 border-slate-400 dark:border-zinc-400 z-10 shadow-sm" />
              </div>

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-slate-900 dark:text-white font-bold text-xs tracking-wider drop-shadow-sm">
                  NW
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Asset Inspection Card */}
        {!cardMinimized ? (
          <div className="absolute top-4 left-4 z-20 w-full max-w-[370px] sm:max-w-[420px] rounded-2xl bg-white/95 dark:bg-[#141620]/95 backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] shadow-xl dark:shadow-[0_12px_40px_rgba(0,0,0,0.8)] p-4 sm:p-5 transition-all text-slate-900 dark:text-white">
            {/* Card Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#1d202e] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-slate-900 dark:text-white">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
                      {selectedAsset.code}
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {selectedAsset.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                    {selectedAsset.name} · {selectedAsset.type}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setCardMinimized(true)}
                title="Minimize Card"
                className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/10 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Route & Destination Progress */}
            <div className="py-3 border-b border-slate-200 dark:border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-800 dark:text-zinc-200">
                  {selectedAsset.from} ➔ {selectedAsset.to}
                </span>
                <span className="font-mono text-slate-500 dark:text-zinc-400 text-[11px]">
                  {selectedAsset.totalDistance} <strong className="text-slate-900 dark:text-white font-semibold">{selectedAsset.progressPercent}%</strong>
                </span>
              </div>

              {/* Route Progress Bar */}
              <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-[#202434] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500"
                  style={{ width: `${selectedAsset.progressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 pt-0.5">
                <span>Est. Time to Arrival (ETA): <strong className="text-slate-900 dark:text-white font-medium">{selectedAsset.eta}</strong></span>
                <span className="truncate max-w-[170px]">{selectedAsset.distanceRemaining}</span>
              </div>
            </div>

            {/* Dual Dial Gauges (Speedometer & Fuel Level) */}
            <div className="py-3.5 grid grid-cols-2 gap-3">
              {/* Left Dial: Speedometer */}
              <div className="rounded-xl bg-slate-50 dark:bg-[#191c28] border border-slate-200 dark:border-white/[0.06] p-3 flex flex-col items-center relative overflow-hidden">
                <div className="w-full flex items-center justify-between text-[10px] text-slate-500 dark:text-zinc-400 uppercase tracking-wider font-semibold mb-1">
                  <span>Speed</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono">
                    LIVE
                  </span>
                </div>

                <div className="relative w-28 h-16 flex items-center justify-center mt-1">
                  <svg className="w-28 h-20 -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke={isDark ? "#282d3e" : "#e2e8f0"}
                      strokeWidth="7"
                      strokeDasharray="188"
                      strokeDashoffset="62"
                      strokeLinecap="round"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="7"
                      strokeDasharray="188"
                      strokeDashoffset={188 - (selectedAsset.speedMph / 100) * 126}
                      strokeLinecap="round"
                    />
                  </svg>

                  <div
                    className="absolute bottom-1 w-1.5 h-10 bg-slate-900 dark:bg-white rounded-full origin-bottom transition-transform duration-500 shadow-sm"
                    style={{
                      transform: `rotate(${((selectedAsset.speedMph / 100) * 180) - 90}deg)`,
                    }}
                  />
                  <div className="absolute bottom-0 w-3.5 h-3.5 rounded-full bg-slate-400 dark:bg-zinc-300 border-2 border-white dark:border-zinc-900" />
                </div>

                <div className="text-center mt-1">
                  <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    {selectedAsset.speedMph}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 ml-1 font-medium">mph</span>
                </div>
              </div>

              {/* Right Dial: Fuel Level */}
              <div className="rounded-xl bg-slate-50 dark:bg-[#191c28] border border-slate-200 dark:border-white/[0.06] p-3 flex flex-col items-center relative overflow-hidden">
                <div className="w-full flex items-center justify-between text-[10px] text-slate-500 dark:text-zinc-400 uppercase tracking-wider font-semibold mb-1">
                  <span>Fuel level</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-mono">
                    88%
                  </span>
                </div>

                <div className="relative w-20 h-20 rounded-full bg-slate-100 dark:bg-[#12141c] border-2 border-slate-300 dark:border-[#2b3042] flex flex-col items-center justify-center mt-0.5 overflow-hidden shadow-inner">
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-amber-600 to-amber-400/80 transition-all duration-500"
                    style={{ height: `${selectedAsset.fuelPercent}%` }}
                  />
                  <div className="absolute inset-0 bg-slate-900/10 dark:bg-[#12141c]/40 backdrop-blur-[1px]" />

                  <Fuel className="w-3.5 h-3.5 text-slate-700 dark:text-zinc-300 z-10 mb-0.5" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white z-10 leading-none">
                    {selectedAsset.fuelGal}
                  </span>
                  <span className="text-[9px] font-mono text-slate-600 dark:text-zinc-300 z-10">
                    ± 2.5%
                  </span>
                </div>

                <span className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1 font-mono">
                  Diesel Capacity
                </span>
              </div>
            </div>

            {/* Alert Banner */}
            {showAlerts && selectedAsset.alert && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-amber-900 dark:text-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs leading-snug">
                  <span className="font-semibold text-amber-800 dark:text-amber-300 block">
                    {selectedAsset.alert}
                  </span>
                  <span className="text-[11px] text-amber-700/80 dark:text-amber-200/70">
                    Mandatory statutory rest cycle under transport compliance.
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setCardMinimized(false)}
            className="absolute top-4 left-4 z-20 h-10 px-4 rounded-xl bg-white dark:bg-[#141620] border border-slate-300 dark:border-white/[0.1] text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-2 shadow-xl hover:bg-slate-100 dark:hover:bg-[#1d202e] transition-colors"
          >
            <Truck className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span>Show Inspection Card ({selectedAsset.code})</span>
          </button>
        )}

        {/* Floating Map Action Tools (Bottom Right) */}
        <div className="absolute bottom-5 right-5 z-20 flex flex-col items-center gap-1.5 select-none">
          <div className="flex flex-col bg-white/90 dark:bg-[#141620]/90 backdrop-blur-md rounded-xl border border-slate-200 dark:border-white/[0.08] shadow-md p-1">
            <button
              onClick={() => setMapZoom(Math.min(mapZoom + 15, 160))}
              title="Zoom In"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMapZoom(Math.max(mapZoom - 15, 70))}
              title="Zoom Out"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col bg-white/90 dark:bg-[#141620]/90 backdrop-blur-md rounded-xl border border-slate-200 dark:border-white/[0.08] shadow-md p-1">
            <button
              onClick={() => setMapZoom(100)}
              title="Reset View"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              title="Focus Active Asset"
              onClick={() => setSelectedAsset(VEHICLES[0])}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
            >
              <Crosshair className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Map Bottom Hint & Timestamp */}
        <div className="absolute bottom-4 left-6 z-20 flex items-center gap-4 text-[11px] text-slate-500 dark:text-zinc-500 font-medium select-none">
          <span>Space + Drag to pan • Scroll to zoom</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">Most updated: every 5 minutes</span>
        </div>
      </div>

      {/* Quick Statutory Workspaces Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
        <Link
          to="/gate-hud"
          className="p-3.5 rounded-2xl bg-white dark:bg-[#141620] hover:bg-slate-50 dark:hover:bg-[#1a1e2c] border border-slate-200 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.12] transition-all flex items-center justify-between group shadow-sm dark:shadow-none"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-900 dark:text-white block group-hover:text-amber-500 transition-colors">
                Pithead Gate HUD
              </span>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                Live Turnstiles &amp; RFID
              </span>
            </div>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 group-hover:text-slate-600 dark:group-hover:text-zinc-300" />
        </Link>

        <Link
          to="/governance/remediation"
          className="p-3.5 rounded-2xl bg-white dark:bg-[#141620] hover:bg-slate-50 dark:hover:bg-[#1a1e2c] border border-slate-200 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.12] transition-all flex items-center justify-between group shadow-sm dark:shadow-none"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-900 dark:text-white block group-hover:text-amber-500 transition-colors">
                Remediation Board
              </span>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                CMR 2017 SLA Kanban
              </span>
            </div>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 group-hover:text-slate-600 dark:group-hover:text-zinc-300" />
        </Link>

        <Link
          to="/environmental-trends"
          className="p-3.5 rounded-2xl bg-white dark:bg-[#141620] hover:bg-slate-50 dark:hover:bg-[#1a1e2c] border border-slate-200 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.12] transition-all flex items-center justify-between group shadow-sm dark:shadow-none"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Wind className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-900 dark:text-white block group-hover:text-amber-500 transition-colors">
                Gas Telemetry
              </span>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                Atmospheric Trends
              </span>
            </div>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 group-hover:text-slate-600 dark:group-hover:text-zinc-300" />
        </Link>

        <Link
          to="/governance/audit-ledger"
          className="p-3.5 rounded-2xl bg-white dark:bg-[#141620] hover:bg-slate-50 dark:hover:bg-[#1a1e2c] border border-slate-200 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.12] transition-all flex items-center justify-between group shadow-sm dark:shadow-none"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-900 dark:text-white block group-hover:text-amber-500 transition-colors">
                Audit Ledger
              </span>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                SHA-256 Chain Verify
              </span>
            </div>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 group-hover:text-slate-600 dark:group-hover:text-zinc-300" />
        </Link>
      </div>
    </div>
  );
};

export default DashboardPage;
