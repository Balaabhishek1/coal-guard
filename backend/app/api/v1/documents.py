"""Document Digitization & OCR Extraction API Endpoints

Handles physical certificate uploads (VTC, PME, FLPM, DGMS approvals),
asynchronous OCR processing triggering, status polling, and statutory human verification.
"""

import logging
import os
import shutil
from typing import List, Optional
import uuid

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user, get_db, get_optional_current_user
from app.models.document import DigitizedCertificate, DocumentType, ProcessingStatus
from app.models.user import User, WorkerCredential
from app.schemas.document import (
    DocumentUploadResponse,
    DocumentVerifyRequest,
    OCRResultResponse,
)
from app.services.audit_service import HashChainService
from app.worker.ocr_worker import execute_document_ocr, process_document_ocr

logger = logging.getLogger("coalguard.api.documents")

router = APIRouter(prefix="/documents", tags=["Document Digitization & OCR"])

UPLOAD_BASE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "uploads", "documents")
os.makedirs(UPLOAD_BASE_DIR, exist_ok=True)


@router.post(
    "/upload",
    response_model=DocumentUploadResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Upload Scanned Certificate for Digitization",
    description="Accepts scanned physical certificates (VTC, PME, FLPM, DGMS) and dispatches async OCR extraction pipeline.",
)
async def upload_document(
    file: UploadFile = File(..., description="Scanned image or document file"),
    document_type: str = Form(DocumentType.OTHER.value, description="Initial suspected document type"),
    target_user_id: Optional[uuid.UUID] = Form(None, description="Associated worker identity"),
    target_hardware_id: Optional[uuid.UUID] = Form(None, description="Associated machinery asset identity"),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
) -> DocumentUploadResponse:
    cert_id = uuid.uuid4()
    filename = f"{cert_id}_{file.filename}"
    saved_path = os.path.join(UPLOAD_BASE_DIR, filename)

    try:
        with open(saved_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as exc:
        logger.error(f"Failed to save uploaded certificate: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not persist uploaded file: {str(exc)}",
        )

    # Persist certificate entry
    cert = DigitizedCertificate(
        id=cert_id,
        document_type=document_type,
        target_user_id=target_user_id,
        target_hardware_id=target_hardware_id,
        file_url=saved_path,
        processing_status=ProcessingStatus.PENDING.value,
        is_verified_by_human=False,
    )
    db.add(cert)
    await db.commit()
    await db.refresh(cert)

    # Dispatch Celery OCR task, with fallback to synchronous execution if Celery unavailable
    task_id = str(uuid.uuid4())
    try:
        async_res = process_document_ocr.delay(str(cert_id), saved_path)
        task_id = async_res.id
    except Exception as exc:
        logger.warning(f"Celery dispatch failed ({exc}), executing OCR synchronously in process.")
        await execute_document_ocr(cert_id, saved_path, db)

    return DocumentUploadResponse(
        task_id=task_id,
        certificate_id=cert.id,
        status=cert.processing_status,
        file_url=cert.file_url,
        message="Document uploaded successfully and queued for statutory OCR processing.",
    )


@router.get(
    "/{certificate_id}",
    response_model=OCRResultResponse,
    summary="Get Digitized Certificate & OCR Result",
    description="Retrieves extraction metadata, validity dates, serial numbers, and OCR status.",
)
async def get_document(
    certificate_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> OCRResultResponse:
    stmt = select(DigitizedCertificate).where(DigitizedCertificate.id == certificate_id)
    res = await db.execute(stmt)
    cert = res.scalar_one_or_none()

    if not cert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Digitized certificate #{certificate_id} not found",
        )

    return OCRResultResponse.model_validate(cert)


@router.post(
    "/{certificate_id}/verify",
    response_model=OCRResultResponse,
    summary="Human-in-the-Loop Statutory Verification",
    description="Statutory overman or safety officer confirms or corrects OCR metadata, auto-updating credential registries.",
)
async def verify_document(
    certificate_id: uuid.UUID,
    payload: DocumentVerifyRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
) -> OCRResultResponse:
    stmt = select(DigitizedCertificate).where(DigitizedCertificate.id == certificate_id)
    res = await db.execute(stmt)
    cert = res.scalar_one_or_none()

    if not cert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Digitized certificate #{certificate_id} not found",
        )

    # Apply manual verification and corrections
    cert.is_verified_by_human = payload.is_verified
    if payload.corrected_document_type:
        cert.document_type = payload.corrected_document_type
    if payload.corrected_serial_no:
        cert.extracted_serial_no = payload.corrected_serial_no
    if payload.corrected_valid_from:
        cert.valid_from = payload.corrected_valid_from
    if payload.corrected_valid_until:
        cert.valid_until = payload.corrected_valid_until
    if payload.target_user_id:
        cert.target_user_id = payload.target_user_id
    if payload.target_hardware_id:
        cert.target_hardware_id = payload.target_hardware_id

    # Auto-update credentials if linked to a miner
    updated_credential = False
    if cert.target_user_id and cert.valid_until:
        cred_stmt = select(WorkerCredential).where(WorkerCredential.user_id == cert.target_user_id)
        cred_res = await db.execute(cred_stmt)
        cred = cred_res.scalar_one_or_none()

        if cred:
            if cert.document_type == DocumentType.VTC_SLIP.value:
                cred.vtc_training_expiry = cert.valid_until.date()
                updated_credential = True
            elif cert.document_type == DocumentType.PME_RECORD.value:
                cred.pme_medical_expiry = cert.valid_until.date()
                updated_credential = True

    # Anchor human verification in the audit ledger
    verifier_id = current_user.id if current_user else None
    await HashChainService.append_log(
        db=db,
        action_type="DOCUMENT_HUMAN_VERIFIED",
        actor_id=verifier_id,
        payload={
            "certificate_id": str(cert.id),
            "document_type": cert.document_type,
            "serial_no": cert.extracted_serial_no,
            "valid_until": cert.valid_until.isoformat() if cert.valid_until else None,
            "is_verified": cert.is_verified_by_human,
            "updated_credential": updated_credential,
            "notes": payload.notes,
        },
    )

    await db.commit()
    await db.refresh(cert)

    return OCRResultResponse.model_validate(cert)


@router.get(
    "",
    response_model=List[OCRResultResponse],
    summary="List Digitized Certificates",
    description="Queries digitized documents with optional filters by document type, processing status, and verification state.",
)
async def list_documents(
    document_type: Optional[str] = Query(None, description="Filter by statutory document type"),
    processing_status: Optional[str] = Query(None, description="Filter by OCR processing status"),
    is_verified: Optional[bool] = Query(None, description="Filter by human verification state"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> List[OCRResultResponse]:
    stmt = select(DigitizedCertificate).order_by(desc(DigitizedCertificate.created_at))

    if document_type:
        stmt = stmt.where(DigitizedCertificate.document_type == document_type)
    if processing_status:
        stmt = stmt.where(DigitizedCertificate.processing_status == processing_status)
    if is_verified is not None:
        stmt = stmt.where(DigitizedCertificate.is_verified_by_human == is_verified)

    stmt = stmt.offset(skip).limit(limit)
    res = await db.execute(stmt)
    records = res.scalars().all()

    return [OCRResultResponse.model_validate(r) for r in records]
