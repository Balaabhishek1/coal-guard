"""Edge Vision Gateway Integration Tests

Validates post-turnstile optical compliance ingestion, automated statutory ticketing
under CMR 2017 (SCSR and PPE detection), cryptographic ledger anchoring, and access logging.
"""

from datetime import datetime, timezone
import uuid
import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.access_log import AccessAttemptLog
from app.models.governance import AuditLedger, ComplianceViolation, ViolationSeverity
from app.models.location import LocationType, MineLocation


@pytest_asyncio.fixture(scope="function")
async def location_fixture(db_session: AsyncSession):
    """Creates a registered underground colliery district."""
    loc = MineLocation(
        id=uuid.uuid4(),
        location_name="Pithead Shaft Gate #1",
        location_type=LocationType.SHAFT_COLLAR.value,
    )
    db_session.add(loc)
    await db_session.commit()
    return loc


@pytest.mark.asyncio
async def test_compliant_miner_access_event(
    client: AsyncClient,
    db_session: AsyncSession,
    seed_data: dict,
    location_fixture: MineLocation,
):
    """Verifies that a fully compliant worker passes turnstile and generates a clean access log without violations."""
    miner = seed_data["eligible_miner"]

    payload = {
        "rfid_tag": miner.rfid_tag,
        "location_id": str(location_fixture.id),
        "optical_compliance": True,
        "credential_eligibility": True,
        "gate_actuated": True,
        "wear_states": {
            "hardhat_worn": True,
            "vest_worn": True,
            "scsr_worn": True,
        },
        "snapshot_crop_url": "https://storage.mineguard.in/crops/pass_001.webp",
    }

    response = await client.post("/api/v1/vision-edge/events/access-attempt", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert data["status"] == "logged"
    assert data["violation_ticket_created"] is False
    assert data["violation_id"] is None
    assert "access_log_id" in data

    # Verify AccessAttemptLog in database
    log_id = uuid.UUID(data["access_log_id"])
    log_stmt = select(AccessAttemptLog).where(AccessAttemptLog.id == log_id)
    res = await db_session.execute(log_stmt)
    entry = res.scalar_one_or_none()

    assert entry is not None
    assert entry.user_id == miner.id
    assert entry.rfid_tag == miner.rfid_tag
    assert entry.optical_compliance is True
    assert entry.gate_actuated is True
    assert entry.wear_states["hardhat_worn"] is True

    # Verify AuditLedger recorded the ingress event
    audit_stmt = (
        select(AuditLedger)
        .where(AuditLedger.action_type == "GATE_ACCESS_ATTEMPT")
        .order_by(AuditLedger.seq_id.desc())
        .limit(1)
    )
    audit_res = await db_session.execute(audit_stmt)
    audit_entry = audit_res.scalar_one_or_none()
    assert audit_entry is not None
    assert audit_entry.actor_id == miner.id
    assert audit_entry.payload["gate_actuated"] is True
    assert audit_entry.payload["violation_created"] is False


@pytest.mark.asyncio
async def test_missing_ppe_optical_non_compliance_creates_violation(
    client: AsyncClient,
    db_session: AsyncSession,
    seed_data: dict,
    location_fixture: MineLocation,
):
    """Verifies that missing PPE (e.g. hardhat not worn) creates a HIGH severity violation linked to contractor."""
    miner = seed_data["eligible_miner"]
    contractor = seed_data["contractor"]

    payload = {
        "rfid_tag": miner.rfid_tag,
        "location_id": str(location_fixture.id),
        "optical_compliance": False,
        "credential_eligibility": True,
        "gate_actuated": False,
        "wear_states": {
            "hardhat_worn": False,
            "vest_worn": True,
            "scsr_worn": True,
        },
        "snapshot_crop_url": "https://storage.mineguard.in/crops/fail_hardhat.webp",
    }

    response = await client.post("/api/v1/vision-edge/events/access-attempt", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert data["status"] == "logged"
    assert data["violation_ticket_created"] is True
    assert data["violation_id"] is not None

    # Inspect created violation ticket
    viol_id = uuid.UUID(data["violation_id"])
    v_stmt = select(ComplianceViolation).where(ComplianceViolation.id == viol_id)
    v_res = await db_session.execute(v_stmt)
    violation = v_res.scalar_one_or_none()

    assert violation is not None
    assert violation.violation_type == "MISSING_PPE_AT_SHAFT"
    assert violation.severity == ViolationSeverity.HIGH.value
    assert violation.contractor_id == contractor.id
    assert "HARDHAT" in violation.description


@pytest.mark.asyncio
async def test_missing_scsr_creates_critical_violation(
    client: AsyncClient,
    db_session: AsyncSession,
    seed_data: dict,
    location_fixture: MineLocation,
):
    """Verifies that missing SCSR creates a CRITICAL statutory severity violation under CMR 2017."""
    miner = seed_data["eligible_miner"]

    payload = {
        "rfid_tag": miner.rfid_tag,
        "location_id": str(location_fixture.id),
        "optical_compliance": False,
        "credential_eligibility": True,
        "gate_actuated": False,
        "wear_states": {
            "hardhat_worn": True,
            "vest_worn": True,
            "scsr_worn": False,
        },
    }

    response = await client.post("/api/v1/vision-edge/events/access-attempt", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert data["violation_ticket_created"] is True
    viol_id = uuid.UUID(data["violation_id"])

    v_stmt = select(ComplianceViolation).where(ComplianceViolation.id == viol_id)
    v_res = await db_session.execute(v_stmt)
    violation = v_res.scalar_one_or_none()

    assert violation is not None
    assert violation.severity == ViolationSeverity.CRITICAL.value
    assert violation.violation_type == "MISSING_PPE_AT_SHAFT"


@pytest.mark.asyncio
async def test_gate_denied_triggers_unauthorized_entry_violation(
    client: AsyncClient,
    db_session: AsyncSession,
    seed_data: dict,
    location_fixture: MineLocation,
):
    """Verifies that when optical check passes but turnstile is locked, UNAUTHORIZED_ENTRY_ATTEMPT ticket is filed."""
    miner = seed_data["overtime_miner"]

    payload = {
        "rfid_tag": miner.rfid_tag,
        "location_id": str(location_fixture.id),
        "optical_compliance": True,
        "credential_eligibility": False,
        "gate_actuated": False,
        "wear_states": {
            "hardhat_worn": True,
            "vest_worn": True,
            "scsr_worn": True,
        },
    }

    response = await client.post("/api/v1/vision-edge/events/access-attempt", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert data["violation_ticket_created"] is True
    viol_id = uuid.UUID(data["violation_id"])

    v_stmt = select(ComplianceViolation).where(ComplianceViolation.id == viol_id)
    v_res = await db_session.execute(v_stmt)
    violation = v_res.scalar_one_or_none()

    assert violation is not None
    assert violation.violation_type == "UNAUTHORIZED_ENTRY_ATTEMPT"
    assert violation.severity == ViolationSeverity.HIGH.value


@pytest.mark.asyncio
async def test_unknown_rfid_access_handled(
    client: AsyncClient,
    db_session: AsyncSession,
    location_fixture: MineLocation,
):
    """Verifies that unassigned/ghost RFID tags are logged with user_id=None and generate an unauthorized ticket."""
    payload = {
        "rfid_tag": "RFID-GHOST-UNKNOWN-9999",
        "location_id": str(location_fixture.id),
        "optical_compliance": False,
        "credential_eligibility": False,
        "gate_actuated": False,
        "wear_states": {
            "hardhat_worn": False,
            "vest_worn": False,
            "scsr_worn": False,
        },
    }

    response = await client.post("/api/v1/vision-edge/events/access-attempt", json=payload)
    assert response.status_code == 201
    data = response.json()

    log_id = uuid.UUID(data["access_log_id"])
    stmt = select(AccessAttemptLog).where(AccessAttemptLog.id == log_id)
    res = await db_session.execute(stmt)
    entry = res.scalar_one_or_none()

    assert entry is not None
    assert entry.user_id is None
    assert entry.rfid_tag == "RFID-GHOST-UNKNOWN-9999"
    assert data["violation_ticket_created"] is True


@pytest.mark.asyncio
async def test_invalid_location_returns_404(client: AsyncClient):
    """Verifies that non-existent location ID returns HTTP 404."""
    payload = {
        "rfid_tag": "RFID-TEST-001",
        "location_id": str(uuid.uuid4()),
        "optical_compliance": True,
        "credential_eligibility": True,
        "gate_actuated": True,
        "wear_states": {
            "hardhat_worn": True,
            "vest_worn": True,
            "scsr_worn": True,
        },
    }
    response = await client.post("/api/v1/vision-edge/events/access-attempt", json=payload)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_list_access_logs_endpoint(
    client: AsyncClient,
    seed_data: dict,
    location_fixture: MineLocation,
):
    """Verifies querying recent access logs via GET /api/v1/vision-edge/logs."""
    miner = seed_data["eligible_miner"]

    # Post an access event
    payload = {
        "rfid_tag": miner.rfid_tag,
        "location_id": str(location_fixture.id),
        "optical_compliance": True,
        "credential_eligibility": True,
        "gate_actuated": True,
        "wear_states": {
            "hardhat_worn": True,
            "vest_worn": True,
            "scsr_worn": True,
        },
    }
    await client.post("/api/v1/vision-edge/events/access-attempt", json=payload)

    # List logs
    response = await client.get("/api/v1/vision-edge/logs", params={"rfid_tag": miner.rfid_tag})
    assert response.status_code == 200
    logs = response.json()
    assert len(logs) >= 1
    assert logs[0]["rfid_tag"] == miner.rfid_tag
