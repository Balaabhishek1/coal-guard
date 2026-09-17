"""Pytest Configuration and Test Fixtures

Provides isolated async in-memory SQLite database sessions and test API clients.
"""

import asyncio
from datetime import date, datetime, timedelta, timezone
import uuid
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.api.dependencies import get_db
from app.core.security import get_password_hash
from app.db.base import Base
from app.models.user import Contractor, User, UserRole, WorkerCredential
from main import app

# Test database URL using in-memory SQLite with aiosqlite
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)


TestingSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


@pytest.fixture(scope="session")
def event_loop():
    """Creates a session-scoped event loop for async tests."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def db_session():
    """Yields an isolated database session with freshly instantiated schema."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestingSessionLocal() as session:
        yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession):
    """FastAPI async test client with dependency override for database session."""
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest_asyncio.fixture(scope="function")
async def seed_data(db_session: AsyncSession):
    """Seeds test contractors, personnel with various statutory roles and credential states."""
    today = date.today()
    now = datetime.now(timezone.utc)

    # 1. Contractor Agency
    contractor = Contractor(
        id=uuid.uuid4(),
        company_name="Singareni Mining Services Ltd",
        license_number="LIC-SCCL-2026",
        contract_code="CONT-SCCL-2026",
        contact_person="Ramesh Babu",
        contact_phone="+919876543210",
        contact_email="ramesh@singareniservices.com",
        safety_rating=98.5,
        is_active=True,
    )
    db_session.add(contractor)

    # 2. Colliery Manager (Administrator)
    manager = User(
        id=uuid.uuid4(),
        username="colliery_mgr",
        email="manager@mineguard.in",
        hashed_password=get_password_hash("ManagerSecret2026!"),
        full_name="Dr. Arvind Sharma",
        role=UserRole.COLLIERY_MANAGER.value,
        rfid_tag="RFID-MGR-001",
        is_active=True,
    )
    db_session.add(manager)

    # 3. Safety Officer
    safety_officer = User(
        id=uuid.uuid4(),
        username="safety_officer",
        email="safety@mineguard.in",
        hashed_password=get_password_hash("SafetySecret2026!"),
        full_name="Sunil Verma",
        role=UserRole.SAFETY_OFFICER.value,
        rfid_tag="RFID-SFT-002",
        is_active=True,
    )
    db_session.add(safety_officer)

    # 4. Overman / Mining Sirdar
    overman = User(
        id=uuid.uuid4(),
        username="overman_ramesh",
        email="overman@mineguard.in",
        hashed_password=get_password_hash("OvermanSecret2026!"),
        full_name="Ramesh Soren",
        role=UserRole.OVERMAN.value,
        rfid_tag="RFID-OVR-003",
        is_active=True,
    )
    db_session.add(overman)

    # 5. Fully Compliant Miner (Eligible)
    eligible_miner = User(
        id=uuid.uuid4(),
        username="miner_rajesh",
        email="rajesh@mineguard.in",
        hashed_password=get_password_hash("MinerSecret2026!"),
        full_name="Rajesh Kumar",
        role=UserRole.MINER.value,
        rfid_tag="RFID-ELIGIBLE-001",
        contractor_id=contractor.id,
        is_active=True,
    )
    db_session.add(eligible_miner)

    eligible_cred = WorkerCredential(
        id=uuid.uuid4(),
        user_id=eligible_miner.id,
        vtc_training_expiry=today + timedelta(days=180),
        pme_medical_expiry=today + timedelta(days=90),
        current_shift_start=None,
    )
    db_session.add(eligible_cred)

    # 6. Miner with Expired VTC Training
    expired_vtc_miner = User(
        id=uuid.uuid4(),
        username="miner_vtc_expired",
        hashed_password=get_password_hash("MinerSecret2026!"),
        full_name="Suresh Munda",
        role=UserRole.MINER.value,
        rfid_tag="RFID-EXPVTC-002",
        contractor_id=contractor.id,
        is_active=True,
    )
    db_session.add(expired_vtc_miner)

    expired_vtc_cred = WorkerCredential(
        id=uuid.uuid4(),
        user_id=expired_vtc_miner.id,
        vtc_training_expiry=today - timedelta(days=10),  # Expired 10 days ago
        pme_medical_expiry=today + timedelta(days=60),
        current_shift_start=None,
    )
    db_session.add(expired_vtc_cred)

    # 7. Miner with Expired PME Medical Fitness
    expired_pme_miner = User(
        id=uuid.uuid4(),
        username="miner_pme_expired",
        hashed_password=get_password_hash("MinerSecret2026!"),
        full_name="Anil Oraon",
        role=UserRole.MINER.value,
        rfid_tag="RFID-EXPPME-003",
        contractor_id=contractor.id,
        is_active=True,
    )
    db_session.add(expired_pme_miner)

    expired_pme_cred = WorkerCredential(
        id=uuid.uuid4(),
        user_id=expired_pme_miner.id,
        vtc_training_expiry=today + timedelta(days=120),
        pme_medical_expiry=today - timedelta(days=5),  # Expired 5 days ago
        current_shift_start=None,
    )
    db_session.add(expired_pme_cred)

    # 8. Miner with Exceeded Shift Duration (> 8h continuous underground)
    overtime_miner = User(
        id=uuid.uuid4(),
        username="miner_overtime",
        hashed_password=get_password_hash("MinerSecret2026!"),
        full_name="Dinesh Mahato",
        role=UserRole.MINER.value,
        rfid_tag="RFID-OVERTIME-004",
        is_active=True,
    )
    db_session.add(overtime_miner)

    overtime_cred = WorkerCredential(
        id=uuid.uuid4(),
        user_id=overtime_miner.id,
        vtc_training_expiry=today + timedelta(days=150),
        pme_medical_expiry=today + timedelta(days=150),
        current_shift_start=now - timedelta(hours=9, minutes=15),  # 9.25 hours ago
    )
    db_session.add(overtime_cred)

    # 9. Deactivated / Suspended Miner
    inactive_miner = User(
        id=uuid.uuid4(),
        username="miner_inactive",
        hashed_password=get_password_hash("MinerSecret2026!"),
        full_name="Vikram Singh",
        role=UserRole.MINER.value,
        rfid_tag="RFID-INACTIVE-005",
        is_active=False,  # Suspended
    )
    db_session.add(inactive_miner)

    inactive_cred = WorkerCredential(
        id=uuid.uuid4(),
        user_id=inactive_miner.id,
        vtc_training_expiry=today + timedelta(days=200),
        pme_medical_expiry=today + timedelta(days=200),
        current_shift_start=None,
    )
    db_session.add(inactive_cred)

    await db_session.commit()
    return {
        "manager": manager,
        "safety_officer": safety_officer,
        "overman": overman,
        "eligible_miner": eligible_miner,
        "expired_vtc_miner": expired_vtc_miner,
        "expired_pme_miner": expired_pme_miner,
        "overtime_miner": overtime_miner,
        "inactive_miner": inactive_miner,
        "contractor": contractor,
    }
