"""Control Room WebSocket Integration Tests

Tests WebSocket full-duplex connectivity, handshake initialization, bidirectional
PING/PONG heartbeats, active client tracking, and live broadcast delivery.
"""

import asyncio
from datetime import datetime, timezone
import json
import pytest
from httpx import AsyncClient
from starlette.testclient import TestClient

from app.core.ws_manager import ws_manager
from main import app


def test_control_room_websocket_handshake():
    """Verifies that connecting to /api/v1/ws/control-room yields CONNECTED handshake frame."""
    with TestClient(app) as test_client:
        with test_client.websocket_connect("/api/v1/ws/control-room") as ws:
            data = ws.receive_json()
            assert data["event_type"] == "CONNECTED"
            assert data["channel"] == "system"
            assert "Subscribed to AI MineGuard Control Room Live Feed" in data["data"]["message"]
            assert "monitored_channels" in data["data"]


def test_control_room_websocket_ping_pong():
    """Verifies that sending PING frame over WebSocket returns PONG."""
    with TestClient(app) as test_client:
        with test_client.websocket_connect("/api/v1/ws/control-room") as ws:
            # Consume initial handshake
            ws.receive_json()

            # Send PING as JSON
            ws.send_text(json.dumps({"type": "PING"}))
            reply = ws.receive_json()
            assert reply["event_type"] == "PONG"
            assert "timestamp" in reply

            # Send PING as plain string
            ws.send_text("PING")
            reply2 = ws.receive_json()
            assert reply2["event_type"] == "PONG"


def test_control_room_websocket_broadcast_delivery():
    """Verifies that multicast messages broadcasted via ws_manager reach active WebSocket clients."""
    with TestClient(app) as test_client:
        with test_client.websocket_connect("/api/v1/ws/control-room") as ws:
            # Consume handshake
            ws.receive_json()

            # Broadcast simulated alert
            test_alert = {
                "event_type": "GAS_SPIKE_ALERT",
                "channel": "gas_alerts",
                "data": {
                    "sensor_id": "SENSOR-CH4-01",
                    "reading_value": 1.45,
                    "unit": "%",
                    "statutory_action": "TRIP_POWER_ISOLATION",
                },
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }

            # Asynchronously broadcast
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                delivered = loop.run_until_complete(ws_manager.broadcast(test_alert))
                assert delivered >= 1
            finally:
                loop.close()

            # Verify received frame on client
            received = ws.receive_json()
            assert received["event_type"] == "GAS_SPIKE_ALERT"
            assert received["data"]["reading_value"] == 1.45


@pytest.mark.asyncio
async def test_websocket_stats_endpoint(client: AsyncClient):
    """Verifies GET /api/v1/ws/stats returns active client count and monitored channels."""
    response = await client.get("/api/v1/ws/stats")
    assert response.status_code == 200
    data = response.json()

    assert "active_clients" in data
    assert "monitored_channels" in data
    assert "gas_alerts" in data["monitored_channels"]
    assert "gate_events" in data["monitored_channels"]
    assert "hardware_alerts" in data["monitored_channels"]
    assert "governance_escalations" in data["monitored_channels"]
