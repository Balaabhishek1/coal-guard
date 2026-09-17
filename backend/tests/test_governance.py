"""Statutory Governance & Cryptographic Audit Ledger Tests

Validates safety violation lifecycle state transitions, automatic SLA computation,
and SHA-256 tamper-evident cryptographic hash chain integrity.
"""

from datetime import datetime, timezone
import uuid
import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.governance import AuditLedger, ComplianceViolation, ViolationStatus
from app.models.location import LocationType, MineLocation
from app.services.audit_service import HashChainService


@pytest_asyncio.fixture(scope="function")
async def location_fixture(db_session: AsyncSession):
    """Creates a registered underground colliery district."""
    loc = MineLocation(
        id=uuid.uuid4(),
        location_name="Panel 4 West Seam VII",
        location_type=LocationType.UNDERGROUND_SEAM.value,
    )
    db_session.add(loc)
    await db_session.commit()
    return loc


@pytest.mark.asyncio
async def test_create_violation_and_sla_deadline_assignment(client: AsyncClient, location_fixture: MineLocation):
    """Verifies creating a ticket assigns statutory SLA deadline (+2h for CRITICAL) and logs to audit ledger."""
    payload = {
        "location_id": str(location_fixture.id),
        "violation_type": "MISSING_SCSR",
        "title": "Miner observed without self-contained self-rescuer",
        "description": "Worker entered inbye without mandatory SCSR unit under CMR Reg 191.",
        "severity": "CRITICAL",
    }
    response = await client.post("/api/v1/governance/violations", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert data["severity"] == "CRITICAL"
    assert data["status"] == "DETECTED"
    assert data["location_name"] == "Panel 4 West Seam VII"
    assert data["deadline_sla"] is not None

    # Check SLA is ~2 hours in the future
    created_dt = datetime.fromisoformat(data["created_at"])
    deadline_dt = datetime.fromisoformat(data["deadline_sla"])
    delta_hours = (deadline_dt - created_dt).total_seconds() / 3600.0
    assert 1.9 <= delta_hours <= 2.1

    # Verify audit ledger has entry
    audit_res = await client.get("/api/v1/governance/audit-ledger")
    assert audit_res.status_code == 200
    ledger = audit_res.json()
    assert len(ledger) >= 1
    latest_block = ledger[0]
    assert latest_block["action_type"] == "VIOLATION_CREATED"
    assert latest_block["payload"]["violation_type"] == "MISSING_SCSR"
    assert len(latest_block["current_hash"]) == 64


@pytest.mark.asyncio
async def test_remediation_state_machine_linear_progression(client: AsyncClient, location_fixture: MineLocation):
    """Verifies sequential state machine transitions: DETECTED -> NOTICE_SERVED -> ACTION_TAKEN -> VERIFIED -> STATUTORY_CLOSEOUT."""
    # 1. Create ticket
    create_res = await client.post(
        "/api/v1/governance/violations",
        json={
            "location_id": str(location_fixture.id),
            "violation_type": "ROOF_SUPPORT_DEFICIENCY",
            "title": "Excessive roof convergence detected by acoustic sensor",
            "severity": "HIGH",
        },
    )
    v_id = create_res.json()["id"]

    # 2. DETECTED -> NOTICE_SERVED
    t1 = await client.patch(
        f"/api/v1/governance/violations/{v_id}/status",
        json={"status": "NOTICE_SERVED", "remarks": "Statutory Form IV served to Overman"},
    )
    assert t1.status_code == 200
    assert t1.json()["status"] == "NOTICE_SERVED"

    # 3. NOTICE_SERVED -> ACTION_TAKEN
    t2 = await client.patch(
        f"/api/v1/governance/violations/{v_id}/status",
        json={"status": "ACTION_TAKEN", "remarks": "Hydraulic props and steel roof bolts installed"},
    )
    assert t2.status_code == 200
    assert t2.json()["status"] == "ACTION_TAKEN"

    # 4. ACTION_TAKEN -> VERIFIED
    t3 = await client.patch(
        f"/api/v1/governance/violations/{v_id}/status",
        json={"status": "VERIFIED", "remarks": "Safety Officer inspected convergence; certified safe"},
    )
    assert t3.status_code == 200
    assert t3.json()["status"] == "VERIFIED"

    # 5. VERIFIED -> STATUTORY_CLOSEOUT
    t4 = await client.patch(
        f"/api/v1/governance/violations/{v_id}/status",
        json={"status": "STATUTORY_CLOSEOUT", "remarks": "Colliery Manager countersigned close-out"},
    )
    assert t4.status_code == 200
    closeout_data = t4.json()
    assert closeout_data["status"] == "STATUTORY_CLOSEOUT"
    assert closeout_data["resolved_at"] is not None


@pytest.mark.asyncio
async def test_state_machine_rejects_illegal_skip_transition(client: AsyncClient, location_fixture: MineLocation):
    """Verifies that jumping from DETECTED directly to STATUTORY_CLOSEOUT is rejected with HTTP 400."""
    create_res = await client.post(
        "/api/v1/governance/violations",
        json={
            "location_id": str(location_fixture.id),
            "violation_type": "VENTILATION_DOOR_OPEN",
            "title": "Airway separation door unlatched",
            "severity": "MEDIUM",
        },
    )
    v_id = create_res.json()["id"]

    # Attempt illegal skip
    skip_res = await client.patch(
        f"/api/v1/governance/violations/{v_id}/status",
        json={"status": "STATUTORY_CLOSEOUT", "remarks": "Attempting illegal premature closeout"},
    )
    assert skip_res.status_code == 400
    assert "Statutory state transition denied" in skip_res.json()["detail"]


@pytest.mark.asyncio
async def test_audit_ledger_verification_passes_on_pristine_chain(client: AsyncClient, location_fixture: MineLocation):
    """Verifies that audit-ledger/verify confirms validity for all legitimate entries."""
    # Create several tickets and transitions
    for i in range(3):
        res = await client.post(
            "/api/v1/governance/violations",
            json={
                "location_id": str(location_fixture.id),
                "violation_type": f"TEST_ALERT_{i}",
                "title": f"Test Violation #{i}",
                "severity": "LOW",
            },
        )
        v_id = res.json()["id"]
        await client.patch(
            f"/api/v1/governance/violations/{v_id}/status",
            json={"status": "NOTICE_SERVED"},
        )

    verify_res = await client.get("/api/v1/governance/audit-ledger/verify")
    assert verify_res.status_code == 200
    data = verify_res.json()
    assert data["valid"] is True
    assert data["total_records"] >= 6
    assert data["broken_seq_id"] is None


@pytest.mark.asyncio
async def test_audit_ledger_detects_tampered_record(client: AsyncClient, db_session: AsyncSession, location_fixture: MineLocation):
    """Verifies that unauthorized SQL modification of a ledger entry breaks the verification chain."""
    # Create an initial ticket to generate ledger records
    res = await client.post(
        "/api/v1/governance/violations",
        json={
            "location_id": str(location_fixture.id),
            "violation_type": "TAMPER_PROBE",
            "title": "Original legitimate ticket",
            "severity": "MEDIUM",
        },
    )

    # Confirm chain is valid initially
    v_before = await HashChainService.verify_audit_integrity(db_session)
    assert v_before["valid"] is True

    # Maliciously modify the payload of the first record directly in the DB
    first_stmt = select(AuditLedger).order_by(AuditLedger.seq_id.asc()).limit(1)
    record = (await db_session.execute(first_stmt)).scalar_one()

    # Tamper with the payload content
    record.payload = {"tampered": True, "malicious_edit": "Cleared violation without authorization"}
    await db_session.commit()

    # Run integrity verification
    v_after = await HashChainService.verify_audit_integrity(db_session)
    assert v_after["valid"] is False
    assert v_after["broken_seq_id"] == record.seq_id
    assert "tampering detected" in v_after["reason"].lower()
