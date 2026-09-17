"""Document Digitization, OCR Extraction & Report Schemas

Pydantic validation models for scanned certificate ingestion, OCR extraction results,
human verification workflows, and statutory PDF report generation parameters.
"""

from datetime import datetime
from typing import Optional
import uuid

from pydantic import BaseModel, ConfigDict, Field


class DocumentUploadResponse(BaseModel):
    """Response returned upon successful physical certificate upload."""

    task_id: str = Field(..., description="Asynchronous Celery task identifier")
    certificate_id: uuid.UUID = Field(..., description="Unique database ID of the digitized certificate")
    status: str = Field(..., description="Initial processing status (e.g. PENDING)")
    file_url: str = Field(..., description="Local or object storage file path")
    message: str = Field("Document uploaded successfully and queued for OCR processing.", description="Status message")

    model_config = ConfigDict(from_attributes=True)


class OCRResultResponse(BaseModel):
    """Detailed OCR extraction and statutory metadata response."""

    id: uuid.UUID
    document_type: str
    extracted_serial_no: Optional[str] = None
    issuing_authority: Optional[str] = None
    target_user_id: Optional[uuid.UUID] = None
    target_hardware_id: Optional[uuid.UUID] = None
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    raw_text: Optional[str] = None
    file_url: str
    processing_status: str
    is_verified_by_human: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DocumentVerifyRequest(BaseModel):
    """Payload for human-in-the-loop statutory verification and manual correction."""

    is_verified: bool = Field(True, description="Statutory human verification confirmation")
    corrected_document_type: Optional[str] = Field(None, description="Corrected document classification")
    corrected_serial_no: Optional[str] = Field(None, description="Corrected certificate/serial number")
    corrected_valid_from: Optional[datetime] = Field(None, description="Corrected issue validity start date")
    corrected_valid_until: Optional[datetime] = Field(None, description="Corrected certificate expiry date")
    target_user_id: Optional[uuid.UUID] = Field(None, description="Associated worker identity")
    target_hardware_id: Optional[uuid.UUID] = Field(None, description="Associated hardware asset identity")
    notes: Optional[str] = Field(None, description="Supervisory review remarks")


class ReportGenerateRequest(BaseModel):
    """Query or payload parameters for statutory DGMS and MSRI PDF generation."""

    mine_code: Optional[str] = Field("MINE-ALPHA-01", description="Statutory Colliery Code")
    shift: Optional[str] = Field("SHIFT_1", description="Mining operational shift (SHIFT_1, SHIFT_2, SHIFT_3)")
    date_from: Optional[datetime] = Field(None, description="Report start timestamp filter")
    date_to: Optional[datetime] = Field(None, description="Report end timestamp filter")
