"""Industrial Gas Telemetry Ingestion & Statutory Interlock Tests

Validates multi-reading batch ingestion into TimescaleDB and verifies Coal Mines
Regulations (CMR 2017) statutory thresholds for Methane (CH4) and Carbon Monoxide (CO).
"""

from datetime import datetime, timezone
import uuid
import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.redis import _published_alerts_history
from app.models.location import LocationType, MineLocation
from app.models.telemetry import CommunicationProtocol, DeviceType, HardwareRegistry


@pytest_asyncio.fixture(scope="function")
async def gas_sensor_fixture(db_session: AsyncSession):
    """Creates a registered multi-gas sensor node in an underground seam."""
    loc = MineLocation(
        id=uuid.uuid4(),
        location_name="Seam III East Longwall Face",
        location_type=LocationType.UNDERGROUND_SEAM.value,
    )
    db_session.add(loc)

    sensor = HardwareRegistry(
        id=uuid.uuid4(),
        device_name="MULTI-GAS-NODE-101",
        device_type=DeviceType.GAS_SENSOR_CH4.value,
        location_id=loc.id,
        protocol=CommunicationProtocol.MODBUS.value,
        is_online=True,
    )
    db_session.add(sensor)
    await db_session.commit()
    return sensor


@pytest.mark.asyncio
async def test_ingest_normal_environmental_gas_readings(client: AsyncClient, gas_sensor_fixture: HardwareRegistry):
    """Verifies baseline safe readings are ingested without triggering alerts."""
    _published_alerts_history.clear()
    now_iso = datetime.now(timezone.utc).isoformat()

    payload = {
        "hardware_id": str(gas_sensor_fixture.id),
        "timestamp": now_iso,
        "readings": [
            {"metric_type": "CH4_PERCENT", "value": 0.25},
            {"metric_type": "CO_PPM", "value": 12.0},
            {"metric_type": "AIR_VELOCITY", "value": 2.1},
        ],
    }

    response = await client.post("/api/v1/telemetry/ingest/gas", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert data["status"] == "INGESTED"
    assert data["ingested_count"] == 3
    assert len(data["alerts_triggered"]) == 0
    assert data["critical_interlock_active"] is False

    # Verify no gas alerts dispatched over Redis
    gas_alerts = [a for a in _published_alerts_history if a["channel"] == "gas_alerts"]
    assert len(gas_alerts) == 0


@pytest.mark.asyncio
async def test_ingest_elevated_methane_triggers_warning_alert(client: AsyncClient, gas_sensor_fixture: HardwareRegistry):
    """Verifies CH4 >= 0.75% triggers WARNING_CH4_ELEVATED under CMR 2017 Reg 169(1)."""
    _published_alerts_history.clear()
    now_iso = datetime.now(timezone.utc).isoformat()

    payload = {
        "hardware_id": str(gas_sensor_fixture.id),
        "timestamp": now_iso,
        "readings": [
            {"metric_type": "CH4_PERCENT", "value": 0.82},
            {"metric_type": "CO_PPM", "value": 15.0},
        ],
    }

    response = await client.post("/api/v1/telemetry/ingest/gas", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert data["ingested_count"] == 2
    assert len(data["alerts_triggered"]) == 1
    assert data["critical_interlock_active"] is False

    alert = data["alerts_triggered"][0]
    assert alert["alert_type"] == "WARNING_CH4_ELEVATED"
    assert alert["severity"] == "WARNING"
    assert alert["value"] == 0.82
    assert "Regulation 169(1)" in alert["statutory_rule"]

    # Verify Redis broadcast
    gas_alerts = [a for a in _published_alerts_history if a["channel"] == "gas_alerts"]
    assert len(gas_alerts) == 1
    assert gas_alerts[0]["message"]["alert_type"] == "WARNING_CH4_ELEVATED"
    assert gas_alerts[0]["message"]["value"] == 0.82


@pytest.mark.asyncio
async def test_ingest_critical_methane_triggers_power_trip_interlock(client: AsyncClient, gas_sensor_fixture: HardwareRegistry):
    """Verifies CH4 >= 1.25% triggers CRITICAL_CH4_POWER_TRIP under CMR 2017 Reg 169(3)."""
    _published_alerts_history.clear()
    now_iso = datetime.now(timezone.utc).isoformat()

    payload = {
        "hardware_id": str(gas_sensor_fixture.id),
        "timestamp": now_iso,
        "readings": [
            {"metric_type": "CH4_PERCENT", "value": 1.35},
        ],
    }

    response = await client.post("/api/v1/telemetry/ingest/gas", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert len(data["alerts_triggered"]) == 1
    assert data["critical_interlock_active"] is True

    alert = data["alerts_triggered"][0]
    assert alert["alert_type"] == "CRITICAL_CH4_POWER_TRIP"
    assert alert["severity"] == "CRITICAL"
    assert alert["value"] == 1.35
    assert "Regulation 169(3)" in alert["statutory_rule"]
    assert "power isolation tripped" in alert["message"].lower()

    # Verify Redis broadcast includes trip signal
    gas_alerts = [a for a in _published_alerts_history if a["channel"] == "gas_alerts"]
    assert len(gas_alerts) == 1
    assert gas_alerts[0]["message"]["alert_type"] == "CRITICAL_CH4_POWER_TRIP"
    assert gas_alerts[0]["message"]["action"] == "POWER_TRIP_RELAY_SIGNAL"


@pytest.mark.asyncio
async def test_ingest_carbon_monoxide_spontaneous_heating_warning(client: AsyncClient, gas_sensor_fixture: HardwareRegistry):
    """Verifies CO >= 50 PPM triggers WARNING_CO_HEATING under CMR 2017 Reg 142."""
    _published_alerts_history.clear()
    now_iso = datetime.now(timezone.utc).isoformat()

    payload = {
        "hardware_id": str(gas_sensor_fixture.id),
        "timestamp": now_iso,
        "readings": [
            {"metric_type": "CO_PPM", "value": 62.5},
        ],
    }

    response = await client.post("/api/v1/telemetry/ingest/gas", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert len(data["alerts_triggered"]) == 1
    assert data["critical_interlock_active"] is False

    alert = data["alerts_triggered"][0]
    assert alert["alert_type"] == "WARNING_CO_HEATING"
    assert alert["severity"] == "WARNING"
    assert alert["value"] == 62.5
    assert "Regulation 142" in alert["statutory_rule"]
    assert "spontaneous heating" in alert["message"].lower()

    # Verify Redis broadcast
    gas_alerts = [a for a in _published_alerts_history if a["channel"] == "gas_alerts"]
    assert len(gas_alerts) == 1
    assert gas_alerts[0]["message"]["alert_type"] == "WARNING_CO_HEATING"


@pytest.mark.asyncio
async def test_get_latest_sensor_telemetry(client: AsyncClient, gas_sensor_fixture: HardwareRegistry):
    """Verifies querying persisted telemetry readings by device ID."""
    now_iso = datetime.now(timezone.utc).isoformat()
    payload = {
        "hardware_id": str(gas_sensor_fixture.id),
        "timestamp": now_iso,
        "readings": [
            {"metric_type": "CH4_PERCENT", "value": 0.45},
            {"metric_type": "CO_PPM", "value": 18.0},
        ],
    }
    await client.post("/api/v1/telemetry/ingest/gas", json=payload)

    # Query latest endpoint
    response = await client.get(f"/api/v1/telemetry/hardware/{gas_sensor_fixture.id}/latest?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert data["hardware_id"] == str(gas_sensor_fixture.id)
    assert data["count"] == 2
    assert len(data["readings"]) == 2


@pytest.mark.asyncio
async def test_ingest_telemetry_unknown_hardware_404(client: AsyncClient):
    """Verifies 404 response for batch telemetry sent from unregistered device ID."""
    now_iso = datetime.now(timezone.utc).isoformat()
    payload = {
        "hardware_id": str(uuid.uuid4()),
        "timestamp": now_iso,
        "readings": [
            {"metric_type": "CH4_PERCENT", "value": 0.20},
        ],
    }
    response = await client.post("/api/v1/telemetry/ingest/gas", json=payload)
    assert response.status_code == 404
    assert "not found in registry" in response.json()["detail"]
