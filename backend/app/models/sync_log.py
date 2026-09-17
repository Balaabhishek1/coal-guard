"""Mobile Field Inspection & Offline Sync ORM Models

Defines statutory CMR 2017 Form IV shift logs, roof-bolt torque tests, ventilation checks,
and resumable underground photographic evidence records with strict idempotency tracking.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional
import uuid

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class SyncStatus(str, Enum):
    """Synchronization transaction state machine."""

    PROCESSING = "PROCESSING"
    SUCCESS = "SUCCESS"
    PARTIAL = "PARTIAL"
    FAILED = "FAILED"


class SyncLog(Base):
    """Idempotency ledger recording mobile device offline synchronization attempts."""

    __tablename__ = "sync_logs"

    sync_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        comment="Client-generated unique synchronization batch identifier",
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    device_id: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
        index=True,
    )
    records_processed: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(50),
        default=SyncStatus.PROCESSING.value,
        nullable=False,
    )
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    inspections = relationship("FormIVInspection", back_populates="sync_log", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<SyncLog(sync_id={self.sync_id}, device={self.device_id}, status={self.status})>"


class FormIVInspection(Base):
    """Statutory DGMS Form IV Daily Shift Inspection Diary under Coal Mines Regulations 2017."""

    __tablename__ = "form_iv_inspections"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    sync_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("sync_logs.sync_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    inspector_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    location_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("mine_locations.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    roof_bolt_torque_nm: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        comment="Strata control roof bolt torque measurement in Newton-meters",
    )
    air_velocity_m_per_min: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        comment="Ventilation air velocity measured in meters per minute (CMR 2017 Reg 153)",
    )
    gas_ch4_percent: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        comment="Inflammable gas percentage CH4 (Statutory trip threshold: 1.25%)",
    )
    gas_co_ppm: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        comment="Carbon monoxide concentration in parts per million (Spontaneous heating check)",
    )
    strata_remarks: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="Overman / Sirdar observations regarding roof/side condition and supports",
    )
    is_geotagged_nfc: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        comment="True if location verified via underground intrinsically safe NFC tag or BLE beacon",
    )
    inspection_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
        comment="Timestamp when field inspection was recorded underground",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    sync_log = relationship("SyncLog", back_populates="inspections")
    inspector = relationship("User", foreign_keys=[inspector_id])
    location = relationship("MineLocation", foreign_keys=[location_id])
    evidence = relationship("InspectionEvidence", back_populates="inspection", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<FormIVInspection(id={self.id}, location={self.location_id}, ch4={self.gas_ch4_percent}%)>"


class InspectionEvidence(Base):
    """Underground photo metadata and visual evidence linked to statutory shift inspections."""

    __tablename__ = "inspection_evidence"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    inspection_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("form_iv_inspections.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    file_path: Mapped[str] = mapped_column(
        String(512),
        nullable=False,
        comment="Filesystem or object storage path for the assembled WebP photo",
    )
    file_size_bytes: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
    )
    mime_type: Mapped[str] = mapped_column(
        String(50),
        default="image/webp",
        nullable=False,
    )
    upload_completed: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    inspection = relationship("FormIVInspection", back_populates="evidence")

    def __repr__(self) -> str:
        return f"<InspectionEvidence(id={self.id}, inspection={self.inspection_id}, path='{self.file_path}')>"
