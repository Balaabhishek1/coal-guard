"""Statutory Governance & Cryptographic Audit Ledger ORM Models

Defines compliance violation tickets, statutory remediation state transitions,
and the immutable, linear SHA-256 tamper-evident audit ledger under CMR 2017.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional
import uuid

from sqlalchemy import (
    BigInteger,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.db.base import Base


class ViolationSeverity(str, Enum):
    """Statutory risk tiers dictating remediation SLA escalation deadlines."""

    LOW = "LOW"            # 72 hours
    MEDIUM = "MEDIUM"      # 24 hours
    HIGH = "HIGH"          # 12 hours
    CRITICAL = "CRITICAL"  # 2 hours (immediate life-safety danger)


class ViolationStatus(str, Enum):
    """Linear state machine stages under Coal Mines Regulations (CMR 2017)."""

    DETECTED = "DETECTED"                      # Identified by AI Vision, sensor, or inspector
    NOTICE_SERVED = "NOTICE_SERVED"            # Statutory notice transmitted to colliery agent/contractor
    ACTION_TAKEN = "ACTION_TAKEN"              # Corrective engineering control implemented
    VERIFIED = "VERIFIED"                      # Overman or Safety Officer inspected resolution
    STATUTORY_CLOSEOUT = "STATUTORY_CLOSEOUT"  # Formal DGMS regulatory close-out signed


class ComplianceViolation(Base):
    """Statutory safety infraction ticket with automated SLA countdown."""

    __tablename__ = "compliance_violations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
    )
    location_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("mine_locations.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    reporter_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    contractor_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("contractors.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    violation_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    severity: Mapped[str] = mapped_column(
        String(50),
        default=ViolationSeverity.MEDIUM.value,
        nullable=False,
        index=True,
    )
    status: Mapped[str] = mapped_column(
        String(50),
        default=ViolationStatus.DETECTED.value,
        nullable=False,
        index=True,
    )
    deadline_sla: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )
    resolved_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationships
    location = relationship("MineLocation", lazy="selectin")
    reporter = relationship("User", foreign_keys=[reporter_id], lazy="selectin")
    contractor = relationship("Contractor", foreign_keys=[contractor_id], lazy="selectin")


class AuditLedger(Base):
    """Cryptographic, linear SHA-256 hash-chained non-repudiation audit ledger.

    Each record's current_hash incorporates the previous entry's current_hash,
    ensuring that any manual tampering, deletion, or backdating breaks the verification chain.
    """

    __tablename__ = "audit_ledger"

    seq_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        primary_key=True,
        autoincrement=True,
    )
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )
    actor_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    action_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )
    payload: Mapped[Dict[str, Any]] = mapped_column(
        JSON().with_variant(JSONB, "postgresql"),
        nullable=False,
    )
    previous_hash: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
    )
    current_hash: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        index=True,
    )

    # Relationships
    actor = relationship("User", foreign_keys=[actor_id], lazy="selectin")

    __table_args__ = (
        Index("ix_audit_ledger_seq_timestamp", "seq_id", "timestamp"),
    )
