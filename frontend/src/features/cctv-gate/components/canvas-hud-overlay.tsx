import React, { useRef } from "react";
import { useCanvasOverlay } from "../hooks/use-canvas-overlay";
import type { BoundingBox } from "@/types/vision-edge";
import { cn } from "@/lib/utils";

interface CanvasHudOverlayProps {
  boundingBoxes: BoundingBox[];
  opticalCompliance?: boolean;
  gateActuated?: boolean;
  width?: number;
  height?: number;
  className?: string;
}

export const CanvasHudOverlay: React.FC<CanvasHudOverlayProps> = ({
  boundingBoxes,
  opticalCompliance = true,
  gateActuated = true,
  width = 640,
  height = 360,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useCanvasOverlay(canvasRef, {
    boundingBoxes,
    opticalCompliance,
    gateActuated,
    isActive: true,
  });

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={cn("w-full h-full absolute inset-0 pointer-events-none", className)}
    />
  );
};

export default CanvasHudOverlay;
