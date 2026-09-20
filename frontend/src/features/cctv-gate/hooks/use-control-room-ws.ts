import { useEffect, useRef, useState, useCallback } from "react";
import { useGateStore } from "@/store/gate-store";
import type {
  EdgeAccessEventPayload,
  LiveAlert,
  WSEventMessage,
} from "@/types/vision-edge";

export const getControlRoomWSUrl = (): string => {
  const envWsUrl = import.meta.env.VITE_WS_URL;
  if (!envWsUrl) {
    return "ws://localhost:8000/api/v1/ws/control-room";
  }
  if (envWsUrl.startsWith("ws://") || envWsUrl.startsWith("wss://")) {
    return `${envWsUrl}/control-room`;
  }
  if (typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}${envWsUrl}/control-room`;
  }
  return `ws://localhost:8000${envWsUrl}/control-room`;
};

export const DEFAULT_WS_URL = getControlRoomWSUrl();

interface UseControlRoomWSOptions {
  url?: string;
  autoConnect?: boolean;
}

export function useControlRoomWS(options: UseControlRoomWSOptions = {}) {
  const { url = DEFAULT_WS_URL, autoConnect = true } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WSEventMessage | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isUnmountedRef = useRef(false);

  const { addAccessEvent, addAlert, setWsConnected, simulateAccessAttempt } =
    useGateStore();

  const handleIncomingMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const payload: WSEventMessage = JSON.parse(event.data);
        setLastMessage(payload);

        switch (payload.event_type) {
          case "CONNECTED": {
            setIsConnected(true);
            setWsConnected(true);
            break;
          }

          case "PONG": {
            // Heartbeat acknowledged
            break;
          }

          case "GATE_ACCESS_ATTEMPT": {
            const accessData = payload.data as unknown as EdgeAccessEventPayload;
            if (accessData) {
              addAccessEvent(accessData);
            }
            break;
          }

          case "GAS_SPIKE_ALERT": {
            const alertData = payload.data as Record<string, any>;
            const liveAlert: LiveAlert = {
              id: `alert-gas-${Date.now()}`,
              event_type: "GAS_SPIKE_ALERT",
              severity: "CRITICAL",
              title: alertData.title || "ATMOSPHERIC STATUTORY TRIP LIMIT BREACH",
              message:
                alertData.message ||
                "Continuous telemetry sensor detected methane spike above statutory threshold.",
              statutory_rule: alertData.statutory_rule || "CMR 2017 Reg. 169(3)",
              timestamp: payload.timestamp || new Date().toISOString(),
              acknowledged: false,
            };
            addAlert(liveAlert);
            break;
          }

          case "HARDWARE_OFFLINE": {
            const alertData = payload.data as Record<string, any>;
            const liveAlert: LiveAlert = {
              id: `alert-hw-${Date.now()}`,
              event_type: "HARDWARE_OFFLINE",
              severity: "WARNING",
              title: "EDGE GATEWAY SENSOR TELEMETRY OFFLINE",
              message:
                alertData.message ||
                "Pithead camera heartbeat dropped. Modbus RTU bridge entering fallback arbitration.",
              statutory_rule: "CMR 2017 Continuous Telemetry Protocol",
              timestamp: payload.timestamp || new Date().toISOString(),
              acknowledged: false,
            };
            addAlert(liveAlert);
            break;
          }

          case "GOVERNANCE_ESCALATION": {
            const alertData = payload.data as Record<string, any>;
            const liveAlert: LiveAlert = {
              id: `alert-esc-${Date.now()}`,
              event_type: "GOVERNANCE_ESCALATION",
              severity: "WARNING",
              title: "SLA RECTIFICATION DEADLINE ESCALATION",
              message:
                alertData.message ||
                "Statutory hazard ticket unresolved past Level 2 deadline. Auto-escalating to Colliery Manager.",
              statutory_rule: "CMR 2017 Reg. 182 Statutory Overman Mandate",
              timestamp: payload.timestamp || new Date().toISOString(),
              acknowledged: false,
            };
            addAlert(liveAlert);
            break;
          }

          default:
            break;
        }
      } catch (err) {
        console.warn("[WS] Error parsing WebSocket incoming frame:", err);
      }
    },
    [addAccessEvent, addAlert, setWsConnected]
  );

  const connect = useCallback(() => {
    if (isUnmountedRef.current) return;
    if (
      socketRef.current &&
      (socketRef.current.readyState === WebSocket.OPEN ||
        socketRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    try {
      const ws = new WebSocket(url);
      socketRef.current = ws;

      ws.onopen = () => {
        if (isUnmountedRef.current) {
          ws.close();
          return;
        }
        setIsConnected(true);
        setWsConnected(true);
        reconnectAttemptsRef.current = 0;

        // Setup ping heartbeat every 20 seconds
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "PING" }));
          }
        }, 20000);
      };

      ws.onmessage = handleIncomingMessage;

      ws.onerror = (err) => {
        console.debug("[WS] Control room connection error:", err);
      };

      ws.onclose = () => {
        setIsConnected(false);
        setWsConnected(false);
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);

        if (!isUnmountedRef.current) {
          // Exponential backoff reconnect: 1s, 2s, 4s, 8s, 16s, max 30s
          const attempt = reconnectAttemptsRef.current;
          const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
          reconnectAttemptsRef.current += 1;

          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };
    } catch (err) {
      console.debug("[WS] WebSocket initialization failed:", err);
    }
  }, [url, handleIncomingMessage, setWsConnected]);

  const sendPing = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "PING" }));
    }
  }, []);

  const triggerSimulation = useCallback(
    (compliant: boolean, missingItem?: "scsr" | "hardhat" | "vest") => {
      return simulateAccessAttempt(compliant, missingItem);
    },
    [simulateAccessAttempt]
  );

  useEffect(() => {
    isUnmountedRef.current = false;
    if (autoConnect) {
      connect();
    }

    return () => {
      isUnmountedRef.current = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      setIsConnected(false);
      setWsConnected(false);
    };
  }, [autoConnect, connect, setWsConnected]);

  return {
    isConnected,
    lastMessage,
    sendPing,
    triggerSimulation,
    reconnect: connect,
  };
}

export default useControlRoomWS;
