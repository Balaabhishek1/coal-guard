"""Digitized Certificate & Legacy OCR Document ORM Models

Stores scanned paper certificates (VTC slips, PME records, FLPM machinery fitness, DGMS approvals),
extracted OCR texts, automated metadata fields, and human verification status.
"""

from datetime import datetime
from enum import Enum
from typing import Optional
import uuid

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class DocumentType(str, Enum):
    """Statutory mining document classifications."""

    VTC_SLIP = "VTC_SLIP"
    PME_RECORD = "PME_RECORD"
    FLPM_FITNESS = "FLPM_FITNESS"
    DGMS_APPROVAL = "DGMS_APPROVAL"
    OTHER = "OTHER"


class ProcessingStatus(str, Enum):
    """Asynchronous OCR lifecycle states."""

    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class DigitizedCertificate(Base):
    """Digitized physical documents with OCR-extracted statutory parameters."""

    __tablename__ = "digitized_certificates"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
    )
    document_type: Mapped[str] = mapped_column(
        String(50),
        default=DocumentType.OTHER.value,
        nullable=False,
        index=True,
    )
    extracted_serial_no: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        index=True,
    )
    issuing_authority: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )
    target_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    target_hardware_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hardware_registry.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    valid_from: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    valid_until: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    raw_text: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    file_url: Mapped[str] = mapped_column(
        String(512),
        nullable=False,
    )
    processing_status: Mapped[str] = mapped_column(
        String(50),
        default=ProcessingStatus.PENDING.value,
        nullable=False,
        index=True,
    )
    is_verified_by_human: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    target_user = relationship("User", foreign_keys=[target_user_id], lazy="selectin")
    target_hardware = relationship("HardwareRegistry", foreign_keys=[target_hardware_id], lazy="selectin")
