"""Mobile Field Sync & Chunked Media Upload Schemas

Defines Pydantic v2 schemas for idempotent DGMS Form IV shift inspection batches,
roof-bolt torque measurements, underground ventilation logs, and resumable media upload sessions.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid

from pydantic import BaseModel, ConfigDict, Field


class FormIVChecklistEntry(BaseModel):
    """Statutory underground shift diary entry captured offline by Mining Sirdar / Overman."""

    record_id: Optional[uuid.UUID] = Field(None, description="Client-side UUID for the checklist entry")
    location_id: uuid.UUID = Field(..., description="Underground mine location or working face UUID")
    roof_bolt_torque_nm: Optional[float] = Field(None, description="Roof bolt torque in Nm (Statutory >= 100 Nm)")
    air_velocity_m_per_min: Optional[float] = Field(None, description="Air velocity in m/min (CMR 2017 Reg 153 >= 30)")
    gas_ch4_percent: Optional[float] = Field(None, description="Inflammable gas CH4 concentration (Statutory trip >= 1.25%)")
    gas_co_ppm: Optional[float] = Field(None, description="Carbon monoxide concentration in PPM")
    strata_remarks: Optional[str] = Field(None, description="Qualitative observations on strata and side supports")
    is_geotagged_nfc: bool = Field(False, description="True if confirmed via physical underground NFC/BLE token")
    inspection_time: datetime = Field(..., description="Timestamp when inspection occurred offline")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "location_id": "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
                "roof_bolt_torque_nm": 115.5,
                "air_velocity_m_per_min": 38.0,
                "gas_ch4_percent": 0.22,
                "gas_co_ppm": 4.5,
                "strata_remarks": "Roof intact, 4 bolts torqued at 1.2m intervals. No flaking observed.",
                "is_geotagged_nfc": True,
                "inspection_time": "2026-09-17T17:30:00Z",
            }
        }
    )


class SyncBatchPayload(BaseModel):
    """Batch synchronization payload uploaded by the Flutter field client upon reconnecting."""

    sync_id: uuid.UUID = Field(..., description="Unique client-generated idempotency key")
    device_id: str = Field(..., min_length=1, max_length=128, description="Intrinsic mobile hardware/client UUID")
    checklists: List[FormIVChecklistEntry] = Field(..., description="Array of Form IV inspection records")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "sync_id": "c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33",
                "device_id": "ZONE-1-TABLET-EXPLOSIONPROOF-04",
                "checklists": [],
            }
        }
    )


class SyncBatchResponse(BaseModel):
    """Response returned upon completing or acknowledging a synchronization batch."""

    sync_id: uuid.UUID
    status: str = Field(..., description="COMPLETED, DUPLICATE_ACKNOWLEDGED, or FAILED")
    records_processed: int
    violations_created: int = 0
    message: str

    model_config = ConfigDict(from_attributes=True)


class ChunkUploadInit(BaseModel):
    """Payload to initiate a resumable chunked underground photo upload session."""

    file_name: str = Field(..., max_length=255, description="Original image filename (e.g., roof_crack_01.webp)")
    total_chunks: int = Field(..., ge=1, description="Total number of binary chunks expected")
    file_size_bytes: int = Field(..., ge=1, description="Expected assembled file size in bytes")
    inspection_id: Optional[uuid.UUID] = Field(None, description="FormIVInspection UUID to associate evidence with")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "file_name": "seam_vii_roof_support.webp",
                "total_chunks": 4,
                "file_size_bytes": 1048576,
                "inspection_id": "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
            }
        }
    )


class ChunkUploadInitResponse(BaseModel):
    """Response returned after initializing an upload session."""

    upload_token: str
    chunk_size_recommended: int = 524288  # 512 KB
    total_chunks: int
    status: str = "INITIALIZED"


class ChunkUploadProgressResponse(BaseModel):
    """Progress response returned after receiving an individual chunk."""

    upload_token: str
    chunks_received: int
    total_chunks: int
    upload_completed: bool
    evidence_id: Optional[uuid.UUID] = None
    file_path: Optional[str] = None


class FormIVInspectionRead(BaseModel):
    """Response schema for inspecting statutory Form IV inspection diaries."""

    id: uuid.UUID
    sync_id: uuid.UUID
    inspector_id: uuid.UUID
    location_id: uuid.UUID
    roof_bolt_torque_nm: Optional[float]
    air_velocity_m_per_min: Optional[float]
    gas_ch4_percent: Optional[float]
    gas_co_ppm: Optional[float]
    strata_remarks: Optional[str]
    is_geotagged_nfc: bool
    inspection_time: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FormIVInspectionDetailRead(FormIVInspectionRead):
    """Detailed Form IV inspection schema including inspector name, location name, and evidence URLs."""

    inspector_name: Optional[str] = None
    location_name: Optional[str] = None
    evidence_urls: List[str] = Field(default_factory=list)


class SyncLogRead(BaseModel):
    """Schema for querying mobile synchronization batch logs."""

    sync_id: uuid.UUID
    user_id: uuid.UUID
    device_id: str
    records_processed: int
    status: str
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

