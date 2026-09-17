"""Mobile Field Sync & Resumable Media Upload Endpoints

Exposes REST APIs for the Flutter mobile inspector app to synchronize offline Form IV
shift diaries, strata measurements, and chunked WebP underground photos.
"""

from typing import List, Optional
import uuid

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_db, get_optional_current_user
from app.models.sync_log import FormIVInspection
from app.models.user import User, UserRole
from app.schemas.sync import (
    ChunkUploadInit,
    ChunkUploadInitResponse,
    ChunkUploadProgressResponse,
    FormIVInspectionRead,
    SyncBatchPayload,
    SyncBatchResponse,
)
from app.services.sync_service import SyncService
from app.services.upload_service import UploadService

router = APIRouter(prefix="/sync", tags=["Mobile Field Sync Engine"])


@router.post(
    "/batch",
    response_model=SyncBatchResponse,
    status_code=status.HTTP_200_OK,
    summary="Idempotent Mobile Batch Synchronization",
    description=(
        "Ingests offline DGMS Form IV daily shift inspection entries from mobile devices. "
        "Enforces strict UUID idempotency over `sync_id`, unpacks strata and ventilation metrics, "
        "evaluates statutory hazard thresholds (CH4 >= 1.25%, Air Velocity < 30 m/min, Torque < 100 Nm), "
        "and anchors batches in the SHA-256 cryptographic audit ledger."
    ),
)
async def sync_field_batch(
    payload: SyncBatchPayload,
    inspector_id: Optional[uuid.UUID] = Query(None, description="Explicit Inspector User UUID if unauthenticated"),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """Execute idempotent batch unpacking and statutory interlock analysis."""
    # 1. Determine effective inspector identity
    effective_inspector_id: Optional[uuid.UUID] = None
    if current_user is not None:
        effective_inspector_id = current_user.id
    elif inspector_id is not None:
        effective_inspector_id = inspector_id
    else:
        # Fallback: Find an existing active Overman or Safety Officer in the system
        stmt = select(User).where(
            User.role.in_([UserRole.OVERMAN.value, UserRole.MINING_SIRDAR.value, UserRole.SAFETY_OFFICER.value])
        ).limit(1)
        res = await db.execute(stmt)
        default_officer = res.scalar_one_or_none()
        if default_officer:
            effective_inspector_id = default_officer.id
        else:
            # Last resort fallback: any user
            any_user_res = await db.execute(select(User).limit(1))
            any_user = any_user_res.scalar_one_or_none()
            if any_user:
                effective_inspector_id = any_user.id
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No inspector profile could be resolved. Please authenticate or provide inspector_id.",
                )

    return await SyncService.process_batch(
        db=db,
        payload=payload,
        inspector_id=effective_inspector_id,
    )


@router.post(
    "/upload-evidence/init",
    response_model=ChunkUploadInitResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Initialize Resumable Chunked Media Upload",
    description="Initializes a resumable chunked upload session for underground photographic evidence.",
)
async def init_resumable_upload(
    payload: ChunkUploadInit,
    db: AsyncSession = Depends(get_db),
):
    """Initiates an upload token and stages a chunk assembly directory."""
    return await UploadService.init_upload(db=db, payload=payload)


@router.put(
    "/upload-evidence/{upload_token}/chunk",
    response_model=ChunkUploadProgressResponse,
    status_code=status.HTTP_200_OK,
    summary="Upload Binary Media Chunk",
    description="Accepts a raw binary byte chunk for an active upload session. Assembles image on final chunk.",
)
async def upload_binary_chunk(
    upload_token: str,
    request: Request,
    chunk_index: int = Query(..., ge=0, description="0-indexed sequence number of the chunk"),
    db: AsyncSession = Depends(get_db),
):
    """Appends binary chunk data to the session staging directory."""
    chunk_bytes = await request.body()
    if not chunk_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chunk payload body is empty.",
        )

    return await UploadService.save_chunk(
        db=db,
        upload_token=upload_token,
        chunk_index=chunk_index,
        chunk_data=chunk_bytes,
    )


@router.get(
    "/inspections",
    response_model=List[FormIVInspectionRead],
    summary="List Form IV Shift Inspections",
    description="Retrieves a paginated list of synchronized Form IV daily shift diary records.",
    status_code=status.HTTP_200_OK,
)
async def list_inspections(
    location_id: Optional[uuid.UUID] = Query(None, description="Filter by MineLocation UUID"),
    inspector_id: Optional[uuid.UUID] = Query(None, description="Filter by Inspector UUID"),
    limit: int = Query(50, ge=1, le=200, description="Max records to return"),
    skip: int = Query(0, ge=0, description="Pagination offset"),
    db: AsyncSession = Depends(get_db),
):
    """Query Form IV shift logs with optional filters."""
    stmt = select(FormIVInspection).order_by(desc(FormIVInspection.inspection_time))
    if location_id:
        stmt = stmt.where(FormIVInspection.location_id == location_id)
    if inspector_id:
        stmt = stmt.where(FormIVInspection.inspector_id == inspector_id)
    stmt = stmt.offset(skip).limit(limit)

    res = await db.execute(stmt)
    return res.scalars().all()
