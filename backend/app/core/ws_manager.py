"""Control Room WebSocket Connection Manager & Real-Time Event Multiplexer

Manages persistent WebSocket sessions with the React Control Room HUD and bridges
asynchronous Redis Pub/Sub channels (gas alerts, gate events, hardware diagnostics,
and governance escalations) directly into front-end live telemetry streams.
"""

import asyncio
from datetime import datetime, timezone
import json
import logging
from typing import Any, Dict, List, Optional, Set, Union
import uuid

from fastapi import WebSocket, WebSocketDisconnect

from app.core.config import settings
from app.core.redis import JSONEncoderWithDates, get_redis_client

logger = logging.getLogger("coalguard.websocket")

MONITORED_CHANNELS = [
    "gas_alerts",
    "gate_events",
    "hardware_alerts",
    "governance_escalations",
]


class ConnectionManager:
    """Thread-safe WebSocket session registry with multi-channel Redis listener."""

    def __init__(self) -> None:
        self.active_connections: List[WebSocket] = []
        self._listener_task: Optional[asyncio.Task] = None
        self._is_running: bool = False

    async def connect(self, websocket: WebSocket) -> None:
        """Accepts incoming WebSocket connection and registers client in pool."""
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(
            f"[WS] Client connected ({websocket.client}). Active connections: {len(self.active_connections)}"
        )

    def disconnect(self, websocket: WebSocket) -> None:
        """Unregisters disconnected WebSocket client from active pool."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(
                f"[WS] Client disconnected. Active connections remaining: {len(self.active_connections)}"
            )

    async def broadcast(self, message: Union[Dict[str, Any], str]) -> int:
        """Asynchronously multicasts JSON/text payload across all registered clients.

        Prunes broken connections transparently to prevent memory leaks.
        """
        if not self.active_connections:
            return 0

        if isinstance(message, dict):
            payload = json.dumps(message, cls=JSONEncoderWithDates)
        else:
            payload = str(message)

        dead_connections: List[WebSocket] = []
        delivered_count = 0

        for connection in list(self.active_connections):
            try:
                await connection.send_text(payload)
                delivered_count += 1
            except (WebSocketDisconnect, RuntimeError, Exception) as exc:
                logger.debug(f"[WS] Failed to send frame to client: {exc}")
                dead_connections.append(connection)

        # Prune disconnected clients
        for dead in dead_connections:
            self.disconnect(dead)

        return delivered_count

    async def subscribe_to_redis_channels(self) -> None:
        """Background coroutine subscribing to Redis Pub/Sub channels and multiplexing frames."""
        self._is_running = True
        backoff_seconds = 2

        while self._is_running:
            try:
                client = get_redis_client()
                pubsub = client.pubsub()
                await pubsub.subscribe(*MONITORED_CHANNELS)
                logger.info(f"[WS-REDIS] Subscribed to real-time channels: {', '.join(MONITORED_CHANNELS)}")
                backoff_seconds = 2  # Reset backoff on successful connection

                async for raw_message in pubsub.listen():
                    if not self._is_running:
                        break

                    if raw_message is None or raw_message.get("type") != "message":
                        continue

                    channel = raw_message.get("channel", "unknown")
                    raw_data = raw_message.get("data")

                    try:
                        if isinstance(raw_data, str):
                            data_dict = json.loads(raw_data)
                        elif isinstance(raw_data, bytes):
                            data_dict = json.loads(raw_data.decode("utf-8"))
                        else:
                            data_dict = raw_data
                    except Exception:
                        data_dict = {"raw": str(raw_data)}

                    # Build unified WSEventMessage envelope
                    ws_envelope = {
                        "event_type": data_dict.get("event_type", channel.upper()),
                        "channel": channel,
                        "data": data_dict.get("data", data_dict),
                        "timestamp": data_dict.get("timestamp", datetime.now(timezone.utc).isoformat()),
                    }

                    await self.broadcast(ws_envelope)

            except asyncio.CancelledError:
                logger.info("[WS-REDIS] Redis Pub/Sub listener task cancelled.")
                break
            except Exception as exc:
                if not self._is_running:
                    break
                logger.warning(
                    f"[WS-REDIS] Subscription loop error: {exc}. Retrying in {backoff_seconds}s..."
                )
                await asyncio.sleep(backoff_seconds)
                backoff_seconds = min(backoff_seconds * 2, 30)

    def start_redis_listener(self) -> Optional[asyncio.Task]:
        """Spawns background Redis Pub/Sub multiplexer task if not already running."""
        if self._listener_task is None or self._listener_task.done():
            self._listener_task = asyncio.create_task(self.subscribe_to_redis_channels())
            logger.info("[WS] Redis Pub/Sub listener background worker spawned.")
        return self._listener_task

    async def stop_redis_listener(self) -> None:
        """Cancels background Redis listener gracefully during application shutdown."""
        self._is_running = False
        if self._listener_task and not self._listener_task.done():
            self._listener_task.cancel()
            try:
                await self._listener_task
            except asyncio.CancelledError:
                pass
            self._listener_task = None
            logger.info("[WS] Redis Pub/Sub listener background worker stopped.")


# Singleton instance shared across application and endpoints
ws_manager = ConnectionManager()
