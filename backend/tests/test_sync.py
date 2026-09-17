"""Mobile Field Sync Engine Integration Tests

Validates idempotent batch ingestion of DGMS Form IV shift logs, ventilation and strata
safety interlocks (CH4 >= 1.25%, Airflow < 30 m/min, Roof Bolt Torque < 100 Nm),
cryptographic ledger anchoring, and inspection retrieval.
"""

from datetime import datetime, timezone
import uuid
import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.governance import AuditLedger, ComplianceViolation, ViolationSeverity
from app.models.location import LocationType, MineLocation
from app.models.sync_log import FormIVInspection, SyncLog, SyncStatus


@pytest_asyncio.fixture(scope="function")
async def location_fixture(db_session: AsyncSession):
    """Creates a registered underground extraction district."""
    loc = MineLocation(
        id=uuid.uuid4(),
        location_name="Panel 3 East Seam V Longwall",
        location_type=LocationType.UNDERGROUND_SEAM.value,
    )
    db_session.add(loc)
    await db_session.commit()
    return loc


@pytest.mark.asyncio
async def test_idempotent_batch_sync_first_time(
    client: AsyncClient,
    db_session: AsyncSession,
    seed_data: dict,
    location_fixture: MineLocation,
):
    """Verifies that an offline batch of Form IV entries is persisted cleanly on first submission."""
    overman = seed_data["overman"]
    sync_id = uuid.uuid4()
    now_iso = datetime.now(timezone.utc).isoformat()

    payload = {
        "sync_id": str(sync_id),
        "device_id": "EXPLOSIONPROOF-TABLET-EX-01",
        "checklists": [
            {
                "location_id": str(location_fixture.id),
                "roof_bolt_torque_nm": 120.0,
                "air_velocity_m_per_min": 35.0,
                "gas_ch4_percent": 0.15,
                "gas_co_ppm": 2.0,
                "strata_remarks": "No roof sag or floor heaving detected.",
                "is_geotagged_nfc": True,
                "inspection_time": now_iso,
            },
            {
                "location_id": str(location_fixture.id),
                "roof_bolt_torque_nm": 110.0,
                "air_velocity_m_per_min": 40.0,
                "gas_ch4_percent": 0.20,
                "gas_co_ppm": 3.0,
                "strata_remarks": "Support line #4 reinforced with resin capsules.",
                "is_geotagged_nfc": False,
                "inspection_time": now_iso,
            },
        ],
    }

    response = await client.post(
        "/api/v1/sync/batch",
        json=payload,
        params={"inspector_id": str(overman.id)},
    )
    assert response.status_code == 200
    data = response.json()

    assert data["sync_id"] == str(sync_id)
    assert data["status"] == "COMPLETED"
    assert data["records_processed"] == 2
    assert data["violations_created"] == 0

    # Verify SyncLog status
    sync_stmt = select(SyncLog).where(SyncLog.sync_id == sync_id)
    sync_res = await db_session.execute(sync_stmt)
    sync_entry = sync_res.scalar_one_or_none()

    assert sync_entry is not None
    assert sync_entry.status == SyncStatus.SUCCESS.value
    assert sync_entry.records_processed == 2

    # Verify FormIVInspection rows
    insp_stmt = select(FormIVInspection).where(FormIVInspection.sync_id == sync_id)
    insp_res = await db_session.execute(insp_stmt)
    inspections = insp_res.scalars().all()
    assert len(inspections) == 2

    # Verify AuditLedger recorded the sync
    audit_stmt = (
        select(AuditLedger)
        .where(AuditLedger.action_type == "MOBILE_OFFLINE_SYNC")
        .order_by(AuditLedger.seq_id.desc())
        .limit(1)
    )
    audit_res = await db_session.execute(audit_stmt)
    audit_entry = audit_res.scalar_one_or_none()
    assert audit_entry is not None
    assert audit_entry.payload["sync_id"] == str(sync_id)


