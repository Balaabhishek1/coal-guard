"""Control Room WebSocket Gateway

Provides full-duplex real-time streaming to the React Control Room HUD,
broadcasting pithead ingress attempts, gas alerts, hardware keep-alive states,
and statutory SLA escalations.
"""

from datetime import datetime, timezone
import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status

from app.core.ws_manager import MONITORED_CHANNELS, ws_manager

logger = logging.getLogger("coalguard.websocket")

router = APIRouter(prefix="/ws", tags=["Control Room WebSockets"])


@router.websocket("/control-room")
async def control_room_websocket_endpoint(websocket: WebSocket):
    """Full-duplex real-time stream for the React Control Room HUD.

    Dispatches:
    - GATE_ACCESS_ATTEMPT: Optical & RFID actuation logs from pithead turnstiles.
    - GAS_SPIKE_ALERT: Statutory threshold interlocks (CH4 trips, CO heating).
    - HARDWARE_OFFLINE: Telemetry disconnects and camera failures.
    - GOVERNANCE_ESCALATION: SLA deadline breaches and auto-escalations.
    """
    await ws_manager.connect(websocket)

    # Initial handshake frame
    welcome_message = {
        "event_type": "CONNECTED",
        "channel": "system",
        "data": {
            "message": "Subscribed to AI MineGuard Control Room Live Feed",
            "monitored_channels": MONITORED_CHANNELS,
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    await websocket.send_json(welcome_message)

    try:
        while True:
            raw_text = await websocket.receive_text()
            try:
                client_msg = json.loads(raw_text)
                msg_type = client_msg.get("type", "").upper()

                if msg_type == "PING":
                    await websocket.send_json(
                        {
                            "event_type": "PONG",
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                        }
                    )
                else:
                    logger.debug(f"[WS] Received client frame: {client_msg}")
            except json.JSONDecodeError:
                if raw_text.strip().upper() == "PING":
                    await websocket.send_json(
                        {
                            "event_type": "PONG",
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                        }
                    )

    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as exc:
        logger.debug(f"[WS] Connection error: {exc}")
        ws_manager.disconnect(websocket)


@router.get(
    "/stats",
    summary="WebSocket Gateway Health & Active Connections",
    status_code=status.HTTP_200_OK,
)
async def get_websocket_stats():
    """Returns active client connection count and monitored Redis Pub/Sub channels."""
    return {
        "active_clients": len(ws_manager.active_connections),
        "monitored_channels": MONITORED_CHANNELS,
        "listener_running": ws_manager._is_running,
    }
