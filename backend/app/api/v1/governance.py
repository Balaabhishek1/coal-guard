"""Statutory Governance & Cryptographic Audit Ledger Endpoints

Exposes safety ticket management, state machine transitions, and tamper-evident audit verification.
"""

from typing import List, Optional
import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user, get_db, get_optional_current_user
from app.models.governance import AuditLedger
from app.models.user import User
from app.schemas.governance import (
    AuditIntegrityResponse,
    AuditLedgerRead,
    ViolationCreate,
    ViolationResponse,
    ViolationStatusTransition,
)
from app.services.audit_service import HashChainService
from app.services.violation_service import ViolationService
from app.worker.sla_worker import execute_sla_escalation_sweep

router = APIRouter(prefix="/governance", tags=["Statutory Governance & Audit Ledger"])


def _serialize_violation(v) -> ViolationResponse:
    """Helper serializer populating human-readable location and reporter names."""
    return ViolationResponse(
        id=v.id,
        location_id=v.location_id,
        reporter_id=v.reporter_id,
        contractor_id=v.contractor_id,
        violation_type=v.violation_type,
        title=v.title,
        description=v.description,
        severity=v.severity,
        status=v.status,
        deadline_sla=v.deadline_sla,
        created_at=v.created_at,
        resolved_at=v.resolved_at,
        location_name=v.location.location_name if v.location else None,
        reporter_name=v.reporter.full_name if v.reporter else None,
    )


# ---------------------------------------------------------
# Safety Violation Tickets & State Machine
# ---------------------------------------------------------
@router.post(
    "/violations",
    response_model=ViolationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Compliance Safety Violation Ticket",
    description="Registers a new statutory infraction, computes SLA deadline, and records cryptographic anchor.",
)
async def create_violation(
    payload: ViolationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
) -> ViolationResponse:
    reporter_id = current_user.id if current_user else None
    violation = await ViolationService.create_violation(
        db=db,
        payload=payload,
        reporter_id=reporter_id,
    )
    return _serialize_violation(violation)


@router.get(
    "/violations",
    response_model=List[ViolationResponse],
    summary="List Compliance Safety Violations",
    description="Queries filtered compliance violation tickets with zone and reporter metadata.",
)
async def list_violations(
    severity: Optional[str] = Query(None, description="Filter by severity (LOW, MEDIUM, HIGH, CRITICAL)"),
    status: Optional[str] = Query(None, description="Filter by state (DETECTED, NOTICE_SERVED, ACTION_TAKEN, VERIFIED, STATUTORY_CLOSEOUT)"),
    location_id: Optional[uuid.UUID] = Query(None, description="Filter by colliery location"),
    contractor_id: Optional[uuid.UUID] = Query(None, description="Filter by contractor"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> List[ViolationResponse]:
    violations = await ViolationService.list_violations(
        db=db,
        severity=severity,
        status_filter=status,
        location_id=location_id,
        contractor_id=contractor_id,
        skip=skip,
        limit=limit,
    )
    return [_serialize_violation(v) for v in violations]


@router.get(
    "/violations/{violation_id}",
    response_model=ViolationResponse,
    summary="Get Violation Ticket Details",
    description="Fetches full details of a specific compliance ticket.",
)
async def get_violation(
    violation_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> ViolationResponse:
    violation = await ViolationService.get_violation(db=db, violation_id=violation_id)
    return _serialize_violation(violation)


@router.patch(
    "/violations/{violation_id}/status",
    response_model=ViolationResponse,
    summary="Advance Remediation State Machine",
    description=(
        "Executes a forward state transition in the statutory remediation lifecycle: "
        "DETECTED -> NOTICE_SERVED -> ACTION_TAKEN -> VERIFIED -> STATUTORY_CLOSEOUT. "
        "Enforces guard conditions and appends cryptographic non-repudiation log."
    ),
)
async def transition_violation_status(
    violation_id: uuid.UUID,
    payload: ViolationStatusTransition,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
) -> ViolationResponse:
    actor_id = current_user.id if current_user else None
    updated = await ViolationService.transition_status(
        db=db,
        violation_id=violation_id,
        transition_in=payload,
        actor_id=actor_id,
    )
    return _serialize_violation(updated)


# ---------------------------------------------------------
# Cryptographic Audit Ledger Endpoints
# ---------------------------------------------------------
@router.get(
    "/audit-ledger",
    response_model=List[AuditLedgerRead],
    summary="Retrieve Immutable Audit Ledger",
    description="Fetches cryptographic audit trail records for DGMS regulatory inspection and compliance audits.",
)
async def get_audit_ledger(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> List[AuditLedgerRead]:
    stmt = (
        select(AuditLedger)
        .order_by(desc(AuditLedger.seq_id))
        .offset(skip)
        .limit(limit)
    )
    res = await db.execute(stmt)
    records = res.scalars().all()
    return [AuditLedgerRead.model_validate(r) for r in records]


@router.get(
    "/audit-ledger/verify",
    response_model=AuditIntegrityResponse,
    summary="Verify Cryptographic Hash-Chain Integrity",
    description="Traverses the sequential SHA-256 hash chain from Genesis block to HEAD to detect tampering or corruption.",
)
async def verify_audit_chain(
    db: AsyncSession = Depends(get_db),
) -> AuditIntegrityResponse:
    result = await HashChainService.verify_audit_integrity(db)
    return AuditIntegrityResponse(**result)


# ---------------------------------------------------------
# Manual SLA Escalation Sweep Trigger
# ---------------------------------------------------------
@router.post(
    "/sla/sweep",
    summary="Trigger Manual SLA Escalation Sweep",
    description="Forces immediate evaluation of overdue tickets, escalating severity and alerting control rooms.",
)
async def trigger_sla_sweep(
    db: AsyncSession = Depends(get_db),
):
    return await execute_sla_escalation_sweep(db)
