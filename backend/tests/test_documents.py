"""Tests for Document Digitization & OCR Extraction Pipeline (Phase 6)

Validates certificate uploads, OCR text extraction, regex entity parsing,
auto-updates to worker credentials, and human-in-the-loop verification.
"""

from datetime import datetime, timezone
import io
import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import DigitizedCertificate, DocumentType, ProcessingStatus
from app.models.user import WorkerCredential
from app.worker.ocr_worker import execute_document_ocr


@pytest.mark.asyncio
async def test_document_upload_and_extraction(client: AsyncClient, db_session: AsyncSession):
    """Verifies document upload and statutory metadata extraction."""
    sample_certificate_text = (
        "DIRECTORATE GENERAL OF MINES SAFETY (DGMS)\n"
        "MINES VOCATIONAL TRAINING CENTRE - DHANBAD\n"
        "VTC REFRESHER TRAINING CERTIFICATE\n"
        "CERTIFICATE NO: VTC-2026-9812\n"
        "ISSUED ON: 10-01-2026\n"
        "VALID UPTO: 15-09-2027\n"
        "CANDIDATE: Rajesh Kumar\n"
        "DESIGNATION: MINER"
    )
    file_bytes = sample_certificate_text.encode("utf-8")
    files = {
        "file": ("vtc_certificate.txt", io.BytesIO(file_bytes), "text/plain"),
    }
    data = {
        "document_type": DocumentType.VTC_SLIP.value,
    }

    # 1. Upload Document
    response = await client.post("/api/v1/documents/upload", files=files, data=data)
    assert response.status_code == 202
    resp_data = response.json()
    assert "certificate_id" in resp_data
    assert "task_id" in resp_data
    cert_id = uuid.UUID(resp_data["certificate_id"])

    # 2. Trigger or verify OCR extraction
    # (Since upload route executes OCR synchronously if Celery is offline)
    stmt = select(DigitizedCertificate).where(DigitizedCertificate.id == cert_id)
    res = await db_session.execute(stmt)
    cert = res.scalar_one_or_none()
    assert cert is not None

    if cert.processing_status != ProcessingStatus.COMPLETED.value:
        await execute_document_ocr(cert_id, cert.file_url, db_session)

    # 3. Fetch OCR extraction results via API
    get_res = await client.get(f"/api/v1/documents/{cert_id}")
    assert get_res.status_code == 200
    doc_data = get_res.json()

    assert doc_data["document_type"] == DocumentType.VTC_SLIP.value
    assert doc_data["extracted_serial_no"] == "VTC-2026-9812"
    assert "Directorate General of Mines Safety" in (doc_data["issuing_authority"] or "")
    assert doc_data["valid_until"] is not None
    assert "2027" in doc_data["valid_until"]
    assert doc_data["processing_status"] == ProcessingStatus.COMPLETED.value


@pytest.mark.asyncio
async def test_document_ocr_auto_updates_worker_credential(
    client: AsyncClient,
    db_session: AsyncSession,
    seed_data: dict,
):
    """Verifies that processing a PME document auto-updates the associated miner's medical expiry."""
    expired_pme_miner = seed_data["expired_pme_miner"]
    user_id = expired_pme_miner.id

    pme_text = (
        "CENTRAL HOSPITAL AREA MEDICAL BOARD\n"
        "CMR 2017 FORM O - PERIODIC MEDICAL EXAMINATION (PME)\n"
        "FIT FOR UNDERGROUND WORK\n"
        "SL NO: PME-ECL-4410\n"
        "DATE OF EXAM: 01-02-2026\n"
        "VALID UPTO: 28-02-2028\n"
        "EMPLOYEE: Anil Oraon"
    )
    file_bytes = pme_text.encode("utf-8")
    files = {
        "file": ("pme_report.txt", io.BytesIO(file_bytes), "text/plain"),
    }
    data = {
        "document_type": DocumentType.PME_RECORD.value,
        "target_user_id": str(user_id),
    }

    # Upload
    upload_res = await client.post("/api/v1/documents/upload", files=files, data=data)
    assert upload_res.status_code == 202
    cert_id = uuid.UUID(upload_res.json()["certificate_id"])

    # Ensure processed
    stmt = select(DigitizedCertificate).where(DigitizedCertificate.id == cert_id)
    res = await db_session.execute(stmt)
    cert = res.scalar_one()
    if cert.processing_status != ProcessingStatus.COMPLETED.value:
        await execute_document_ocr(cert_id, cert.file_url, db_session)

    # Check that WorkerCredential has been auto-updated
    cred_stmt = select(WorkerCredential).where(WorkerCredential.user_id == user_id)
    cred_res = await db_session.execute(cred_stmt)
    cred = cred_res.scalar_one()

    assert str(cred.pme_medical_expiry) == "2028-02-28"


@pytest.mark.asyncio
async def test_document_human_verification(client: AsyncClient, db_session: AsyncSession):
    """Verifies human-in-the-loop statutory verification and metadata corrections."""
    cert = DigitizedCertificate(
        id=uuid.uuid4(),
        document_type=DocumentType.OTHER.value,
        extracted_serial_no="WRONG-NUM",
        file_url="uploads/documents/test_dummy.txt",
        processing_status=ProcessingStatus.COMPLETED.value,
        is_verified_by_human=False,
    )
    db_session.add(cert)
    await db_session.commit()

    verify_payload = {
        "is_verified": True,
        "corrected_document_type": DocumentType.FLPM_FITNESS.value,
        "corrected_serial_no": "CORR-FLPM-8899",
        "notes": "Verified by Safety Officer Sunil Verma",
    }

    verify_res = await client.post(f"/api/v1/documents/{cert.id}/verify", json=verify_payload)
    assert verify_res.status_code == 200
    res_data = verify_res.json()

    assert res_data["is_verified_by_human"] is True
    assert res_data["document_type"] == DocumentType.FLPM_FITNESS.value
    assert res_data["extracted_serial_no"] == "CORR-FLPM-8899"


@pytest.mark.asyncio
async def test_list_documents_filtering(client: AsyncClient, db_session: AsyncSession):
    """Verifies querying and filtering digitized documents list."""
    cert1 = DigitizedCertificate(
        id=uuid.uuid4(),
        document_type=DocumentType.VTC_SLIP.value,
        file_url="uploads/documents/doc1.txt",
        processing_status=ProcessingStatus.COMPLETED.value,
        is_verified_by_human=True,
    )
    cert2 = DigitizedCertificate(
        id=uuid.uuid4(),
        document_type=DocumentType.DGMS_APPROVAL.value,
        file_url="uploads/documents/doc2.txt",
        processing_status=ProcessingStatus.PENDING.value,
        is_verified_by_human=False,
    )
    db_session.add_all([cert1, cert2])
    await db_session.commit()

    # Filter by document_type
    res_vtc = await client.get("/api/v1/documents", params={"document_type": DocumentType.VTC_SLIP.value})
    assert res_vtc.status_code == 200
    items_vtc = res_vtc.json()
    assert all(i["document_type"] == DocumentType.VTC_SLIP.value for i in items_vtc)

    # Filter by verified
    res_ver = await client.get("/api/v1/documents", params={"is_verified": True})
    assert res_ver.status_code == 200
    items_ver = res_ver.json()
    assert all(i["is_verified_by_human"] is True for i in items_ver)


@pytest.mark.asyncio
async def test_get_nonexistent_document_404(client: AsyncClient):
    """Verifies that requesting an unknown document ID returns 404."""
    random_id = uuid.uuid4()
    res = await client.get(f"/api/v1/documents/{random_id}")
    assert res.status_code == 404
