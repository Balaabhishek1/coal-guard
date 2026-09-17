"""Edge Vision Gateway Ingress Endpoints

Exposes REST APIs for turnstile optical cameras, edge mini-PCs, and RFID turnstiles
to submit post-actuation verification records and trigger automated statutory ticketing.
"""

from typing import List, Optional
import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_db
from app.models.access_log import AccessAttemptLog
from app.schemas.vision_edge import AccessAttemptResponse, EdgeAccessEventPayload

router = APIRouter(prefix="/vision-edge", tags=["Edge Vision Gateway"])


@router.post(
    "/events/access-attempt",
    response_model=AccessAttemptResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ingest Post-Turnstile Actuation Metadata",
    description=(
        "Receives post-turnstile actuation metadata from edge vision mini-PCs. "
        "Enforces statutory optical wear checks (Hardhat, Vest, SCSR under CMR 2017). "
        "Automatically generates HIGH/CRITICAL compliance violation tickets and anchors "
        "entries in the cryptographic audit ledger when infractions occur."
    ),
)
async def ingest_access_attempt(
    payload: EdgeAccessEventPayload,
    db: AsyncSession = Depends(get_db),
):
    """Ingest post-turnstile event and execute statutory interlock verification."""
    from app.services.vision_gate_service import VisionGateService

    return await VisionGateService.record_access_attempt(db=db, payload=payload)


@router.get(
    "/logs",
    summary="List Recent Access Attempt Logs",
    description="Retrieves a paginated chronological list of turnstile ingress attempts.",
    status_code=status.HTTP_200_OK,
)
async def list_access_logs(
    location_id: Optional[uuid.UUID] = Query(None, description="Filter by MineLocation UUID"),
    rfid_tag: Optional[str] = Query(None, description="Filter by worker RFID tag"),
    limit: int = Query(50, ge=1, le=200, description="Max records to return"),
    skip: int = Query(0, ge=0, description="Offset for pagination"),
    db: AsyncSession = Depends(get_db),
):
    """Query recent turnstile gate events with optional location and RFID filtering."""
    stmt = select(AccessAttemptLog).order_by(desc(AccessAttemptLog.timestamp))
    if location_id:
        stmt = stmt.where(AccessAttemptLog.location_id == location_id)
    if rfid_tag:
        stmt = stmt.where(AccessAttemptLog.rfid_tag == rfid_tag)
    stmt = stmt.offset(skip).limit(limit)

    res = await db.execute(stmt)
    records = res.scalars().all()
    return records
