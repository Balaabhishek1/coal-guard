"""Statutory Compliance Violation & Remediation State Machine Service

Drives ticket creation, SLA deadline computation, and strict sequential state transitions
under Coal Mines Regulations (CMR 2017).
"""

from datetime import datetime, timedelta, timezone
import logging
from typing import List, Optional
import uuid

from fastapi import HTTPException, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.models.governance import (
    ComplianceViolation,
    ViolationSeverity,
    ViolationStatus,
)
from app.models.location import MineLocation
from app.models.user import Contractor
from app.schemas.governance import ViolationCreate, ViolationStatusTransition
from app.services.audit_service import HashChainService

logger = logging.getLogger("coalguard.governance")

# Legal forward transitions in the remediation state machine
PERMITTED_TRANSITIONS = {
    ViolationStatus.DETECTED.value: [ViolationStatus.NOTICE_SERVED.value],
    ViolationStatus.NOTICE_SERVED.value: [ViolationStatus.ACTION_TAKEN.value],
    ViolationStatus.ACTION_TAKEN.value: [ViolationStatus.VERIFIED.value],
    ViolationStatus.VERIFIED.value: [ViolationStatus.STATUTORY_CLOSEOUT.value],
    ViolationStatus.STATUTORY_CLOSEOUT.value: [],  # Terminal state
}

# Statutory SLA duration map (hours)
SLA_HOURS = {
    ViolationSeverity.LOW.value: settings.SLA_LOW_HOURS,
    ViolationSeverity.MEDIUM.value: settings.SLA_MEDIUM_HOURS,
    ViolationSeverity.HIGH.value: settings.SLA_HIGH_HOURS,
    ViolationSeverity.CRITICAL.value: settings.SLA_CRITICAL_HOURS,
}


