"""Statutory Colliery Database Seeder

Populates default operational personnel, contractors, and statutory worker credentials
in accordance with CMR 2017 & Mines Act 1952.
"""

import asyncio
from datetime import date, datetime, timedelta, timezone
import logging
import uuid

from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.user import Contractor, User, UserRole, WorkerCredential

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("coalguard.seed")


async def seed_database() -> None:
    logger.info("Initializing statutory colliery database seed...")
    today = date.today()

    async with AsyncSessionLocal() as session:
        # 1. Contractor Agency
        contractor_stmt = select(Contractor).where(Contractor.license_number == "LIC-SCCL-2026")
        res = await session.execute(contractor_stmt)
        contractor = res.scalar_one_or_none()

        if not contractor:
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
            session.add(contractor)
            await session.flush()
            logger.info("Created contractor: %s", contractor.company_name)

        # 2. Users to seed
        users_to_seed = [
            {
                "username": "colliery_mgr",
                "email": "manager@mineguard.in",
                "password": "ManagerSecret2026!",
                "full_name": "Dr. Arvind Sharma",
                "role": UserRole.COLLIERY_MANAGER.value,
                "rfid_tag": "RFID-MGR-001",
                "has_credentials": False,
            },
            {
                "username": "safety_officer",
                "email": "safety@mineguard.in",
                "password": "SafetySecret2026!",
                "full_name": "Sunil Verma",
                "role": UserRole.SAFETY_OFFICER.value,
                "rfid_tag": "RFID-SFT-002",
                "has_credentials": False,
            },
            {
                "username": "overman_ramesh",
                "email": "overman@mineguard.in",
                "password": "MinerSecret2026!",
                "full_name": "Ramesh Soren",
                "role": UserRole.OVERMAN.value,
                "rfid_tag": "RFID-OVR-003",
                "has_credentials": False,
            },
            {
                "username": "dgms_inspector",
                "email": "dgms@gov.in",
                "password": "SafetySecret2026!",
                "full_name": "Rajiv N. Sinha (DDG)",
                "role": UserRole.DGMS_INSPECTOR.value,
                "rfid_tag": "RFID-DGMS-001",
                "has_credentials": False,
            },
            {
                "username": "contractor_sup",
                "email": "contractor@mineguard.in",
                "password": "MinerSecret2026!",
                "full_name": "K. P. Rao",
                "role": UserRole.CONTRACTOR_SUPERVISOR.value,
                "rfid_tag": "RFID-CONT-001",
                "contractor_id": contractor.id,
                "has_credentials": False,
            },
            {
                "username": "miner_rajesh",
                "email": "rajesh@mineguard.in",
                "password": "MinerSecret2026!",
                "full_name": "Rajesh Kumar",
                "role": UserRole.MINER.value,
                "rfid_tag": "RFID-ELIGIBLE-001",
                "contractor_id": contractor.id,
                "has_credentials": True,
            },
        ]

        for udata in users_to_seed:
            user_stmt = select(User).where(
                (User.username == udata["username"]) | (User.email == udata["email"])
            )
            res = await session.execute(user_stmt)
            existing_user = res.scalar_one_or_none()

            if not existing_user:
                new_user = User(
                    id=uuid.uuid4(),
                    username=udata["username"],
                    email=udata["email"],
                    hashed_password=get_password_hash(udata["password"]),
                    full_name=udata["full_name"],
                    role=udata["role"],
                    rfid_tag=udata["rfid_tag"],
                    contractor_id=udata.get("contractor_id"),
                    is_active=True,
                )
                session.add(new_user)
                await session.flush()
                logger.info("Created user: %s (%s)", new_user.username, new_user.role)

                if udata["has_credentials"]:
                    cred = WorkerCredential(
                        id=uuid.uuid4(),
                        user_id=new_user.id,
                        vtc_training_expiry=today + timedelta(days=180),
                        pme_medical_expiry=today + timedelta(days=90),
                        current_shift_start=None,
                    )
                    session.add(cred)
                    logger.info("Added valid statutory credentials for %s", new_user.username)
            else:
                # Update password hash in case it differs
                existing_user.hashed_password = get_password_hash(udata["password"])
                existing_user.is_active = True
                logger.info("Refreshed password hash for existing user: %s", existing_user.username)

        await session.commit()
        logger.info("Database seeding completed successfully.")


if __name__ == "__main__":
    asyncio.run(seed_database())
