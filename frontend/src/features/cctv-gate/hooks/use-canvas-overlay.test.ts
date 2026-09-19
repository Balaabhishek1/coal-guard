import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useCanvasOverlay } from "./use-canvas-overlay";
import type { BoundingBox } from "@/types/vision-edge";

describe("useCanvasOverlay", () => {
  let mockCtx: Record<string, any>;
  let mockCanvas: HTMLCanvasElement;

  beforeEach(() => {
    mockCtx = {
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      bezierCurveTo: vi.fn(),
      stroke: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn(() => ({ width: 50 })),
      strokeRect: vi.fn(),
    };

    mockCanvas = {
      width: 640,
      height: 360,
      getContext: vi.fn(() => mockCtx),
    } as unknown as HTMLCanvasElement;
  });

  it("calls canvas rendering loop on animation frame", async () => {
    const canvasRef = { current: mockCanvas };
    const boxes: BoundingBox[] = [
      {
        class_name: "hardhat_worn",
        confidence: 0.95,
        x: 0.2,
        y: 0.2,
        w: 0.1,
        h: 0.1,
      },
    ];

    const { unmount } = renderHook(() =>
      useCanvasOverlay(canvasRef, {
        boundingBoxes: boxes,
        opticalCompliance: true,
        gateActuated: true,
        isActive: true,
      })
    );

    // Wait for at least one frame execution
    await vi.waitFor(() => {
      expect(mockCtx.clearRect).toHaveBeenCalled();
    });

    expect(mockCtx.fillRect).toHaveBeenCalled();
    expect(mockCtx.stroke).toHaveBeenCalled();
    expect(mockCtx.fillText).toHaveBeenCalled();

    unmount();
  });
});