@pytest.mark.asyncio
async def test_duplicate_sync_id_returns_idempotent_ack_without_reinserting(
    client: AsyncClient,
    db_session: AsyncSession,
    seed_data: dict,
    location_fixture: MineLocation,
):
    """Verifies that re-submitting the same batch returns DUPLICATE_ACKNOWLEDGED and inserts zero new rows."""
    overman = seed_data["overman"]
    sync_id = uuid.uuid4()
    now_iso = datetime.now(timezone.utc).isoformat()

    payload = {
        "sync_id": str(sync_id),
        "device_id": "EXPLOSIONPROOF-TABLET-EX-01",
        "checklists": [
            {
                "location_id": str(location_fixture.id),
                "roof_bolt_torque_nm": 130.0,
                "air_velocity_m_per_min": 45.0,
                "gas_ch4_percent": 0.10,
                "gas_co_ppm": 1.0,
                "strata_remarks": "Stable face conditions.",
                "is_geotagged_nfc": True,
                "inspection_time": now_iso,
            }
        ],
    }

    # Initial successful submission
    res1 = await client.post("/api/v1/sync/batch", json=payload, params={"inspector_id": str(overman.id)})
    assert res1.status_code == 200
    assert res1.json()["status"] == "COMPLETED"

    # Second submission with identical sync_id
    res2 = await client.post("/api/v1/sync/batch", json=payload, params={"inspector_id": str(overman.id)})
    assert res2.status_code == 200
    data2 = res2.json()

    assert data2["sync_id"] == str(sync_id)
    assert data2["status"] == "DUPLICATE_ACKNOWLEDGED"
    assert data2["records_processed"] == 1

    # Ensure exactly 1 inspection row exists (no duplicate)
    insp_stmt = select(FormIVInspection).where(FormIVInspection.sync_id == sync_id)
    insp_res = await db_session.execute(insp_stmt)
    inspections = insp_res.scalars().all()
    assert len(inspections) == 1


@pytest.mark.asyncio
async def test_hazardous_methane_inspection_triggers_statutory_violation(
    client: AsyncClient,
    db_session: AsyncSession,
    seed_data: dict,
    location_fixture: MineLocation,
):
    """Verifies that a Form IV reading with CH4 >= 1.25% automatically triggers a CRITICAL statutory violation."""
    overman = seed_data["overman"]
    sync_id = uuid.uuid4()

    payload = {
        "sync_id": str(sync_id),
        "device_id": "EXPLOSIONPROOF-TABLET-EX-02",
        "checklists": [
            {
                "location_id": str(location_fixture.id),
                "roof_bolt_torque_nm": 125.0,
                "air_velocity_m_per_min": 32.0,
                "gas_ch4_percent": 1.48,  # > 1.25% Statutory trip limit
                "gas_co_ppm": 5.0,
                "strata_remarks": "Methane accumulation at face roof cavity.",
                "is_geotagged_nfc": True,
                "inspection_time": datetime.now(timezone.utc).isoformat(),
            }
        ],
    }

    response = await client.post("/api/v1/sync/batch", json=payload, params={"inspector_id": str(overman.id)})
    assert response.status_code == 200
    data = response.json()

    assert data["violations_created"] >= 1

    # Verify created violation ticket
    v_stmt = (
        select(ComplianceViolation)
        .where(ComplianceViolation.location_id == location_fixture.id)
        .where(ComplianceViolation.violation_type == "UNDERGROUND_VENTILATION_DEFECT")
    )
    v_res = await db_session.execute(v_stmt)
    violation = v_res.scalar_one_or_none()

    assert violation is not None
    assert violation.severity == ViolationSeverity.CRITICAL.value
    assert "1.48% CH4" in violation.title


@pytest.mark.asyncio
async def test_sub_standard_air_velocity_triggers_violation(
    client: AsyncClient,
    db_session: AsyncSession,
    seed_data: dict,
    location_fixture: MineLocation,
):
    """Verifies that air velocity < 30 m/min triggers a HIGH severity airflow violation under CMR 2017 Reg 153."""
    overman = seed_data["overman"]
    sync_id = uuid.uuid4()

    payload = {
        "sync_id": str(sync_id),
        "device_id": "EXPLOSIONPROOF-TABLET-EX-03",
        "checklists": [
            {
                "location_id": str(location_fixture.id),
                "roof_bolt_torque_nm": 115.0,
                "air_velocity_m_per_min": 18.5,  # < 30 m/min statutory limit
                "gas_ch4_percent": 0.12,
                "gas_co_ppm": 2.0,
                "strata_remarks": "Sluggish ventilation reported at blind heading.",
                "is_geotagged_nfc": True,
                "inspection_time": datetime.now(timezone.utc).isoformat(),
            }
        ],
    }

    response = await client.post("/api/v1/sync/batch", json=payload, params={"inspector_id": str(overman.id)})
    assert response.status_code == 200
    data = response.json()

    assert data["violations_created"] >= 1

    v_stmt = (
        select(ComplianceViolation)
        .where(ComplianceViolation.location_id == location_fixture.id)
        .where(ComplianceViolation.violation_type == "INADEQUATE_VENTILATION_AIRFLOW")
    )
    v_res = await db_session.execute(v_stmt)
    violation = v_res.scalar_one_or_none()

    assert violation is not None
    assert violation.severity == ViolationSeverity.HIGH.value


