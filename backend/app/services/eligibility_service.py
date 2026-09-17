"""Worker Eligibility Resolver Service

High-speed arbitration engine validating statutory credentials (VTC, PME, Shift limits)
for edge turnstiles and pithead vision gateways under CMR 2017.
"""

from datetime import date, datetime, timezone
from typing import List, Optional
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.models.user import User, WorkerCredential
from app.schemas.user import EligibilityResponse


class EligibilityService:
    """Service providing sub-millisecond statutory eligibility verification."""

    @staticmethod
    async def resolve_worker_eligibility(
        db: AsyncSession,
        rfid_tag: str,
    ) -> EligibilityResponse:
        """Arbitrates whether a miner holding the specified RFID badge is legally permitted

        to descend underground at the pithead turnstile.
        """
        now = datetime.now(timezone.utc)
        today = date.today()

        # Fetch worker and eager-load credentials in a single index-accelerated query
        stmt = (
            select(User)
            .where(User.rfid_tag == rfid_tag)
            .options(selectinload(User.credentials))
        )
        result = await db.execute(stmt)
        worker = result.scalar_one_or_none()

        if not worker:
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Worker with RFID tag '{rfid_tag}' not found in colliery registry",
            )

        statutory_reasons: List[str] = []
        is_active = worker.is_active

        if not is_active:
            statutory_reasons.append("Worker is inactive")

        creds: Optional[WorkerCredential] = worker.credentials
        if not creds:
            return EligibilityResponse(
                eligible=False,
                reason="No statutory credentials registered",
                worker_name=worker.full_name,
                vtc_valid=False,
                pme_valid=False,
                rfid_tag=rfid_tag,
                worker_id=worker.id,
                role=worker.role,
                statutory_reasons=["No statutory credentials registered"],
                timestamp=now,
            )

        # 1. Vocational Training Centre (VTC) Expiration Verification
        vtc_valid = creds.vtc_training_expiry >= today
        if not vtc_valid:
            statutory_reasons.append("VTC Training Expired")

        # 2. Periodic Medical Examination (PME) Expiration Verification
        pme_valid = creds.pme_medical_expiry >= today
        if not pme_valid:
            statutory_reasons.append("PME Invalid")

        # 3. Continuous Shift Overtime Duration Check (Mines Act 1952 / CMR 2017)
        shift_limit_valid = True
        shift_hours_elapsed: Optional[float] = None

        if creds.current_shift_start is not None:
            shift_start = creds.current_shift_start
            if shift_start.tzinfo is None:
                shift_start = shift_start.replace(tzinfo=timezone.utc)

            elapsed_seconds = (now - shift_start).total_seconds()
            shift_hours_elapsed = round(max(0.0, elapsed_seconds / 3600.0), 2)

            if shift_hours_elapsed >= settings.MAX_CONTINUOUS_SHIFT_HOURS:
                shift_limit_valid = False
                statutory_reasons.append(
                    f"Maximum shift duration exceeded ({shift_hours_elapsed}h elapsed)"
                )

        # Overall clearance determination
        is_eligible = (
            is_active
            and vtc_valid
            and pme_valid
            and shift_limit_valid
            and len(statutory_reasons) == 0
        )

        reason = (
            "All statutory credentials valid"
            if is_eligible
            else "; ".join(statutory_reasons)
        )

        return EligibilityResponse(
            eligible=is_eligible,
            reason=reason,
            worker_name=worker.full_name,
            vtc_valid=vtc_valid,
            pme_valid=pme_valid,
            rfid_tag=rfid_tag,
            worker_id=worker.id,
            role=worker.role,
            vtc_expiry=creds.vtc_training_expiry,
            pme_expiry=creds.pme_medical_expiry,
            shift_limit_valid=shift_limit_valid,
            shift_hours_elapsed=shift_hours_elapsed,
            statutory_reasons=statutory_reasons,
            timestamp=now,
        )

    @staticmethod
    async def resolve_worker_eligibility_by_id(
        db: AsyncSession,
        worker_id: uuid.UUID,
    ) -> EligibilityResponse:
        """Arbitrates statutory eligibility by worker UUID."""
        stmt = (
            select(User)
            .where(User.id == worker_id)
            .options(selectinload(User.credentials))
        )
        result = await db.execute(stmt)
        worker = result.scalar_one_or_none()

        rfid = worker.rfid_tag if worker and worker.rfid_tag else str(worker_id)
        return await EligibilityService.resolve_worker_eligibility(db, rfid_tag=rfid)

    @staticmethod
    async def record_shift_start(
        db: AsyncSession,
        rfid_tag: str,
    ) -> Optional[WorkerCredential]:
        """Marks turnstile ingress timestamp for continuous shift tracking."""
        stmt = (
            select(User)
            .where(User.rfid_tag == rfid_tag)
            .options(selectinload(User.credentials))
        )
        result = await db.execute(stmt)
        worker = result.scalar_one_or_none()

        if not worker or not worker.credentials:
            return None

        worker.credentials.current_shift_start = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(worker.credentials)
        return worker.credentials

    @staticmethod
    async def record_shift_end(
        db: AsyncSession,
        rfid_tag: str,
    ) -> Optional[WorkerCredential]:
        """Clears turnstile egress timestamp upon surface return."""
        stmt = (
            select(User)
            .where(User.rfid_tag == rfid_tag)
            .options(selectinload(User.credentials))
        )
        result = await db.execute(stmt)
        worker = result.scalar_one_or_none()

        if not worker or not worker.credentials:
            return None

        worker.credentials.current_shift_start = None
        await db.commit()
        await db.refresh(worker.credentials)
        return worker.credentials