class ViolationService:
    """Service governing safety violation tickets and immutable state transitions."""

    @staticmethod
    async def create_violation(
        db: AsyncSession,
        payload: ViolationCreate,
        reporter_id: Optional[uuid.UUID] = None,
    ) -> ComplianceViolation:
        """Registers a new safety violation, assigns SLA deadline, and records cryptographic anchor."""
        now = datetime.now(timezone.utc)

        # 1. Validate location existence
        loc_res = await db.execute(select(MineLocation).where(MineLocation.id == payload.location_id))
        loc = loc_res.scalar_one_or_none()
        if not loc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Mine location '{payload.location_id}' not found in spatial registry",
            )

        # 2. Validate contractor if assigned
        if payload.contractor_id:
            cont_res = await db.execute(select(Contractor).where(Contractor.id == payload.contractor_id))
            if not cont_res.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Contractor '{payload.contractor_id}' not found in contractor registry",
                )

        # 3. Compute statutory SLA deadline
        severity_val = payload.severity.value
        sla_hours = SLA_HOURS.get(severity_val, settings.SLA_MEDIUM_HOURS)
        deadline_sla = payload.deadline_sla or (now + timedelta(hours=sla_hours))

        # 4. Instantiate and persist violation
        violation = ComplianceViolation(
            location_id=payload.location_id,
            reporter_id=reporter_id,
            contractor_id=payload.contractor_id,
            violation_type=payload.violation_type,
            title=payload.title,
            description=payload.description,
            severity=severity_val,
            status=ViolationStatus.DETECTED.value,
            deadline_sla=deadline_sla,
            created_at=now,
        )
        db.add(violation)
        await db.commit()
        await db.refresh(violation)

        # 5. Cryptographically anchor creation in the audit ledger
        await HashChainService.append_log(
            db=db,
            action_type="VIOLATION_CREATED",
            actor_id=reporter_id,
            payload={
                "violation_id": str(violation.id),
                "violation_type": violation.violation_type,
                "title": violation.title,
                "severity": violation.severity,
                "status": violation.status,
                "location_id": str(violation.location_id),
                "location_name": loc.location_name,
                "contractor_id": str(violation.contractor_id) if violation.contractor_id else None,
                "deadline_sla": deadline_sla.isoformat(),
            },
        )

        logger.info(f"Created violation #{violation.id} [{violation.severity}] - SLA: {deadline_sla}")
        return violation

    @staticmethod
    async def transition_status(
        db: AsyncSession,
        violation_id: uuid.UUID,
        transition_in: ViolationStatusTransition,
        actor_id: Optional[uuid.UUID] = None,
    ) -> ComplianceViolation:
        """Transitions remediation state machine with statutory guard verification."""
        stmt = (
            select(ComplianceViolation)
            .where(ComplianceViolation.id == violation_id)
            .options(
                selectinload(ComplianceViolation.location),
                selectinload(ComplianceViolation.reporter),
                selectinload(ComplianceViolation.contractor),
            )
        )
        res = await db.execute(stmt)
        violation = res.scalar_one_or_none()

        if not violation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Compliance violation '{violation_id}' not found",
            )

        current_status = violation.status
        target_status = transition_in.status.value

        # Guard Condition: Enforce strict forward state machine progression
        permitted = PERMITTED_TRANSITIONS.get(current_status, [])
        if target_status not in permitted:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Statutory state transition denied. Cannot transition from '{current_status}' "
                    f"to '{target_status}'. Permitted next stage: {permitted}."
                ),
            )

        now = datetime.now(timezone.utc)
        violation.status = target_status

        # If reaching final statutory close-out, timestamp resolution
        if target_status == ViolationStatus.STATUTORY_CLOSEOUT.value:
            violation.resolved_at = now

        await db.commit()
        await db.refresh(violation)

        # Cryptographically anchor state transition
        await HashChainService.append_log(
            db=db,
            action_type="STATUS_UPDATED",
            actor_id=actor_id,
            payload={
                "violation_id": str(violation.id),
                "previous_status": current_status,
                "new_status": target_status,
                "remarks": transition_in.remarks,
                "timestamp": now.isoformat(),
                "resolved_at": violation.resolved_at.isoformat() if violation.resolved_at else None,
            },
        )

        logger.info(f"Violation #{violation.id} transitioned: {current_status} -> {target_status}")
        return violation

    @staticmethod
    async def get_violation(
        db: AsyncSession,
        violation_id: uuid.UUID,
    ) -> ComplianceViolation:
        """Retrieves a single violation record with populated relationship details."""
        stmt = (
            select(ComplianceViolation)
            .where(ComplianceViolation.id == violation_id)
            .options(
                selectinload(ComplianceViolation.location),
                selectinload(ComplianceViolation.reporter),
                selectinload(ComplianceViolation.contractor),
            )
        )
        res = await db.execute(stmt)
        violation = res.scalar_one_or_none()
        if not violation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Compliance violation '{violation_id}' not found",
            )
        return violation

    @staticmethod
    async def list_violations(
        db: AsyncSession,
        severity: Optional[str] = None,
        status_filter: Optional[str] = None,
        location_id: Optional[uuid.UUID] = None,
        contractor_id: Optional[uuid.UUID] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[ComplianceViolation]:
        """Queries filtered compliance violation tickets."""
        stmt = (
            select(ComplianceViolation)
            .options(
                selectinload(ComplianceViolation.location),
                selectinload(ComplianceViolation.reporter),
                selectinload(ComplianceViolation.contractor),
            )
            .order_by(desc(ComplianceViolation.created_at))
        )

        if severity:
            stmt = stmt.where(ComplianceViolation.severity == severity.upper())
        if status_filter:
            stmt = stmt.where(ComplianceViolation.status == status_filter.upper())
        if location_id:
            stmt = stmt.where(ComplianceViolation.location_id == location_id)
        if contractor_id:
            stmt = stmt.where(ComplianceViolation.contractor_id == contractor_id)

        stmt = stmt.offset(skip).limit(min(100, max(1, limit)))
        res = await db.execute(stmt)
        return list(res.scalars().all())