@pytest.mark.asyncio
async def test_under_torqued_roof_bolt_triggers_violation(
    client: AsyncClient,
    db_session: AsyncSession,
    seed_data: dict,
    location_fixture: MineLocation,
):
    """Verifies that roof bolt torque < 100 Nm triggers a HIGH severity strata support violation."""
    overman = seed_data["overman"]
    sync_id = uuid.uuid4()

    payload = {
        "sync_id": str(sync_id),
        "device_id": "EXPLOSIONPROOF-TABLET-EX-04",
        "checklists": [
            {
                "location_id": str(location_fixture.id),
                "roof_bolt_torque_nm": 65.0,  # < 100 Nm minimum
                "air_velocity_m_per_min": 38.0,
                "gas_ch4_percent": 0.08,
                "gas_co_ppm": 1.0,
                "strata_remarks": "Bolt failed torque test; resin encapsulation suspected defective.",
                "is_geotagged_nfc": True,
                "inspection_time": datetime.now(timezone.utc).isoformat(),
            }
        ],
    }

    response = await client.post("/api/v1/sync/batch", json=payload, params={"inspector_id": str(overman.id)})
    assert response.status_code == 200
    data = response.json()

    assert data["violations_created"] >= 1

    v_stmt = (
        select(ComplianceViolation)
        .where(ComplianceViolation.location_id == location_fixture.id)
        .where(ComplianceViolation.violation_type == "ROOF_SUPPORT_DEFECT")
    )
    v_res = await db_session.execute(v_stmt)
    violation = v_res.scalar_one_or_none()

    assert violation is not None
    assert violation.severity == ViolationSeverity.HIGH.value


@pytest.mark.asyncio
async def test_sync_batch_with_invalid_location_fails(
    client: AsyncClient,
    seed_data: dict,
):
    """Verifies that referencing a non-existent MineLocation returns HTTP 400 Bad Request."""
    overman = seed_data["overman"]
    payload = {
        "sync_id": str(uuid.uuid4()),
        "device_id": "EXPLOSIONPROOF-TABLET-EX-05",
        "checklists": [
            {
                "location_id": str(uuid.uuid4()),  # Non-existent location
                "inspection_time": datetime.now(timezone.utc).isoformat(),
            }
        ],
    }
    response = await client.post("/api/v1/sync/batch", json=payload, params={"inspector_id": str(overman.id)})
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_list_inspections_endpoint(
    client: AsyncClient,
    seed_data: dict,
    location_fixture: MineLocation,
):
    """Verifies querying synchronized Form IV inspection records via GET /api/v1/sync/inspections."""
    overman = seed_data["overman"]
    sync_id = uuid.uuid4()

    payload = {
        "sync_id": str(sync_id),
        "device_id": "TABLET-QUERY-01",
        "checklists": [
            {
                "location_id": str(location_fixture.id),
                "roof_bolt_torque_nm": 115.0,
                "air_velocity_m_per_min": 35.0,
                "gas_ch4_percent": 0.15,
                "strata_remarks": "Query inspection verification test.",
                "inspection_time": datetime.now(timezone.utc).isoformat(),
            }
        ],
    }
    await client.post("/api/v1/sync/batch", json=payload, params={"inspector_id": str(overman.id)})

    response = await client.get("/api/v1/sync/inspections", params={"location_id": str(location_fixture.id)})
    assert response.status_code == 200
    inspections = response.json()
    assert len(inspections) >= 1
    assert inspections[0]["sync_id"] == str(sync_id)
