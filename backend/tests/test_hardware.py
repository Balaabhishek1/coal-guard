"""Hardware Diagnostics & Edge Gateway Tests

Verifies hardware asset registration, heartbeat tracking, and control room status matrix.
"""

from datetime import datetime, timezone
import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.redis import _published_alerts_history
from app.models.location import LocationType, MineLocation
from app.models.telemetry import CommunicationProtocol, DeviceType, HardwareRegistry


@pytest.mark.asyncio
async def test_register_hardware_asset_success(client: AsyncClient, db_session: AsyncSession):
    """Verifies enrolling a new CCTV camera without location."""
    payload = {
        "device_name": "CAM-PITHEAD-01",
        "device_type": "CCTV_CAMERA",
        "ip_address": "192.168.1.101",
        "protocol": "RTSP",
    }
    response = await client.post("/api/v1/hardware/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["device_name"] == "CAM-PITHEAD-01"
    assert data["device_type"] == "CCTV_CAMERA"
    assert data["protocol"] == "RTSP"
    assert data["is_online"] is True
    assert "id" in data


@pytest.mark.asyncio
async def test_register_hardware_with_valid_location(client: AsyncClient, db_session: AsyncSession):
    """Verifies enrolling a turnstile linked to a spatial colliery location."""
    # Create test location
    loc = MineLocation(
        id=uuid.uuid4(),
        location_name="Shaft No. 1 Collar",
        location_type=LocationType.SHAFT_COLLAR.value,
    )
    db_session.add(loc)
    await db_session.commit()

    payload = {
        "device_name": "TURNSTILE-GATE-01",
        "device_type": "TURNSTILE",
        "location_id": str(loc.id),
        "ip_address": "192.168.1.50",
        "protocol": "WIEGAND",
    }
    response = await client.post("/api/v1/hardware/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["location_id"] == str(loc.id)


@pytest.mark.asyncio
async def test_register_hardware_with_invalid_location(client: AsyncClient):
    """Verifies 404 error when assigning device to a non-existent location UUID."""
    payload = {
        "device_name": "ORPHAN-SENSOR",
        "device_type": "GAS_SENSOR_CH4",
        "location_id": str(uuid.uuid4()),
        "protocol": "MODBUS",
    }
    response = await client.post("/api/v1/hardware/register", json=payload)
    assert response.status_code == 404
    assert "not found in spatial registry" in response.json()["detail"]


@pytest.mark.asyncio
async def test_hardware_heartbeat_online(client: AsyncClient, db_session: AsyncSession):
    """Verifies heartbeat ping updates online status and last_heartbeat timestamp."""
    hw = HardwareRegistry(
        id=uuid.uuid4(),
        device_name="NODE-TELEMETRY-SEAM1",
        device_type=DeviceType.GAS_SENSOR_CH4.value,
        protocol=CommunicationProtocol.MODBUS.value,
        is_online=False,
    )
    db_session.add(hw)
    await db_session.commit()

    heartbeat_payload = {
        "hardware_id": str(hw.id),
        "status": "ONLINE",
        "latency_ms": 14.2,
    }
    response = await client.post("/api/v1/hardware/heartbeat", json=heartbeat_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ACK"
    assert data["hardware_id"] == str(hw.id)
    assert data["is_online"] is True

    # Verify database persistence
    await db_session.refresh(hw)
    assert hw.is_online is True
    assert hw.last_heartbeat is not None


@pytest.mark.asyncio
async def test_hardware_heartbeat_offline_triggers_alert(client: AsyncClient, db_session: AsyncSession):
    """Verifies device dropping offline triggers an alert to the hardware_alerts Redis channel."""
    _published_alerts_history.clear()

    hw = HardwareRegistry(
        id=uuid.uuid4(),
        device_name="MONITOR-FAN-DRIFT",
        device_type=DeviceType.AIR_MONITOR.value,
        protocol=CommunicationProtocol.MODBUS.value,
        is_online=True,
    )
    db_session.add(hw)
    await db_session.commit()

    heartbeat_payload = {
        "hardware_id": str(hw.id),
        "status": "OFFLINE",
        "latency_ms": 0.0,
    }
    response = await client.post("/api/v1/hardware/heartbeat", json=heartbeat_payload)
    assert response.status_code == 200
    assert response.json()["is_online"] is False

    # Check that alert was recorded in history
    alerts = [a for a in _published_alerts_history if a["channel"] == "hardware_alerts"]
    assert len(alerts) >= 1
    assert alerts[-1]["message"]["alert_type"] == "HARDWARE_OFFLINE"
    assert alerts[-1]["message"]["device_name"] == "MONITOR-FAN-DRIFT"


@pytest.mark.asyncio
async def test_hardware_heartbeat_unknown_device_404(client: AsyncClient):
    """Verifies 404 response for unknown hardware device heartbeat."""
    response = await client.post(
        "/api/v1/hardware/heartbeat",
        json={"hardware_id": str(uuid.uuid4()), "status": "ONLINE"},
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_hardware_diagnostic_matrix(client: AsyncClient, db_session: AsyncSession):
    """Verifies live diagnostic matrix lists all assets and populates location details."""
    loc = MineLocation(
        id=uuid.uuid4(),
        location_name="Underground District 4 Seam",
        location_type=LocationType.UNDERGROUND_SEAM.value,
    )
    db_session.add(loc)

    hw1 = HardwareRegistry(
        id=uuid.uuid4(),
        device_name="CH4-PROBE-01",
        device_type=DeviceType.GAS_SENSOR_CH4.value,
        location_id=loc.id,
        protocol=CommunicationProtocol.MODBUS.value,
        is_online=True,
        last_heartbeat=datetime.now(timezone.utc),
    )
    hw2 = HardwareRegistry(
        id=uuid.uuid4(),
        device_name="CO-PROBE-01",
        device_type=DeviceType.GAS_SENSOR_CO.value,
        protocol=CommunicationProtocol.MODBUS.value,
        is_online=False,
    )
    db_session.add_all([hw1, hw2])
    await db_session.commit()

    response = await client.get("/api/v1/hardware/matrix")
    assert response.status_code == 200
    matrix = response.json()
    assert len(matrix) >= 2

    # Verify device 1 with location
    d1 = next((item for item in matrix if item["hardware_id"] == str(hw1.id)), None)
    assert d1 is not None
    assert d1["device_name"] == "CH4-PROBE-01"
    assert d1["location_name"] == "Underground District 4 Seam"
    assert d1["is_online"] is True

    # Verify device 2 without location
    d2 = next((item for item in matrix if item["hardware_id"] == str(hw2.id)), None)
    assert d2 is not None
    assert d2["location_name"] is None
    assert d2["is_online"] is False
