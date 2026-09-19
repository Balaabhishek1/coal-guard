import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useControlRoomWS } from "./use-control-room-ws";
import { useGateStore } from "@/store/gate-store";

// Mock WebSocket
class MockWebSocket {
  static instances: MockWebSocket[] = [];
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  url: string;
  readyState: number = 0;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: ((err: any) => void) | null = null;
  send = vi.fn();
  close = vi.fn(() => {
    this.readyState = 3;
    this.onclose?.();
  });

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
    setTimeout(() => {
      this.readyState = 1;
      this.onopen?.();
    }, 10);
  }
}

describe("useControlRoomWS", () => {
  const originalWebSocket = global.WebSocket;

  beforeEach(() => {
    MockWebSocket.instances = [];
    // @ts-ignore
    global.WebSocket = MockWebSocket;
    useGateStore.setState({ wsConnected: false, recentEvents: [] });
  });

  afterEach(() => {
    global.WebSocket = originalWebSocket;
    vi.clearAllMocks();
  });

  it("initializes WebSocket connection and marks connected on open", async () => {
    const { result } = renderHook(() =>
      useControlRoomWS({ url: "ws://localhost:8000/test", autoConnect: true })
    );

    expect(MockWebSocket.instances.length).toBe(1);

    // Wait for connection simulation
    await vi.waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
  });

  it("dispatches GATE_ACCESS_ATTEMPT message to store", async () => {
    renderHook(() =>
      useControlRoomWS({ url: "ws://localhost:8000/test", autoConnect: true })
    );

    const ws = MockWebSocket.instances[0];

    await vi.waitFor(() => {
      expect(ws.readyState).toBe(WebSocket.OPEN);
    });

    const accessPayload = {
      event_type: "GATE_ACCESS_ATTEMPT",
      data: {
        rfid_tag: "RFID-TEST-01",
        location_id: "loc-01",
        worker_name: "Test Worker",
        optical_compliance: true,
        credential_eligibility: true,
        gate_actuated: true,
        wear_states: { hardhat_worn: true, vest_worn: true, scsr_worn: true },
        bounding_boxes: [],
      },
      timestamp: "2026-09-20T00:00:00Z",
    };

    act(() => {
      ws.onmessage?.({ data: JSON.stringify(accessPayload) });
    });

    expect(useGateStore.getState().latestAccessEvent?.rfid_tag).toBe(
      "RFID-TEST-01"
    );
  });

  it("sends ping frame over socket", async () => {
    const { result } = renderHook(() =>
      useControlRoomWS({ url: "ws://localhost:8000/test", autoConnect: true })
    );

    const ws = MockWebSocket.instances[0];

    await vi.waitFor(() => {
      expect(ws.readyState).toBe(WebSocket.OPEN);
    });

    act(() => {
      result.current.sendPing();
    });

    expect(ws.send).toHaveBeenCalledWith(JSON.stringify({ type: "PING" }));
  });
});
