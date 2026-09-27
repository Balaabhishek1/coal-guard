"""Mobile Field Sync & Resumable Media Upload Endpoints

Exposes REST APIs for the Flutter mobile inspector app to synchronize offline Form IV
shift diaries, strata measurements, and chunked WebP underground photos.
"""

from typing import List, Optional
import uuid

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user, get_db
from app.models.sync_log import FormIVInspection, SyncLog, InspectionEvidence
from app.models.user import User, UserRole
from app.schemas.sync import (
    ChunkUploadInit,
    ChunkUploadInitResponse,
    ChunkUploadProgressResponse,
    FormIVInspectionRead,
    FormIVInspectionDetailRead,
    SyncBatchPayload,
    SyncBatchResponse,
    SyncLogRead,
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
        "evaluates statutory hazard thresholds (CH4 >= 1.25%, Air Velocity < 15 m/min, Torque < 80 Nm), "
        "and anchors batches in the SHA-256 cryptographic audit ledger."
    ),
)
async def sync_field_batch(
    payload: SyncBatchPayload,
    inspector_id: Optional[uuid.UUID] = Query(None, description="Explicit Inspector User UUID if assigned by authorized officer"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Execute idempotent batch unpacking and statutory interlock analysis."""
    effective_inspector_id: uuid.UUID = current_user.id
    if inspector_id is not None and current_user.role in [
        UserRole.SAFETY_OFFICER.value,
        UserRole.COLLIERY_MANAGER.value,
        UserRole.MANAGER.value,
    ]:
        effective_inspector_id = inspector_id

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
    current_user: User = Depends(get_current_user),
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
    current_user: User = Depends(get_current_user),
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
    current_user: User = Depends(get_current_user),
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


@router.get(
    "/logs",
    response_model=List[SyncLogRead],
    summary="List Mobile Synchronization Batches",
    description="Fetches historical sync batch operations from field devices.",
    status_code=status.HTTP_200_OK,
)
async def list_sync_logs(
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
    status_filter: Optional[str] = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[SyncLogRead]:
    """Retrieve mobile sync batch logs."""
    stmt = select(SyncLog).order_by(desc(SyncLog.timestamp))
    if status_filter:
        stmt = stmt.where(SyncLog.status == status_filter)
    stmt = stmt.offset(skip).limit(limit)
    res = await db.execute(stmt)
    records = res.scalars().all()
    return [SyncLogRead.model_validate(r) for r in records]


@router.get(
    "/inspections/form-iv",
    response_model=List[FormIVInspectionDetailRead],
    summary="List Form IV Shift Inspections (Enhanced)",
    description="Retrieves a paginated list of synchronized Form IV daily shift diary records with location and inspector names.",
    status_code=status.HTTP_200_OK,
)
async def list_form_iv_inspections(
    location_id: Optional[uuid.UUID] = Query(None, description="Filter by MineLocation UUID"),
    inspector_id: Optional[uuid.UUID] = Query(None, description="Filter by Inspector UUID"),
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[FormIVInspectionDetailRead]:
    """Query Form IV shift logs with details and photos."""
    stmt = select(FormIVInspection).order_by(desc(FormIVInspection.inspection_time))
    if location_id:
        stmt = stmt.where(FormIVInspection.location_id == location_id)
    if inspector_id:
        stmt = stmt.where(FormIVInspection.inspector_id == inspector_id)
    stmt = stmt.offset(skip).limit(limit)
    res = await db.execute(stmt)
    inspections = res.scalars().all()

    results = []
    for insp in inspections:
        ev_urls = [ev.file_path for ev in insp.evidence] if insp.evidence else []
        results.append(
            FormIVInspectionDetailRead(
                id=insp.id,
                sync_id=insp.sync_id,
                inspector_id=insp.inspector_id,
                location_id=insp.location_id,
                roof_bolt_torque_nm=insp.roof_bolt_torque_nm,
                air_velocity_m_per_min=insp.air_velocity_m_per_min,
                gas_ch4_percent=insp.gas_ch4_percent,
                gas_co_ppm=insp.gas_co_ppm,
                strata_remarks=insp.strata_remarks,
                is_geotagged_nfc=insp.is_geotagged_nfc,
                inspection_time=insp.inspection_time,
                created_at=insp.created_at,
                inspector_name=insp.inspector.full_name if insp.inspector else None,
                location_name=insp.location.location_name if insp.location else None,
                evidence_urls=ev_urls,
            )
        )
    return results


@router.get(
    "/inspections/form-iv/{inspection_id}",
    response_model=FormIVInspectionDetailRead,
    summary="Get Form IV Shift Inspection Details",
    description="Retrieves a single Form IV shift inspection record by ID with evidence photos.",
    status_code=status.HTTP_200_OK,
)
async def get_form_iv_inspection_by_id(
    inspection_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FormIVInspectionDetailRead:
    """Fetch single Form IV inspection detail."""
    stmt = select(FormIVInspection).where(FormIVInspection.id == inspection_id)
    res = await db.execute(stmt)
    insp = res.scalar_one_or_none()
    if not insp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Form IV inspection {inspection_id} not found.",
        )
    ev_urls = [ev.file_path for ev in insp.evidence] if insp.evidence else []
    return FormIVInspectionDetailRead(
        id=insp.id,
        sync_id=insp.sync_id,
        inspector_id=insp.inspector_id,
        location_id=insp.location_id,
        roof_bolt_torque_nm=insp.roof_bolt_torque_nm,
        air_velocity_m_per_min=insp.air_velocity_m_per_min,
        gas_ch4_percent=insp.gas_ch4_percent,
        gas_co_ppm=insp.gas_co_ppm,
        strata_remarks=insp.strata_remarks,
        is_geotagged_nfc=insp.is_geotagged_nfc,
        inspection_time=insp.inspection_time,
        created_at=insp.created_at,
        inspector_name=insp.inspector.full_name if insp.inspector else None,
        location_name=insp.location.location_name if insp.location else None,
        evidence_urls=ev_urls,
    )

