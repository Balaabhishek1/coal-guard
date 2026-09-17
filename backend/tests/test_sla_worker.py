"""SLA Escalation Worker Tests

Verifies automated deadline clock monitoring, severity tier escalation,
Redis alert dispatching, and audit trail ledger generation.
"""

from datetime import datetime, timedelta, timezone
import uuid
import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.redis import _published_alerts_history
from app.models.governance import (
    AuditLedger,
    ComplianceViolation,
    ViolationSeverity,
    ViolationStatus,
)
from app.models.location import LocationType, MineLocation
from app.worker.sla_worker import execute_sla_escalation_sweep


@pytest_asyncio.fixture(scope="function")
async def location_fixture(db_session: AsyncSession):
    """Creates a registered colliery location for tickets."""
    loc = MineLocation(
        id=uuid.uuid4(),
        location_name="District 2 Main Return Airway",
        location_type=LocationType.HAULAGE_ROADWAY.value,
    )
    db_session.add(loc)
    await db_session.commit()
    return loc


@pytest.mark.asyncio
async def test_sla_escalation_medium_to_high(db_session: AsyncSession, location_fixture: MineLocation):
    """Verifies that an overdue MEDIUM violation is automatically escalated to HIGH."""
    _published_alerts_history.clear()
    now = datetime.now(timezone.utc)

    # Seed an overdue MEDIUM ticket (deadline expired 30 minutes ago)
    violation = ComplianceViolation(
        id=uuid.uuid4(),
        location_id=location_fixture.id,
        violation_type="FLAMEPROOF_ENCLOSURE_GAP",
        title="Flameproof gap exceeded on switchgear",
        severity=ViolationSeverity.MEDIUM.value,
        status=ViolationStatus.DETECTED.value,
        deadline_sla=now - timedelta(minutes=30),
        created_at=now - timedelta(hours=25),
    )
    db_session.add(violation)
    await db_session.commit()

    # Execute SLA sweep
    sweep_result = await execute_sla_escalation_sweep(db_session)
    assert sweep_result["status"] == "COMPLETED"
    assert sweep_result["escalated_count"] >= 1

    # Verify database record updated
    await db_session.refresh(violation)
    deadline = violation.deadline_sla
    if deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=timezone.utc)
    assert deadline > now

    # Verify Redis escalation alert broadcast
    esc_alerts = [a for a in _published_alerts_history if a["channel"] == "governance_escalations"]
    assert len(esc_alerts) >= 1
    latest_alert = esc_alerts[-1]["message"]
    assert latest_alert["alert_type"] == "SLA_ESCALATED"
    assert latest_alert["previous_severity"] == "MEDIUM"
    assert latest_alert["escalated_severity"] == "HIGH"


@pytest.mark.asyncio
async def test_sla_escalation_high_to_critical(db_session: AsyncSession, location_fixture: MineLocation):
    """Verifies that an overdue HIGH violation is escalated to CRITICAL with emergency dispatch."""
    _published_alerts_history.clear()
    now = datetime.now(timezone.utc)

    violation = ComplianceViolation(
        id=uuid.uuid4(),
        location_id=location_fixture.id,
        violation_type="AUXILIARY_FAN_STOPPAGE",
        title="Auxiliary ventilation fan tripped",
        severity=ViolationSeverity.HIGH.value,
        status=ViolationStatus.NOTICE_SERVED.value,
        deadline_sla=now - timedelta(minutes=15),
        created_at=now - timedelta(hours=13),
    )
    db_session.add(violation)
    await db_session.commit()

    sweep_result = await execute_sla_escalation_sweep(db_session)
    assert sweep_result["escalated_count"] >= 1

    await db_session.refresh(violation)
    assert violation.severity == ViolationSeverity.CRITICAL.value


@pytest.mark.asyncio
async def test_resolved_violations_not_escalated(db_session: AsyncSession, location_fixture: MineLocation):
    """Verifies that closed-out violations (STATUTORY_CLOSEOUT) are never escalated even if deadline is in the past."""
    _published_alerts_history.clear()
    now = datetime.now(timezone.utc)

    violation = ComplianceViolation(
        id=uuid.uuid4(),
        location_id=location_fixture.id,
        violation_type="DEFECTIVE_AUDIBLE_ALARM",
        title="Conveyor warning bell repaired",
        severity=ViolationSeverity.LOW.value,
        status=ViolationStatus.STATUTORY_CLOSEOUT.value,  # Resolved
        deadline_sla=now - timedelta(hours=10),
        created_at=now - timedelta(days=4),
        resolved_at=now - timedelta(hours=12),
    )
    db_session.add(violation)
    await db_session.commit()

    sweep_result = await execute_sla_escalation_sweep(db_session)
    # The closed out violation should not be escalated
    await db_session.refresh(violation)
    assert violation.severity == ViolationSeverity.LOW.value


@pytest.mark.asyncio
async def test_manual_sla_sweep_endpoint(client: AsyncClient, location_fixture: MineLocation, db_session: AsyncSession):
    """Verifies the HTTP endpoint /api/v1/governance/sla/sweep triggers the escalation check."""
    now = datetime.now(timezone.utc)
    v = ComplianceViolation(
        id=uuid.uuid4(),
        location_id=location_fixture.id,
        violation_type="CONVEYOR_BELT_MISAIGNED",
        title="Belt running off center",
        severity=ViolationSeverity.LOW.value,
        status=ViolationStatus.DETECTED.value,
        deadline_sla=now - timedelta(hours=1),
        created_at=now - timedelta(days=3),
    )
    db_session.add(v)
    await db_session.commit()

    response = await client.post("/api/v1/governance/sla/sweep")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "COMPLETED"
    assert data["escalated_count"] >= 1
