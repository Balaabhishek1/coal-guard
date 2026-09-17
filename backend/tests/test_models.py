"""ORM Models & Database Schema Integrity Tests

Validates relationships, cascade rules, spatial models, and role definitions.
"""

from datetime import date
import uuid
import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.location import LocationType, MineLocation
from app.models.user import Contractor, User, UserRole, WorkerCredential


@pytest.mark.asyncio
async def test_mine_location_hierarchy(db_session: AsyncSession):
    """Verifies parent-child hierarchy in MineLocation (e.g. Seam -> District)."""
    parent_seam = MineLocation(
        id=uuid.uuid4(),
        location_name="Queen Seam No. 3",
        location_type=LocationType.UNDERGROUND_SEAM.value,
        rfid_beacon_id="BEACON-SEAM-03",
    )
    db_session.add(parent_seam)
    await db_session.flush()

    district = MineLocation(
        id=uuid.uuid4(),
        location_name="1st South Ventilation District",
        location_type=LocationType.VENTILATION_DISTRICT.value,
        rfid_beacon_id="BEACON-DIST-1S",
        parent_location_id=parent_seam.id,
    )
    db_session.add(district)
    await db_session.commit()

    # Query with children loaded
    stmt = (
        select(MineLocation)
        .where(MineLocation.id == parent_seam.id)
        .options(selectinload(MineLocation.children))
    )
    res = await db_session.execute(stmt)
    loaded_seam = res.scalar_one()

    assert len(loaded_seam.children) == 1
    assert loaded_seam.children[0].location_name == "1st South Ventilation District"


@pytest.mark.asyncio
async def test_user_credential_cascade_delete(db_session: AsyncSession):
    """Verifies that deleting a User cascades to delete their WorkerCredential."""
    test_user = User(
        id=uuid.uuid4(),
        username="temp_miner",
        full_name="Temporary Miner",
        hashed_password="hash",
        role=UserRole.MINER.value,
    )
    db_session.add(test_user)
    await db_session.flush()

    cred = WorkerCredential(
        id=uuid.uuid4(),
        user_id=test_user.id,
        vtc_training_expiry=date(2027, 1, 1),
        pme_medical_expiry=date(2027, 1, 1),
    )
    db_session.add(cred)
    await db_session.commit()

    # Delete user
    await db_session.delete(test_user)
    await db_session.commit()

    # Verify credential was deleted
    cred_stmt = select(WorkerCredential).where(WorkerCredential.id == cred.id)
    cred_res = await db_session.execute(cred_stmt)
    assert cred_res.scalar_one_or_none() is None


@pytest.mark.asyncio
async def test_contractor_workforce_relationship(db_session: AsyncSession):
    """Verifies 1:N relationship between Contractor and User workers."""
    contractor = Contractor(
        id=uuid.uuid4(),
        company_name="Deccan Mining Contractors",
        contract_code="CONT-DMC-01",
    )
    db_session.add(contractor)
    await db_session.flush()

    worker1 = User(
        id=uuid.uuid4(),
        username="dmc_worker1",
        full_name="DMC Worker 1",
        hashed_password="hash",
        contractor_id=contractor.id,
    )
    worker2 = User(
        id=uuid.uuid4(),
        username="dmc_worker2",
        full_name="DMC Worker 2",
        hashed_password="hash",
        contractor_id=contractor.id,
    )
    db_session.add_all([worker1, worker2])
    await db_session.commit()

    stmt = (
        select(Contractor)
        .where(Contractor.id == contractor.id)
        .options(selectinload(Contractor.workers))
    )
    res = await db_session.execute(stmt)
    loaded_contractor = res.scalar_one()

    assert len(loaded_contractor.workers) == 2
    usernames = [w.username for w in loaded_contractor.workers]
    assert "dmc_worker1" in usernames
    assert "dmc_worker2" in usernames
