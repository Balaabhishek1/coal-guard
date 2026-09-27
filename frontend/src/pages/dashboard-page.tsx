import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Layers,
  RefreshCw,
  Download,
  ChevronRight,
  ChevronLeft,
  Activity,
  Crosshair,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Shield,
  Wind,
  Truck,
  Users,
  AlertTriangle,
  Server,
  FileText,
  Clock,
  ExternalLink,
  Radio,
  Compass,
} from "lucide-react";

// Asset data types
export interface CollieryAsset {
  id: string;
  code: string;
  name: string;
  category: "HAULAGE" | "PERSONNEL" | "SENSOR" | "GATEWAY";
  status: "NORMAL" | "CAUTION" | "ALARM";
  zone: string;
  seam: string;
  seamId: "SURFACE" | "SEAM_I" | "SEAM_II" | "SEAM_III" | "SEAM_IV";
  elevationMsl: number;
  coordinates: { x: number; y: number; lat: string; lon: string };
  speedKmh: number;
  payloadTons?: number;
  batteryPct: number;
  operator?: string;
  lastPingSec: number;
  telemetryNote: string;
  gasCh4Pct?: number;
  actionRoute: string;
  actionLabel: string;
}

export const COLLIERY_ASSETS: CollieryAsset[] = [
  {
    id: "AST-777D-04",
    code: "CAT-777D #04",
    name: "Caterpillar 777D Off-Highway Dumper",
    category: "HAULAGE",
    status: "NORMAL",
    zone: "West Incline Haul Road",
    seam: "Seam III Horizon",
    seamId: "SEAM_III",
    elevationMsl: -184.2,
    coordinates: { x: 380, y: 310, lat: "23° 47' 14.2\" N", lon: "86° 24' 36.1\" E" },
    speedKmh: 24,
    payloadTons: 91.4,
    batteryPct: 88,
    operator: "R. Soren (Heavy Driver Grade I)",
    lastPingSec: 1,
    telemetryNote: "In transit from Face 3 to Pithead Bunker. Payload verified by weighbridge sensor.",
    actionRoute: "/gate-hud",
    actionLabel: "Verify Weighbridge Gate Log",
  },
  {
    id: "AST-HD785-02",
    code: "KOMATSU HD785 #02",
    name: "Komatsu HD785 Mining Hauler",
    category: "HAULAGE",
    status: "NORMAL",
    zone: "Central Sump Haul Road",
    seam: "Seam III Horizon",
    seamId: "SEAM_III",
    elevationMsl: -192.5,
    coordinates: { x: 540, y: 390, lat: "23° 47' 11.8\" N", lon: "86° 24' 42.4\" E" },
    speedKmh: 18,
    payloadTons: 88.0,
    batteryPct: 76,
    operator: "M. K. Verma (Driver)",
    lastPingSec: 2,
    telemetryNote: "Ascending 1:4 incline gradient. Engine telemetry and brake temperatures normal.",
    actionRoute: "/hardware-matrix",
    actionLabel: "Inspect Diagnostic Telemetry",
  },
  {
    id: "AST-SCN-08",
    code: "SCANIA G440 #08",
    name: "Scania G440 Tipper Shuttle",
    category: "HAULAGE",
    status: "CAUTION",
    zone: "Seam IV Development Drift",
    seam: "Seam IV Basal",
    seamId: "SEAM_IV",
    elevationMsl: -245.0,
    coordinates: { x: 710, y: 440, lat: "23° 47' 08.5\" N", lon: "86° 24' 49.2\" E" },
    speedKmh: 12,
    payloadTons: 42.5,
    batteryPct: 62,
    operator: "A. P. Murmu (Operator)",
    lastPingSec: 3,
    telemetryNote: "Speed restricted to 15 km/h in development gallery under CMR Reg 171. Proximity warning flagged.",
    actionRoute: "/governance/remediation",
    actionLabel: "Raise SLA Remediation Ticket",
  },
  {
    id: "AST-SDL-01",
    code: "EIMCO SDL #01",
    name: "Side Discharge Loader Tracked",
    category: "HAULAGE",
    status: "NORMAL",
    zone: "Longwall 3 Transfer Chute",
    seam: "Seam III Horizon",
    seamId: "SEAM_III",
    elevationMsl: -184.0,
    coordinates: { x: 260, y: 220, lat: "23° 47' 18.0\" N", lon: "86° 24' 28.5\" E" },
    speedKmh: 4,
    payloadTons: 12.0,
    batteryPct: 94,
    operator: "T. C. Kisku (SDL Op)",
    lastPingSec: 1,
    telemetryNote: "Active loading into armored face conveyor. Strata clearance verified.",
    actionRoute: "/hardware-matrix",
    actionLabel: "View Equipment Health",
  },
  {
    id: "AST-CREW-BRAVO",
    code: "CREW-B (14 Pers)",
    name: "Underground Roof Bolting Gang",
    category: "PERSONNEL",
    status: "NORMAL",
    zone: "West Return Airway 4",
    seam: "Seam III Horizon",
    seamId: "SEAM_III",
    elevationMsl: -184.2,
    coordinates: { x: 440, y: 190, lat: "23° 47' 16.5\" N", lon: "86° 24' 34.0\" E" },
    speedKmh: 0,
    batteryPct: 99,
    operator: "Overman S. Hansda",
    lastPingSec: 1,
    telemetryNote: "14 cap-lamp transponders active. Biometric muster verified at portal. CMR Form IV logged.",
    actionRoute: "/field-ops/form-iv",
    actionLabel: "Inspect Form IV Shift Diary",
  },
  {
    id: "AST-GAS-WS08",
    code: "CH4/CO NODE WS-08",
    name: "Trolex Sentro 8 Telemetry Beacon",
    category: "SENSOR",
    status: "CAUTION",
    zone: "Return Airway Split 2",
    seam: "Seam III Horizon",
    seamId: "SEAM_III",
    elevationMsl: -186.0,
    coordinates: { x: 620, y: 240, lat: "23° 47' 13.9\" N", lon: "86° 24' 45.1\" E" },
    speedKmh: 0,
    batteryPct: 100,
    lastPingSec: 1,
    gasCh4Pct: 0.82,
    telemetryNote: "CH4: 0.82% (Advisory threshold 0.75%). Air velocity: 1.84 m/s. Statutory trip threshold is 1.25%.",
    actionRoute: "/telemetry",
    actionLabel: "View Gas Trends in TimescaleDB",
  },
  {
    id: "AST-GATE-01",
    code: "CMR-169 OPTICAL GATE",
    name: "Pithead Inbye Portal Scanner",
    category: "GATEWAY",
    status: "NORMAL",
    zone: "Surface Collar Portal",
    seam: "Surface 0m",
    seamId: "SURFACE",
    elevationMsl: 0.0,
    coordinates: { x: 180, y: 460, lat: "23° 47' 21.0\" N", lon: "86° 24' 18.0\" E" },
    speedKmh: 0,
    batteryPct: 100,
    lastPingSec: 1,
    telemetryNote: "Turnstiles active. Dual Hikvision ATEX thermal cameras operational. 142 miners cleared today.",
    actionRoute: "/gate-hud",
    actionLabel: "Launch Pithead Gate HUD",
  },
];

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  // Operational Mode Switcher (Active filter tab)
  const [operationalMode, setOperationalMode] = useState<
    "ALL" | "PERSONNEL" | "GAS" | "HAULAGE" | "VENTILATION"
  >("ALL");

  // Seam Horizon Depth Filter
  const [selectedSeam, setSelectedSeam] = useState<string>("ALL");

  // CMR 2017 Gas Safety Threshold Filter
  const [gasThresholdFilter, setGasThresholdFilter] = useState<"ALL" | "ADVISORY" | "TRIP">("ALL");

  // Dock toggles
  const [leftDockOpen, setLeftDockOpen] = useState(true);
  const [rightDockOpen, setRightDockOpen] = useState(true);

  // Map state
  const [mapZoom, setMapZoom] = useState(100);
  const [mapPan, setMapPan] = useState({ x: 0, y: 0 });
  const [is3DMode, setIs3DMode] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<CollieryAsset>(COLLIERY_ASSETS[0]);
  const [hoveredCoords, setHoveredCoords] = useState<{
    x: number;
    y: number;
    lat: string;
    lon: string;
    elevation: string;
  } | null>(null);

  // Layer Visibility
  const [layerFleet, setLayerFleet] = useState(true);
  const [layerTransponders, setLayerTransponders] = useState(true);
  const [layerGateways, setLayerGateways] = useState(true);
  const [layerSensors, setLayerSensors] = useState(true);
  const [layerFaults, setLayerFaults] = useState(true);
  const [layerEscapeways, setLayerEscapeways] = useState(true);

  // Loading / Skeleton State
  const [isLoading, setIsLoading] = useState(false);

  // Telemetry refresh simulation
  const triggerTelemetryRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 700);
  };

  // Improved GeoJSON Export
  const handleExportGeoJSON = () => {
    const geojson = {
      type: "FeatureCollection",
      colliery: "BCCL Dhanbad Area IX - Mine Shaft 04",
      statutoryReference: "CMR-2017 Regulations 169 & 182",
      timestamp: new Date().toISOString(),
      crs: {
        type: "name",
        properties: { name: "urn:ogc:def:crs:EPSG::32645" },
      },
      features: COLLIERY_ASSETS.map((asset) => ({
        type: "Feature",
        id: asset.id,
        geometry: {
          type: "Point",
          coordinates: [86.4099, 23.7867, asset.elevationMsl],
        },
        properties: {
          code: asset.code,
          name: asset.name,
          category: asset.category,
          status: asset.status,
          zone: asset.zone,
          seam: asset.seam,
          elevationMsl: asset.elevationMsl,
          speedKmh: asset.speedKmh,
          payloadTons: asset.payloadTons || 0,
          gasCh4Pct: asset.gasCh4Pct || null,
          operator: asset.operator || "Autonomous / Static Sensor",
        },
      })),
    };

    const blob = new Blob([JSON.stringify(geojson, null, 2)], {
      type: "application/geo+json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `coalguard-colliery-spatial-layers-${Date.now()}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter assets based on Operational Mode, Seam Horizon, and Gas Threshold
  const filteredAssets = COLLIERY_ASSETS.filter((asset) => {
    // 1. Operational Mode filter
    if (operationalMode === "PERSONNEL" && asset.category !== "PERSONNEL") return false;
    if (operationalMode === "GAS" && asset.category !== "SENSOR") return false;
    if (operationalMode === "HAULAGE" && asset.category !== "HAULAGE") return false;
    if (operationalMode === "VENTILATION" && asset.category !== "SENSOR" && asset.category !== "GATEWAY") return false;

    // 2. Seam Horizon filter
    if (selectedSeam !== "ALL" && asset.seamId !== selectedSeam) return false;

    // 3. Gas threshold filter
    if (gasThresholdFilter === "ADVISORY" && (asset.gasCh4Pct || 0) < 0.75) return false;
    if (gasThresholdFilter === "TRIP" && (asset.gasCh4Pct || 0) < 1.25) return false;

    // 4. Layer visibility toggles
    if (asset.category === "HAULAGE" && !layerFleet) return false;
    if (asset.category === "PERSONNEL" && !layerTransponders) return false;
    if (asset.category === "GATEWAY" && !layerGateways) return false;
    if (asset.category === "SENSOR" && !layerSensors) return false;

    return true;
  });

  // Canvas map mouse tracker
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    const latSec = (14.2 + (y / 600) * 8.5).toFixed(1);
    const lonSec = (36.1 + (x / 900) * 16.4).toFixed(1);
    const elevation = (-184.2 + ((y - 300) / 300) * 60).toFixed(1);

    setHoveredCoords({
      x,
      y,
      lat: `23° 47' ${latSec}" N`,
      lon: `86° 24' ${lonSec}" E`,
      elevation: `${elevation} m MSL`,
    });
  };

  return (
    <div className="flex flex-col space-y-2 max-w-[1720px] mx-auto select-none">
      {/* Top Header / Operational Mode Switcher Bar */}
      <div className="bg-[#0b0e14] border border-[#1b2230] p-2 rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
        {/* Left: Breadcrumbs & Active Shift Ribbon */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
            <Link to="/dashboard" className="text-slate-300 hover:text-white transition-colors">
              Colliery C2
            </Link>
            <span>/</span>
            <span className="text-amber-400 font-semibold">GIS Operations Dashboard</span>
          </div>

          <div className="h-4 w-px bg-[#1e2638] hidden sm:block" />

          {/* Active Shift Indicator */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#121824] border border-[#1f283d] text-[10px] font-mono text-emerald-400">
            <Clock className="w-3 h-3 text-emerald-400" />
            <span>SHIFT C: 22:00 - 06:00 (ACTIVE)</span>
          </div>

          {/* Operational Mode Filter Tabs */}
          <div className="flex items-center gap-0.5 bg-[#101520] p-0.5 border border-[#1d2436] rounded-sm">
            {[
              { id: "ALL", label: "All Layers", count: COLLIERY_ASSETS.length, icon: Layers },
              { id: "PERSONNEL", label: "Personnel Mustering", count: 142, icon: Users },
              { id: "GAS", label: "Gas & Telemetry", count: 24, icon: Wind },
              { id: "HAULAGE", label: "Haulage Fleet", count: 14, icon: Truck },
              { id: "VENTILATION", label: "Ventilation Network", count: 4, icon: Radio },
            ].map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setOperationalMode(tab.id as typeof operationalMode)}
                  className={`px-2 py-1 text-[11px] font-mono transition-colors flex items-center gap-1.5 rounded-none ${
                    operationalMode === tab.id
                      ? "bg-[#1f293d] text-white border border-[#2d3a54] font-medium"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <TabIcon className={`w-3 h-3 ${operationalMode === tab.id ? "text-amber-400" : "text-slate-500"}`} />
                  <span>{tab.label}</span>
                  <span
                    className={`text-[9px] px-1 py-0.2 rounded-none ${
                      operationalMode === tab.id
                        ? "bg-amber-400 text-black font-bold"
                        : "bg-[#151c2a] text-slate-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: RTK Status & Core Actions */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {/* RTK Lock Telemetry Pill */}
          <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 bg-[#101520] border border-[#1b2438] text-[11px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300">
              RTK-GNSS + UWB: <strong className="text-emerald-400">99.8% LOCK</strong>
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">
              HDOP: <strong>0.82</strong>
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">
              MSL: <strong>-184.2m</strong>
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            {/* GeoJSON Export (Kept & Improved per user request) */}
            <button
              onClick={handleExportGeoJSON}
              title="Export Colliery Spatial Coordinates (GeoJSON)"
              className="h-7 px-2 bg-[#121724] hover:bg-[#1a2133] border border-[#1f283d] text-slate-300 hover:text-white text-[11px] font-mono flex items-center gap-1 transition-colors rounded-sm"
            >
              <Download className="w-3 h-3 text-slate-400" />
              <span>GeoJSON</span>
            </button>

            {/* Statutory Shift Report Generator (Direct to Reports module per user request) */}
            <Link
              to="/reports"
              title="Generate DGMS Shift & Environmental Compliance Report"
              className="h-7 px-2.5 bg-[#1b2436] hover:bg-[#25324a] border border-[#2d3a54] text-amber-300 hover:text-amber-200 text-[11px] font-mono font-medium flex items-center gap-1.5 transition-colors rounded-sm"
            >
              <FileText className="w-3 h-3 text-amber-400" />
              <span>CMR Report</span>
            </Link>

            {/* Refresh Telemetry */}
            <button
              onClick={triggerTelemetryRefresh}
              disabled={isLoading}
              title="Re-synchronize Live Colliery Telemetry"
              className="h-7 px-2 bg-[#121724] hover:bg-[#1a2133] border border-[#1f283d] text-slate-300 hover:text-white text-[11px] font-mono flex items-center gap-1 transition-colors rounded-sm"
            >
              <RefreshCw className={`w-3 h-3 text-amber-400 ${isLoading ? "animate-spin" : ""}`} />
              <span>Sync</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main CAD 3-Panel GIS Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 items-start">
        {/* Left Dock: Colliery Controls & Filtering (Col 3) */}
        {leftDockOpen ? (
          <div className="lg:col-span-3 bg-[#0a0d14] border border-[#181f2c] rounded-sm p-2.5 space-y-3.5 text-xs">
            {/* Dock Header */}
            <div className="flex items-center justify-between pb-1.5 border-b border-[#181f2c]">
              <div className="flex items-center gap-2 text-slate-200 font-semibold uppercase tracking-wider text-[11px]">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Colliery Controls</span>
              </div>
              <button
                onClick={() => setLeftDockOpen(false)}
                className="text-slate-400 hover:text-white p-1 hover:bg-[#141a26] rounded-sm transition-colors"
                title="Collapse Controls Dock"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Authentic Colliery Control 1: Seam Horizon Depth Selector (Replaces photo sliders) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-mono text-slate-300 uppercase tracking-wider font-semibold">
                  Seam Horizon Depth Filter
                </label>
                <span className="text-[10px] font-mono text-amber-400">
                  {selectedSeam === "ALL" ? "All Horizons" : selectedSeam.replace("_", " ")}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono">
                Isolate underground galleries &amp; machinery by statutory working horizon.
              </p>
              <div className="grid grid-cols-1 gap-1 font-mono text-[10px]">
                {[
                  { id: "ALL", name: "All Horizons (Composite)", depth: "Surface to -245m" },
                  { id: "SURFACE", name: "Surface Collar & Portal", depth: "0.0m MSL" },
                  { id: "SEAM_I", name: "Seam I (Overburden Decline)", depth: "-45.0m MSL" },
                  { id: "SEAM_II", name: "Seam II (Substation & Refuge)", depth: "-110.0m MSL" },
                  { id: "SEAM_III", name: "Seam III (Active Longwall)", depth: "-184.2m MSL" },
                  { id: "SEAM_IV", name: "Seam IV (Basal Development)", depth: "-245.0m MSL" },
                ].map((s) => {
                  const isActive = selectedSeam === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSeam(s.id)}
                      className={`py-1 px-2 text-left border rounded-sm flex items-center justify-between transition-colors ${
                        isActive
                          ? "bg-[#182236] border-amber-500/80 text-white font-semibold"
                          : "bg-[#0d121c] border-[#182030] text-slate-400 hover:text-slate-200 hover:bg-[#131926]"
                      }`}
                    >
                      <span className="truncate">{s.name}</span>
                      <span className={`text-[9px] ${isActive ? "text-amber-400" : "text-slate-500"}`}>
                        {s.depth}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Authentic Colliery Control 2: Statutory Gas Trip Alert Filter */}
            <div className="space-y-1.5 pt-2 border-t border-[#181f2c]">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-mono text-slate-300 uppercase tracking-wider font-semibold">
                  CMR 2017 Gas Alarm Filter
                </label>
                <span className="text-[10px] font-mono text-rose-400">Reg. 182</span>
              </div>
              <div className="grid grid-cols-3 gap-1 font-mono text-[10px]">
                <button
                  onClick={() => setGasThresholdFilter("ALL")}
                  className={`py-1 px-1.5 text-center border rounded-sm transition-colors ${
                    gasThresholdFilter === "ALL"
                      ? "bg-[#182236] border-[#32456e] text-white font-medium"
                      : "bg-[#0d121c] border-[#182030] text-slate-400 hover:text-slate-200"
                  }`}
                >
                  All Nodes
                </button>
                <button
                  onClick={() => setGasThresholdFilter("ADVISORY")}
                  className={`py-1 px-1.5 text-center border rounded-sm transition-colors ${
                    gasThresholdFilter === "ADVISORY"
                      ? "bg-amber-950/80 border-amber-500 text-amber-300 font-semibold"
                      : "bg-[#0d121c] border-[#182030] text-amber-400/70 hover:text-amber-300"
                  }`}
                >
                  &gt;0.75% CH4
                </button>
                <button
                  onClick={() => setGasThresholdFilter("TRIP")}
                  className={`py-1 px-1.5 text-center border rounded-sm transition-colors ${
                    gasThresholdFilter === "TRIP"
                      ? "bg-rose-950/80 border-rose-500 text-rose-300 font-semibold"
                      : "bg-[#0d121c] border-[#182030] text-rose-400/70 hover:text-rose-300"
                  }`}
                >
                  &gt;1.25% Trip
                </button>
              </div>
            </div>

            {/* Layer Visibility Toggles */}
            <div className="space-y-1.5 pt-2 border-t border-[#181f2c]">
              <label className="text-[11px] font-mono text-slate-300 uppercase tracking-wider font-semibold block">
                Colliery Spatial Layers
              </label>

              <div className="space-y-1 font-mono text-[11px]">
                <label className="flex items-center justify-between p-1 bg-[#0e131d] border border-[#172030] rounded-sm cursor-pointer hover:bg-[#131a29] transition-colors">
                  <span className="flex items-center gap-2 text-slate-200">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span>Haulage Fleet (14)</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={layerFleet}
                    onChange={(e) => setLayerFleet(e.target.checked)}
                    className="accent-cyan-500 rounded-none cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-1 bg-[#0e131d] border border-[#172030] rounded-sm cursor-pointer hover:bg-[#131a29] transition-colors">
                  <span className="flex items-center gap-2 text-slate-200">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>Cap-Lamp Transponders (142)</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={layerTransponders}
                    onChange={(e) => setLayerTransponders(e.target.checked)}
                    className="accent-amber-500 rounded-none cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-1 bg-[#0e131d] border border-[#172030] rounded-sm cursor-pointer hover:bg-[#131a29] transition-colors">
                  <span className="flex items-center gap-2 text-slate-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>CMR 169 Optical Gates (8)</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={layerGateways}
                    onChange={(e) => setLayerGateways(e.target.checked)}
                    className="accent-emerald-500 rounded-none cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-1 bg-[#0e131d] border border-[#172030] rounded-sm cursor-pointer hover:bg-[#131a29] transition-colors">
                  <span className="flex items-center gap-2 text-slate-200">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    <span>Gas Beacons CH4/CO (24)</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={layerSensors}
                    onChange={(e) => setLayerSensors(e.target.checked)}
                    className="accent-rose-500 rounded-none cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-1 bg-[#0e131d] border border-[#172030] rounded-sm cursor-pointer hover:bg-[#131a29] transition-colors">
                  <span className="flex items-center gap-2 text-slate-200">
                    <span className="w-2 h-2 rounded-full bg-violet-400" />
                    <span>Geological Faults (3)</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={layerFaults}
                    onChange={(e) => setLayerFaults(e.target.checked)}
                    className="accent-violet-500 rounded-none cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-1 bg-[#0e131d] border border-[#172030] rounded-sm cursor-pointer hover:bg-[#131a29] transition-colors">
                  <span className="flex items-center gap-2 text-slate-200">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <span>Emergency Escapeways (2)</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={layerEscapeways}
                    onChange={(e) => setLayerEscapeways(e.target.checked)}
                    className="accent-blue-500 rounded-none cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Coordinate Inspector Box */}
            <div className="pt-2 border-t border-[#181f2c] font-mono text-[10px] space-y-1 text-slate-400">
              <div className="flex items-center justify-between text-slate-300">
                <span className="uppercase">Projected Datum</span>
                <span className="text-amber-400 font-semibold">UTM 45N / WGS84</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Cursor Northing:</span>
                <span className="text-slate-200">
                  {hoveredCoords ? hoveredCoords.lat : "23° 47' 14.2\" N"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Cursor Easting:</span>
                <span className="text-slate-200">
                  {hoveredCoords ? hoveredCoords.lon : "86° 24' 36.1\" E"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Elevation MSL:</span>
                <span className="text-emerald-400">
                  {hoveredCoords ? hoveredCoords.elevation : "-184.2 m MSL"}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setLeftDockOpen(true)}
            className="lg:col-span-1 h-12 bg-[#0a0d14] hover:bg-[#141a26] border border-[#181f2c] rounded-sm flex items-center justify-center text-slate-300 transition-colors"
            title="Expand Controls Dock"
          >
            <ChevronRight className="w-4 h-4 text-amber-400" />
          </button>
        )}

        {/* Center Viewport: High-Density Dark Vector GIS Coordinate Map */}
        <div
          className={`${
            leftDockOpen && rightDockOpen
              ? "lg:col-span-6"
              : !leftDockOpen && !rightDockOpen
              ? "lg:col-span-10"
              : "lg:col-span-8"
          } bg-[#06080e] border border-[#181f2c] rounded-sm relative overflow-hidden flex flex-col h-[700px] select-none`}
        >
          {/* Skeleton Shimmer Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 z-50 bg-[#06080e] flex flex-col p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-6 w-48 bg-[#131926] skeleton-shimmer rounded-sm" />
                <div className="h-6 w-32 bg-[#131926] skeleton-shimmer rounded-sm" />
              </div>
              <div className="flex-1 bg-[#0b0e17] skeleton-shimmer rounded-sm border border-[#192132]" />
              <div className="grid grid-cols-4 gap-3">
                <div className="h-10 bg-[#131926] skeleton-shimmer rounded-sm" />
                <div className="h-10 bg-[#131926] skeleton-shimmer rounded-sm" />
                <div className="h-10 bg-[#131926] skeleton-shimmer rounded-sm" />
                <div className="h-10 bg-[#131926] skeleton-shimmer rounded-sm" />
              </div>
            </div>
          )}

          {/* Map Top Bar Telemetry Strip */}
          <div className="absolute top-2.5 left-2.5 right-2.5 z-20 flex items-center justify-between pointer-events-none">
            {/* Left coordinate & scale indicator */}
            <div className="pointer-events-auto bg-[#0b0f17]/95 border border-[#1a2336] px-2.5 py-1 text-[11px] font-mono text-slate-300 flex items-center gap-2">
              <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
              <span>SHAFT-04: GRID 84N</span>
              <span className="text-slate-600">|</span>
              <span className="text-amber-400">Scale 1:2500</span>
              <span className="text-slate-600">|</span>
              <span className="text-emerald-400">{filteredAssets.length} Assets Visible</span>
            </div>

            {/* Mode switch 2D / 3D */}
            <div className="pointer-events-auto flex items-center gap-1 bg-[#0b0f17]/95 border border-[#1a2336] p-0.5">
              <button
                onClick={() => setIs3DMode(!is3DMode)}
                className={`px-2 py-0.5 text-[10px] font-mono font-semibold transition-colors rounded-none ${
                  is3DMode
                    ? "bg-amber-400 text-black"
                    : "bg-[#141b2b] text-slate-300 hover:text-white"
                }`}
              >
                {is3DMode ? "3D ISOMETRIC" : "2D ORTHO"}
              </button>
            </div>
          </div>

          {/* Interactive SVG GIS Map Canvas */}
          <div
            className="flex-1 w-full h-full relative cursor-crosshair overflow-hidden transition-transform duration-300"
            style={{
              transform: `scale(${mapZoom / 100}) translate(${mapPan.x}px, ${mapPan.y}px) ${
                is3DMode ? "rotateX(28deg) rotateZ(-12deg)" : ""
              }`,
            }}
          >
            <svg
              className="w-full h-full"
              viewBox="0 0 900 600"
              onMouseMove={handleMouseMove}
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* 1px precision CAD grid pattern */}
                <pattern id="cadGridMajor" width="100" height="100" patternUnits="userSpaceOnUse">
                  <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#151c2a" strokeWidth="1" />
                </pattern>
                <pattern id="cadGridMinor" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#0e131d" strokeWidth="0.5" />
                </pattern>
              </defs>

              {/* Background layers */}
              <rect width="100%" height="100%" fill="#07090f" />
              <rect width="100%" height="100%" fill="url(#cadGridMinor)" />
              <rect width="100%" height="100%" fill="url(#cadGridMajor)" />

              {/* Coordinate axis tick markers */}
              <g stroke="#1b2438" strokeWidth="1">
                {[100, 200, 300, 400, 500, 600, 700, 800].map((x) => (
                  <line key={`tx-${x}`} x1={x} y1="0" x2={x} y2="8" />
                ))}
                {[100, 200, 300, 400, 500].map((y) => (
                  <line key={`ty-${y}`} x1="0" y1={y} x2="8" y2={y} />
                ))}
              </g>

              {/* Coordinate numbers on axes */}
              <g fill="#37455f" fontFamily="monospace" fontSize="8">
                <text x="105" y="12">439,100 mE</text>
                <text x="305" y="12">439,300 mE</text>
                <text x="505" y="12">439,500 mE</text>
                <text x="705" y="12">439,700 mE</text>
                <text x="10" y="105">2,631,800 mN</text>
                <text x="10" y="305">2,631,600 mN</text>
                <text x="10" y="505">2,631,400 mN</text>
              </g>

              {/* Geological fault lines */}
              {layerFaults && (
                <g stroke="#7c3aed" strokeWidth="1.5" strokeDasharray="6 4" fill="none" opacity="0.6">
                  <path d="M 120 80 Q 320 220, 580 340 T 840 510" />
                  <path d="M 400 40 L 520 220 L 720 380" />
                  <text x="590" y="340" fill="#a78bfa" fontSize="8" fontFamily="monospace">
                    FAULT F-3 (THROWS 4.2m)
                  </text>
                </g>
              )}

              {/* Primary Colliery Underground Gallery Spatial Network */}
              <g
                stroke={selectedSeam === "SEAM_IV" ? "#141c2c" : "#1e273a"}
                strokeWidth="14"
                fill="none"
                strokeLinecap="square"
              >
                {/* Main Incline Haulage Drift */}
                <path d="M 180 460 L 320 380 L 460 300 L 620 240 L 780 180" />
                {/* Lateral Seam III Gallery 1 */}
                <path d="M 320 380 L 380 310 L 460 210 L 540 160" />
                {/* Sump Gallery Track */}
                <path d="M 460 300 L 540 390 L 660 460 L 760 520" />
                {/* Seam IV Basal Drift */}
                <path d="M 620 240 L 710 440 L 820 480" stroke={selectedSeam === "SEAM_IV" ? "#2a3952" : undefined} />
              </g>

              {/* Underground Gallery Inner Centerline (Rails / Haul Road) */}
              <g stroke="#090d15" strokeWidth="8" fill="none">
                <path d="M 180 460 L 320 380 L 460 300 L 620 240 L 780 180" />
                <path d="M 320 380 L 380 310 L 460 210 L 540 160" />
                <path d="M 460 300 L 540 390 L 660 460 L 760 520" />
                <path d="M 620 240 L 710 440 L 820 480" />
              </g>

              {/* Escapeways (Green dashed safety paths) */}
              {layerEscapeways && (
                <g stroke="#059669" strokeWidth="2" strokeDasharray="4 4" fill="none" opacity="0.85">
                  <path d="M 190 470 L 330 390 L 470 310 L 630 250 L 790 190" />
                  <path d="M 470 310 L 550 400 L 670 470" />
                  <text x="680" y="475" fill="#34d399" fontSize="8" fontFamily="monospace">
                    ESCAPEWAY INBYE B
                  </text>
                </g>
              )}

              {/* Haulage Route Vectors */}
              {layerFleet && (
                <g stroke="#0ea5e9" strokeWidth="2.5" strokeDasharray="8 6" fill="none">
                  <path d="M 180 460 L 320 380 L 380 310" />
                  <path d="M 380 310 L 460 300 L 540 390" />
                  <circle cx="180" cy="460" r="4" fill="#0ea5e9" />
                  <circle cx="380" cy="310" r="4" fill="#0ea5e9" />
                </g>
              )}

              {/* Sector / Landmark Zone Labels */}
              <g fill="#475569" fontSize="9" fontFamily="monospace" fontWeight="600">
                <text x="140" y="490">PORTAL 04 WEIGHBRIDGE (EL 0.0m)</text>
                <text x="320" y="290">SEAM III LONGWALL 3 (EL -184m)</text>
                <text x="560" y="420">CENTRAL SUMP &amp; PUMP ROOM</text>
                <text x="690" y="220">RETURN AIRWAY SHAFT #2</text>
                <text x="730" y="470">SEAM IV BASAL DRIFT (EL -245m)</text>
              </g>

              {/* Active Colliery Asset Pins & Vehicles */}
              {filteredAssets.map((asset) => {
                const isSelected = selectedAsset.id === asset.id;
                let pinColor = "#0ea5e9";
                if (asset.category === "HAULAGE") pinColor = "#0284c7";
                if (asset.category === "PERSONNEL") pinColor = "#f59e0b";
                if (asset.category === "SENSOR") pinColor = (asset.gasCh4Pct || 0) >= 0.75 ? "#ef4444" : "#10b981";
                if (asset.category === "GATEWAY") pinColor = "#10b981";

                return (
                  <g
                    key={asset.id}
                    transform={`translate(${asset.coordinates.x}, ${asset.coordinates.y})`}
                    onClick={() => setSelectedAsset(asset)}
                    className="cursor-pointer"
                  >
                    {/* Selected halo */}
                    {isSelected && (
                      <circle
                        cx="0"
                        cy="0"
                        r="16"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                      />
                    )}

                    {/* Outer marker symbol */}
                    <rect
                      x="-8"
                      y="-8"
                      width="16"
                      height="16"
                      fill={isSelected ? "#f59e0b" : "#0d131f"}
                      stroke={pinColor}
                      strokeWidth="2"
                    />

                    {/* Inner core */}
                    <circle cx="0" cy="0" r="3" fill={isSelected ? "#000000" : pinColor} />

                    {/* Tag label */}
                    <rect
                      x="12"
                      y="-11"
                      width={asset.code.length * 6.5 + 16}
                      height="16"
                      fill="#090d16"
                      stroke={isSelected ? "#f59e0b" : "#1f293d"}
                      strokeWidth="1"
                    />
                    <text
                      x="16"
                      y="1"
                      fill={isSelected ? "#f59e0b" : "#cbd5e1"}
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {asset.code}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Bottom GIS Navigation & Precision Controls Strip */}
          <div className="bg-[#090d14] border-t border-[#181f2c] px-3 py-2 flex items-center justify-between text-xs font-mono">
            {/* Live Hovered Coordinate Feed */}
            <div className="flex items-center gap-3 text-slate-400 text-[11px]">
              <span className="text-slate-300">
                CURSOR: <strong className="text-amber-400">{hoveredCoords ? hoveredCoords.lat : "23° 47' 14.2\" N"}</strong>,{" "}
                <strong className="text-amber-400">{hoveredCoords ? hoveredCoords.lon : "86° 24' 36.1\" E"}</strong>
              </span>
              <span className="text-slate-600 hidden sm:inline">|</span>
              <span className="hidden sm:inline text-slate-400">
                HEADING: <strong className="text-white">314° NW</strong>
              </span>
            </div>

            {/* Viewport Control Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMapZoom(Math.max(70, mapZoom - 15))}
                title="Zoom Out"
                className="w-7 h-7 bg-[#111724] hover:bg-[#1a2236] border border-[#1d273c] text-slate-300 hover:text-white flex items-center justify-center rounded-sm transition-colors"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <span className="px-2 text-[11px] text-slate-300 min-w-[44px] text-center">
                {mapZoom}%
              </span>

              <button
                onClick={() => setMapZoom(Math.min(180, mapZoom + 15))}
                title="Zoom In"
                className="w-7 h-7 bg-[#111724] hover:bg-[#1a2236] border border-[#1d273c] text-slate-300 hover:text-white flex items-center justify-center rounded-sm transition-colors"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => {
                  setMapZoom(100);
                  setMapPan({ x: 0, y: 0 });
                }}
                title="Reset View Extents"
                className="w-7 h-7 bg-[#111724] hover:bg-[#1a2236] border border-[#1d273c] text-slate-300 hover:text-white flex items-center justify-center rounded-sm transition-colors ml-0.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Dock: Analytical Telemetry & Interrelated System Hub (Col 3) */}
        {rightDockOpen ? (
          <div className="lg:col-span-3 bg-[#0a0d14] border border-[#181f2c] rounded-sm p-2.5 space-y-3 text-xs">
            {/* Dock Header */}
            <div className="flex items-center justify-between pb-1.5 border-b border-[#181f2c]">
              <div className="flex items-center gap-2 text-slate-200 font-semibold uppercase tracking-wider text-[11px]">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>Selected Telemetry &amp; Strata</span>
              </div>
              <button
                onClick={() => setRightDockOpen(false)}
                className="text-slate-400 hover:text-white p-1 hover:bg-[#141a26] rounded-sm transition-colors"
                title="Collapse Analytics Dock"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Selected Asset Telemetry HUD */}
            <div className="p-2.5 bg-[#0e131d] border border-[#1b2538] rounded-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-amber-400 text-xs tracking-tight">
                  {selectedAsset.code}
                </span>
                <span
                  className={`px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase rounded-none ${
                    selectedAsset.status === "NORMAL"
                      ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                      : "bg-amber-950 text-amber-400 border border-amber-800"
                  }`}
                >
                  {selectedAsset.status}
                </span>
              </div>

              <div className="text-[11px] text-slate-300 font-mono">
                {selectedAsset.name}
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-[#1a2334] font-mono text-[10px]">
                <div>
                  <span className="text-slate-500 block">Horizon Seam</span>
                  <span className="text-slate-200">{selectedAsset.seam}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">MSL Elevation</span>
                  <span className="text-slate-200">{selectedAsset.elevationMsl} m</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Velocity</span>
                  <span className="text-slate-200">{selectedAsset.speedKmh} km/h</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Battery / Power</span>
                  <span className="text-emerald-400 font-semibold">{selectedAsset.batteryPct}%</span>
                </div>
                {selectedAsset.payloadTons !== undefined && (
                  <div className="col-span-2">
                    <span className="text-slate-500 block">Haul Payload Tonnage</span>
                    <span className="text-amber-400 font-bold">{selectedAsset.payloadTons} Metric Tons</span>
                  </div>
                )}
                {selectedAsset.gasCh4Pct !== undefined && (
                  <div className="col-span-2">
                    <span className="text-slate-500 block">Atmospheric Methane (CH4)</span>
                    <span className="text-rose-400 font-bold">{selectedAsset.gasCh4Pct}% (Advisory)</span>
                  </div>
                )}
                {selectedAsset.operator && (
                  <div className="col-span-2">
                    <span className="text-slate-500 block">Assigned Personnel</span>
                    <span className="text-slate-200">{selectedAsset.operator}</span>
                  </div>
                )}
              </div>

              <div className="p-2 bg-[#090d14] border border-[#161e2e] text-[10px] text-slate-400 font-mono leading-relaxed">
                {selectedAsset.telemetryNote}
              </div>

              {/* Direct Contextual Jump Action to Interrelated Module */}
              <button
                onClick={() => navigate(selectedAsset.actionRoute)}
                className="w-full py-1.5 px-2 bg-[#1b2538] hover:bg-[#25334a] border border-[#2e3e5c] text-amber-300 hover:text-amber-200 font-mono text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors rounded-sm"
              >
                <span>{selectedAsset.actionLabel}</span>
                <ExternalLink className="w-3 h-3 text-amber-400" />
              </button>
            </div>

            {/* Strata Depth Profile Cross-Section (Interactive) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-300 font-semibold uppercase">Strata Depth Profile</span>
                <span className="text-slate-500">BH-14 Borehole</span>
              </div>

              <div className="space-y-1 font-mono text-[10px]">
                {[
                  { id: "SURFACE", name: "Surface Collar", depth: "0.0 m MSL" },
                  { id: "SEAM_I", name: "Seam I (Overburden)", depth: "-45.0 m" },
                  { id: "SEAM_II", name: "Seam II (Sandstone)", depth: "-110.0 m" },
                  { id: "SEAM_III", name: "Seam III (Active Longwall)", depth: "-184.2 m", active: true },
                  { id: "SEAM_IV", name: "Seam IV (Basal Coal)", depth: "-245.0 m" },
                ].map((s) => {
                  const isCurrent = selectedSeam === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSeam(s.id)}
                      className={`w-full p-1 text-left flex items-center justify-between border rounded-none transition-colors ${
                        isCurrent
                          ? "bg-[#1e293b] border-amber-500 text-white font-semibold"
                          : s.active
                          ? "bg-[#141b27] border-amber-500/40 text-slate-200"
                          : "bg-[#0d121c] border-[#16202e] text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        {s.active && <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping" />}
                        <span>{s.name}</span>
                      </span>
                      <span className={isCurrent ? "text-amber-400" : "text-slate-500"}>
                        {s.depth}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Haulage Throughput & Fleet Performance */}
            <div className="space-y-1 pt-1.5 border-t border-[#181f2c]">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-300 font-semibold uppercase">Haulage Throughput</span>
                <span className="text-emerald-400">SHIFT C ACTIVE</span>
              </div>

              <div className="grid grid-cols-2 gap-1 font-mono text-[10px]">
                <div className="p-1.5 bg-[#0d121c] border border-[#172132]">
                  <span className="text-slate-500 block">Cycle Time</span>
                  <span className="text-white text-xs font-bold">14.2 min</span>
                </div>
                <div className="p-1.5 bg-[#0d121c] border border-[#172132]">
                  <span className="text-slate-500 block">Throughput</span>
                  <span className="text-white text-xs font-bold">842 T/hr</span>
                </div>
                <div className="p-1.5 bg-[#0d121c] border border-[#172132]">
                  <span className="text-slate-500 block">Gate Latency</span>
                  <span className="text-white text-xs font-bold">3.8 sec</span>
                </div>
                <div className="p-1.5 bg-[#0d121c] border border-[#172132]">
                  <span className="text-slate-500 block">Active Ratio</span>
                  <span className="text-emerald-400 text-xs font-bold">12 / 14</span>
                </div>
              </div>
            </div>

            {/* Multi-Parameter Safety Envelope Visual */}
            <div className="space-y-1 pt-1.5 border-t border-[#181f2c]">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-300 font-semibold uppercase">Safety Envelope</span>
                <span className="text-emerald-400 font-bold">96.8 / 100</span>
              </div>

              <div className="space-y-1 font-mono text-[10px]">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Atmospheric Methane (CH4)</span>
                  <span className="text-emerald-400">98% Safe</span>
                </div>
                <div className="w-full bg-[#161e2c] h-1">
                  <div className="bg-emerald-500 h-1" style={{ width: "98%" }} />
                </div>

                <div className="flex items-center justify-between text-slate-400 pt-0.5">
                  <span>Strata Convergence</span>
                  <span className="text-emerald-400">94% Safe</span>
                </div>
                <div className="w-full bg-[#161e2c] h-1">
                  <div className="bg-emerald-500 h-1" style={{ width: "94%" }} />
                </div>

                <div className="flex items-center justify-between text-slate-400 pt-0.5">
                  <span>Personnel Mustering Lock</span>
                  <span className="text-emerald-400">100% Reconciled</span>
                </div>
                <div className="w-full bg-[#161e2c] h-1">
                  <div className="bg-emerald-500 h-1" style={{ width: "100%" }} />
                </div>
              </div>
            </div>

            {/* Interrelated Modules Command Strip */}
            <div className="pt-2 border-t border-[#181f2c] space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-semibold">
                Interrelated Operations Modules
              </span>
              <div className="grid grid-cols-2 gap-1 font-mono text-[10px]">
                <Link
                  to="/gate-hud"
                  className="p-1.5 bg-[#0e1420] hover:bg-[#162033] border border-[#1b2538] text-slate-300 hover:text-white flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Shield className="w-3 h-3 text-emerald-400" />
                    <span>Gate HUD</span>
                  </span>
                  <ChevronRight className="w-3 h-3 text-slate-500" />
                </Link>

                <Link
                  to="/telemetry"
                  className="p-1.5 bg-[#0e1420] hover:bg-[#162033] border border-[#1b2538] text-slate-300 hover:text-white flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Wind className="w-3 h-3 text-sky-400" />
                    <span>Gas Telemetry</span>
                  </span>
                  <ChevronRight className="w-3 h-3 text-slate-500" />
                </Link>

                <Link
                  to="/hardware-matrix"
                  className="p-1.5 bg-[#0e1420] hover:bg-[#162033] border border-[#1b2538] text-slate-300 hover:text-white flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Server className="w-3 h-3 text-amber-400" />
                    <span>Diagnostics</span>
                  </span>
                  <ChevronRight className="w-3 h-3 text-slate-500" />
                </Link>

                <Link
                  to="/governance/remediation"
                  className="p-1.5 bg-[#0e1420] hover:bg-[#162033] border border-[#1b2538] text-slate-300 hover:text-white flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                    <span>Remediation</span>
                  </span>
                  <ChevronRight className="w-3 h-3 text-slate-500" />
                </Link>

                <Link
                  to="/governance/audit-ledger"
                  className="p-1.5 bg-[#0e1420] hover:bg-[#162033] border border-[#1b2538] text-slate-300 hover:text-white flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Compass className="w-3 h-3 text-violet-400" />
                    <span>Audit Ledger</span>
                  </span>
                  <ChevronRight className="w-3 h-3 text-slate-500" />
                </Link>

                <Link
                  to="/field-ops/form-iv"
                  className="p-1.5 bg-[#0e1420] hover:bg-[#162033] border border-[#1b2538] text-slate-300 hover:text-white flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3 h-3 text-amber-400" />
                    <span>Form IV Diary</span>
                  </span>
                  <ChevronRight className="w-3 h-3 text-slate-500" />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setRightDockOpen(true)}
            className="lg:col-span-1 h-12 bg-[#0a0d14] hover:bg-[#141a26] border border-[#181f2c] rounded-sm flex items-center justify-center text-slate-300 transition-colors"
            title="Expand Analytics Dock"
          >
            <ChevronLeft className="w-4 h-4 text-cyan-400" />
          </button>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
