import React, { useState } from "react";
import {
  Activity,
  Camera,
  CheckCircle2,
  Flame,
  Grid2x2,
  HardHat,
  Radio,
  RefreshCw,
  ShieldCheck,
  Tv,
  Wind,
  XCircle,
} from "lucide-react";
import { useGateStore } from "@/store/gate-store";
import { useControlRoomWS } from "../hooks/use-control-room-ws";
import { WebRTCPlayer } from "../components/webrtc-player";
import { CanvasHudOverlay } from "../components/canvas-hud-overlay";
import { WearStateCard } from "../components/wear-state-card";
import { RealTimeAlertBanner } from "../components/real-time-alert-banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ViewMode = "single" | "quad";

export const GateHudPage: React.FC = () => {
  const { isConnected, reconnect } = useControlRoomWS();
  const {
    activeFeeds,
    selectedFeedId,
    selectFeed,
    latestAccessEvent,
    recentEvents,
    simulateAccessAttempt,
    addAlert,
  } = useGateStore();

  const [viewMode, setViewMode] = useState<ViewMode>("single");

  const selectedFeed =
    activeFeeds.find((f) => f.id === selectedFeedId) || activeFeeds[0];

  const handleSimulateGasSpike = () => {
    addAlert({
      id: `alert-gas-${Date.now()}`,
      event_type: "GAS_SPIKE_ALERT",
      severity: "CRITICAL",
      title: "METHANE CONTINUOUS TRIP BREACH (CH4 ≥ 1.25%)",
      message:
        "Pithead return airway sensor reported 1.34% CH4. Automated electrical trip interlock commanded under CMR 2017 Reg. 169(3).",
      statutory_rule: "CMR 2017 Reg. 169(3)",
      timestamp: new Date().toISOString(),
      acknowledged: false,
    });
  };

  return (
    <div className="space-y-space-md max-w-7xl mx-auto flex flex-col">
      {/* Real-time High-Priority Alert Banner */}
      <RealTimeAlertBanner />

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md bg-surface-container p-space-lg rounded border border-outline-variant/40 shadow-sm">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-telemetry-micro uppercase bg-primary-container/20 text-primary px-1.5 py-0.5 rounded border border-primary/30">
              CCTV OPTICAL // WEBRTC GATEWAY
            </span>
            <div
              className={cn(
                "flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-telemetry",
                isConnected
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/30"
              )}
            >
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  isConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                )}
              />
              <span>
                {isConnected
                  ? "WEBSOCKET LIVE // REDIS PUB/SUB"
                  : "RECONNECTING GATEWAY..."}
              </span>
            </div>
          </div>
          <h1 className="text-headline-lg font-bold text-on-surface tracking-tight flex items-center gap-2">
            <Tv className="w-6 h-6 text-primary" />
            Pithead Checkpoint &amp; Optical PPE HUD
          </h1>
          <p className="text-body-sm text-on-surface-variant">
            Live WebRTC RTSP streams, 60 FPS HTML5 Canvas bounding box arbitration, and automated CMR 2017 turnstile interlock control.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-space-sm">
          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded border border-outline-variant/40">
            <button
              type="button"
              onClick={() => setViewMode("single")}
              className={cn(
                "px-2.5 py-1 rounded text-xs font-telemetry flex items-center gap-1.5 transition-colors",
                viewMode === "single"
                  ? "bg-primary-container text-white font-semibold shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Primary</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("quad")}
              className={cn(
                "px-2.5 py-1 rounded text-xs font-telemetry flex items-center gap-1.5 transition-colors",
                viewMode === "quad"
                  ? "bg-primary-container text-white font-semibold shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              <Grid2x2 className="w-3.5 h-3.5" />
              <span>Quad Grid</span>
            </button>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={reconnect}
            className="gap-1.5 font-telemetry-sm text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Socket</span>
          </Button>
        </div>
      </div>

      {/* Main Control Room Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md">
        {/* Left Column: Video Feeds (8 Cols) */}
        <div className="lg:col-span-8 space-y-space-md">
          {viewMode === "single" ? (
            /* Single Large Video Feed with Canvas HUD */
            <div className="space-y-2">
              <WebRTCPlayer
                feedName={selectedFeed.name}
                location={selectedFeed.location}
                status={selectedFeed.status}
                fps={selectedFeed.fps}
                latencyMs={selectedFeed.latencyMs}
                resolution={selectedFeed.resolution}
              >
                <CanvasHudOverlay
                  boundingBoxes={latestAccessEvent?.bounding_boxes || []}
                  opticalCompliance={latestAccessEvent?.optical_compliance ?? true}
                  gateActuated={latestAccessEvent?.gate_actuated ?? true}
                />
              </WebRTCPlayer>

              {/* Camera Selector Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {activeFeeds.map((feed) => {
                  const isCurrent = feed.id === selectedFeed.id;
                  return (
                    <button
                      key={feed.id}
                      type="button"
                      onClick={() => selectFeed(feed.id)}
                      className={cn(
                        "p-2 rounded border text-left transition-all font-telemetry text-xs space-y-0.5",
                        isCurrent
                          ? "bg-primary-container/20 border-primary text-on-surface shadow-md"
                          : "bg-surface-container border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[11px] truncate">
                          {feed.name}
                        </span>
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            feed.status === "ONLINE"
                              ? "bg-emerald-400"
                              : "bg-amber-400"
                          )}
                        />
                      </div>
                      <span className="text-[10px] text-outline block truncate">
                        {feed.location}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* 2x2 Quad Grid Mode */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activeFeeds.map((feed) => (
                <div
                  key={feed.id}
                  onClick={() => {
                    selectFeed(feed.id);
                    setViewMode("single");
                  }}
                  className="cursor-pointer group relative rounded overflow-hidden border border-outline-variant/40 hover:border-primary transition-all"
                >
                  <WebRTCPlayer
                    feedName={feed.name}
                    location={feed.location}
                    status={feed.status}
                    fps={feed.fps}
                    latencyMs={feed.latencyMs}
                    resolution={feed.resolution}
                  >
                    {feed.id === selectedFeed.id && (
                      <CanvasHudOverlay
                        boundingBoxes={latestAccessEvent?.bounding_boxes || []}
                        opticalCompliance={latestAccessEvent?.optical_compliance ?? true}
                        gateActuated={latestAccessEvent?.gate_actuated ?? true}
                      />
                    )}
                  </WebRTCPlayer>
                </div>
              ))}
            </div>
          )}

          {/* Interactive Edge Simulation Toolbar */}
          <Card className="bg-surface-container-low border-outline-variant/30">
            <CardHeader className="p-space-sm px-space-md border-b border-outline-variant/20 flex flex-row items-center justify-between pb-space-xs">
              <span className="font-telemetry-micro uppercase text-outline flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-primary" />
                EDGE VISION MINI-PC &amp; TURNSTILE SIMULATION CONTROL
              </span>
              <span className="text-[10px] font-telemetry text-emerald-400">
                ACTIVE TEST RIG
              </span>
            </CardHeader>
            <CardContent className="p-space-sm flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => simulateAccessAttempt(true)}
                className="text-xs font-telemetry gap-1.5 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/40"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Simulate Compliant Ingress</span>
              </Button>

              <Button
                size="sm"
                variant="secondary"
                onClick={() => simulateAccessAttempt(false, "scsr")}
                className="text-xs font-telemetry gap-1.5 border border-rose-500/40 text-rose-300 hover:bg-rose-950/40"
              >
                <Wind className="w-3.5 h-3.5 text-rose-400" />
                <span>Simulate Missing SCSR Infraction</span>
              </Button>

              <Button
                size="sm"
                variant="secondary"
                onClick={() => simulateAccessAttempt(false, "hardhat")}
                className="text-xs font-telemetry gap-1.5 border border-rose-500/40 text-rose-300 hover:bg-rose-950/40"
              >
                <HardHat className="w-3.5 h-3.5 text-rose-400" />
                <span>Simulate Missing Hardhat</span>
              </Button>

              <Button
                size="sm"
                variant="secondary"
                onClick={handleSimulateGasSpike}
                className="text-xs font-telemetry gap-1.5 border border-amber-500/40 text-amber-300 hover:bg-amber-950/40"
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Inject Gas Spike Alert</span>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Wear State Card & Recent Ingress Log (4 Cols) */}
        <div className="lg:col-span-4 space-y-space-md">
          {/* Active Miner Wear State Inspector */}
          <WearStateCard event={latestAccessEvent} />

          {/* Recent Ingress Log Stream Ticker */}
          <Card className="bg-surface-container-low border-outline-variant/30">
            <CardHeader className="p-space-sm px-space-md border-b border-outline-variant/20 flex flex-row items-center justify-between pb-space-xs">
              <span className="font-telemetry-micro uppercase text-outline flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-primary" />
                RECENT PITHEAD ACCESS LOGS
              </span>
              <span className="text-[10px] font-telemetry text-outline">
                {recentEvents.length} RECORDED
              </span>
            </CardHeader>
            <CardContent className="p-0 max-h-72 overflow-y-auto divide-y divide-outline-variant/20">
              {recentEvents.length === 0 ? (
                <div className="p-space-lg text-center text-outline font-telemetry text-xs">
                  No turnstile events logged in current shift session.
                </div>
              ) : (
                recentEvents.map((evt, idx) => (
                  <div
                    key={evt.access_log_id || idx}
                    onClick={() => useGateStore.setState({ latestAccessEvent: evt })}
                    className={cn(
                      "p-2.5 px-3 flex items-center justify-between hover:bg-surface-container cursor-pointer transition-colors text-xs font-telemetry",
                      evt.access_log_id === latestAccessEvent?.access_log_id
                        ? "bg-surface-container-high border-l-2 border-primary"
                        : ""
                    )}
                  >
                    <div className="space-y-0.5">
                      <span className="font-bold text-on-surface block truncate max-w-[160px]">
                        {evt.worker_name || evt.rfid_tag}
                      </span>
                      <span className="text-[10px] text-outline block">
                        {evt.timestamp
                          ? new Date(evt.timestamp).toLocaleTimeString()
                          : "RECENT"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {evt.gate_actuated ? (
                        <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>PASS</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40 font-semibold">
                          <XCircle className="w-3 h-3" />
                          <span>DENIED</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Control Room Telemetry Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-space-sm bg-surface-container-lowest rounded border border-outline-variant/20 font-telemetry-micro text-telemetry-micro text-outline">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>STATUTORY FRAMEWORK: CMR 2017 REG. 191(A) ENFORCED</span>
          <span>•</span>
          <span>LATENCY: ZERO DETECTOR BUFFER // 60 FPS CANVAS ARBITRATION</span>
        </div>
        <div>
          SOCKET STATUS:{" "}
          <span className="font-mono text-on-surface">
            {isConnected ? "ONLINE (FULL DUPLEX)" : "DISCONNECTED"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default GateHudPage;
