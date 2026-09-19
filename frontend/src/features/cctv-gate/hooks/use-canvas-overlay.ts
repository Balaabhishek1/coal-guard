import { useEffect, useRef } from "react";
import type { BoundingBox } from "@/types/vision-edge";

interface UseCanvasOverlayOptions {
  boundingBoxes: BoundingBox[];
  opticalCompliance?: boolean;
  gateActuated?: boolean;
  isActive?: boolean;
}

export function useCanvasOverlay(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  options: UseCanvasOverlayOptions
) {
  const {
    boundingBoxes,
    opticalCompliance = true,
    gateActuated = true,
    isActive = true,
  } = options;

  const boxesRef = useRef<BoundingBox[]>(boundingBoxes);
  const complianceRef = useRef<boolean>(opticalCompliance);
  const actuatedRef = useRef<boolean>(gateActuated);
  const animFrameIdRef = useRef<number | null>(null);

  // Synchronize latest values without breaking animation frame loop
  useEffect(() => {
    boxesRef.current = boundingBoxes;
    complianceRef.current = opticalCompliance;
    actuatedRef.current = gateActuated;
  }, [boundingBoxes, opticalCompliance, gateActuated]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isActive) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let scanlineOffset = 0;

    const render = () => {
      // Clear previous canvas frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;

      // Draw subtle telemetry crosshair in center
      ctx.strokeStyle = "rgba(148, 163, 184, 0.15)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(width / 2 - 15, height / 2);
      ctx.lineTo(width / 2 + 15, height / 2);
      ctx.moveTo(width / 2, height / 2 - 15);
      ctx.lineTo(width / 2, height / 2 + 15);
      ctx.stroke();

      // Subtle animated scanline
      scanlineOffset = (scanlineOffset + 1.2) % height;
      ctx.fillStyle = "rgba(14, 165, 233, 0.03)";
      ctx.fillRect(0, scanlineOffset, width, 4);

      // Render each detected bounding box
      const boxes = boxesRef.current;
      boxes.forEach((box) => {
        // Convert normalized coordinates (0..1) to canvas pixels
        const bx = box.x <= 1 ? box.x * width : box.x;
        const by = box.y <= 1 ? box.y * height : box.y;
        const bw = box.w <= 1 ? box.w * width : box.w;
        const bh = box.h <= 1 ? box.h * height : box.h;

        const isViolation =
          box.class_name.includes("missing") ||
          box.class_name.includes("bare") ||
          box.class_name.includes("unauthorized") ||
          !complianceRef.current;

        const mainColor = isViolation ? "#f43f5e" : "#10b981";
        const fillColor = isViolation
          ? "rgba(244, 63, 94, 0.12)"
          : "rgba(16, 185, 129, 0.08)";

        // Semi-transparent box background
        ctx.fillStyle = fillColor;
        ctx.fillRect(bx, by, bw, bh);

        // Corner bracket drawing (Length = 12px or 25% of dimension)
        const cornerLen = Math.min(14, Math.min(bw, bh) / 3);
        ctx.strokeStyle = mainColor;
        ctx.lineWidth = 2;
        ctx.lineCap = "square";

        // Top-Left
        ctx.beginPath();
        ctx.moveTo(bx, by + cornerLen);
        ctx.lineTo(bx, by);
        ctx.lineTo(bx + cornerLen, by);
        ctx.stroke();

        // Top-Right
        ctx.beginPath();
        ctx.moveTo(bx + bw - cornerLen, by);
        ctx.lineTo(bx + bw, by);
        ctx.lineTo(bx + bw, by + cornerLen);
        ctx.stroke();

        // Bottom-Left
        ctx.beginPath();
        ctx.moveTo(bx, by + bh - cornerLen);
        ctx.lineTo(bx, by + bh);
        ctx.lineTo(bx + cornerLen, by + bh);
        ctx.stroke();

        // Bottom-Right
        ctx.beginPath();
        ctx.moveTo(bx + bw - cornerLen, by + bh);
        ctx.lineTo(bx + bw, by + bh);
        ctx.lineTo(bx + bw, by + bh - cornerLen);
        ctx.stroke();

        // Label Badge Tag Above Box
        const confidencePct = Math.round(box.confidence * 100);
        const formattedLabel = `${box.class_name.replace(/_/g, " ").toUpperCase()} ${confidencePct}%`;

        ctx.font = "bold 10px JetBrains Mono, monospace";
        const textMetrics = ctx.measureText(formattedLabel);
        const textWidth = textMetrics.width;
        const tagHeight = 16;
        const tagY = Math.max(0, by - tagHeight - 2);

        // Badge Background
        ctx.fillStyle = isViolation ? "rgba(225, 29, 72, 0.9)" : "rgba(5, 150, 105, 0.9)";
        ctx.fillRect(bx, tagY, textWidth + 10, tagHeight);

        // Badge Text
        ctx.fillStyle = "#ffffff";
        ctx.textBaseline = "middle";
        ctx.fillText(formattedLabel, bx + 5, tagY + tagHeight / 2);
      });

      // Watermark HUD corner header
      ctx.font = "9px JetBrains Mono, monospace";
      ctx.fillStyle = "rgba(148, 163, 184, 0.8)";
      ctx.textBaseline = "top";
      ctx.fillText("AI OPTICAL PPE ENGINE // 60 FPS", 12, 12);

      // Actuation watermark in top right
      const actuationText = actuatedRef.current
        ? "TURNSTILE: UNLOCKED"
        : "TURNSTILE: INTERLOCK HELD";
      const actuationColor = actuatedRef.current ? "#34d399" : "#fb7185";
      ctx.fillStyle = actuationColor;
      const actWidth = ctx.measureText(actuationText).width;
      ctx.fillText(actuationText, width - actWidth - 12, 12);

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [canvasRef, isActive]);
}

export default useCanvasOverlay;
