import React, { useEffect, useRef, useState } from "react";
import { Camera, Radio, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface WebRTCPlayerProps {
  streamUrl?: string;
  feedName: string;
  location: string;
  status: "ONLINE" | "OFFLINE" | "DEGRADED";
  fps?: number;
  latencyMs?: number;
  resolution?: string;
  children?: React.ReactNode;
  className?: string;
}

export const WebRTCPlayer: React.FC<WebRTCPlayerProps> = ({
  streamUrl,
  feedName,
  location,
  status,
  fps = 30,
  latencyMs = 18.4,
  resolution = "1920x1080",
  children,
  className,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const simCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [timeString, setTimeString] = useState<string>("");

  // Live timestamp overlay
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
          now.getDate()
        ).padStart(2, "0")} ${now.toLocaleTimeString("en-GB")}.${String(
          now.getMilliseconds()
        ).padStart(3, "0")}`
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 50);
    return () => clearInterval(interval);
  }, []);

  // Simulated animated underground pithead visualizer if streamUrl is not a live stream
  useEffect(() => {
    const canvas = simCanvasRef.current;
    if (!canvas || streamUrl) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let frame = 0;

    const drawSimulatedCctv = () => {
      frame++;
      const w = canvas.width;
      const h = canvas.height;

      // Dark colliery incline shaft background
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#030c14");
      grad.addColorStop(0.5, "#081b29");
      grad.addColorStop(1, "#03080e");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Perspective mine tunnel arches
      ctx.strokeStyle = "rgba(14, 165, 233, 0.12)";
      ctx.lineWidth = 1.5;

      const vanishingX = w * 0.5;
      const vanishingY = h * 0.42;

      // Tunnel steel arch ribs
      for (let i = 1; i <= 5; i++) {
        const scale = i / 5;
        const archW = w * 0.45 * scale;
        const archH = h * 0.55 * scale;
        const archX = vanishingX - archW / 2;
        const archY = vanishingY + (h - vanishingY) * (1 - scale);

        ctx.beginPath();
        ctx.moveTo(archX, h);
        ctx.lineTo(archX, archY + archH * 0.3);
        ctx.bezierCurveTo(
          archX,
          archY,
          archX + archW,
          archY,
          archX + archW,
          archY + archH * 0.3
        );
        ctx.lineTo(archX + archW, h);
        ctx.stroke();
      }

      // Mine rails
      ctx.strokeStyle = "rgba(148, 163, 184, 0.18)";
      ctx.beginPath();
      ctx.moveTo(vanishingX - 20, vanishingY + 30);
      ctx.lineTo(w * 0.25, h);
      ctx.moveTo(vanishingX + 20, vanishingY + 30);
      ctx.lineTo(w * 0.75, h);
      ctx.stroke();

      // Simulated turnstile gate barrier silhouette
      ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
      ctx.fillRect(w * 0.22, h * 0.55, w * 0.56, h * 0.45);
      ctx.strokeStyle = "rgba(56, 189, 248, 0.25)";
      ctx.strokeRect(w * 0.22, h * 0.55, w * 0.56, h * 0.45);

      // Subtle dynamic noise grain
      const noiseData = ctx.createImageData(w, h);
      const data = noiseData.data;
      for (let i = 0; i < data.length; i += 32) {
        const val = Math.random() * 25;
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
        data[i + 3] = 12;
      }
      ctx.putImageData(noiseData, 0, 0);

      animId = requestAnimationFrame(drawSimulatedCctv);
    };

    animId = requestAnimationFrame(drawSimulatedCctv);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [streamUrl]);

  return (
    <div
      className={cn(
        "relative aspect-video w-full bg-surface-container-lowest rounded overflow-hidden border border-outline-variant/50 select-none shadow-xl",
        className
      )}
    >
      {/* Underlying Video or Simulated Canvas Feed */}
      {streamUrl ? (
        <video
          ref={videoRef}
          src={streamUrl}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        <canvas
          ref={simCanvasRef}
          width={640}
          height={360}
          className="w-full h-full object-cover"
        />
      )}

      {/* Children: HTML5 Canvas HUD Overlays */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {children}
      </div>

      {/* Top Telemetry Header Bar Overlay */}
      <div className="absolute top-0 inset-x-0 p-2.5 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between text-[11px] font-telemetry z-20 pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-emerald-400 font-bold bg-black/50 px-1.5 py-0.5 rounded border border-emerald-500/30">
            <Radio className="w-3 h-3 animate-pulse text-rose-500" />
            <span className="text-[10px]">REC // LIVE</span>
          </div>
          <span className="text-on-surface font-semibold tracking-wide">
            {feedName}
          </span>
          <span className="text-outline text-[10px]">({location})</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] text-outline font-mono">
            RES: {resolution}
          </span>
          <span className="text-[10px] text-outline font-mono">
            FPS: {fps}
          </span>
          <div className="flex items-center gap-1 text-emerald-400">
            {status === "ONLINE" ? (
              <Wifi className="w-3 h-3 text-emerald-400" />
            ) : (
              <WifiOff className="w-3 h-3 text-rose-400" />
            )}
            <span className="font-mono text-[10px]">{latencyMs.toFixed(1)} ms</span>
          </div>
        </div>
      </div>

      {/* Bottom Telemetry Timestamp & Codec Bar */}
      <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between text-[10px] font-telemetry text-outline z-20 pointer-events-none">
        <div className="flex items-center gap-2">
          <Camera className="w-3 h-3 text-primary" />
          <span className="font-mono text-on-surface">IST: {timeString}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>H.264 // RTSP OVER WEBSOCKET GATEWAY</span>
        </div>
      </div>
    </div>
  );
};

export default WebRTCPlayer;
