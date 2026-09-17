"""User, Worker Credentials & Contractor ORM Models

Defines personnel identities, statutory medical/VTC clearance dates, and RBAC roles.
"""

from datetime import date, datetime, timezone
from enum import Enum
import uuid
from typing import List, Optional

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Float,
    ForeignKey,
    String,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class UserRole(str, Enum):
    """Statutory and Operational Roles in Indian Coal Mining Governance (CMR 2017)."""

    MINER = "MINER"
    OVERMAN = "OVERMAN"
    MINING_SIRDAR = "MINING_SIRDAR"
    SAFETY_OFFICER = "SAFETY_OFFICER"
    GATE_OPERATOR = "GATE_OPERATOR"
    COLLIERY_MANAGER = "COLLIERY_MANAGER"
    CORPORATE_HQ = "CORPORATE_HQ"
    DGMS_INSPECTOR = "DGMS_INSPECTOR"
    CONTRACTOR_SUPERVISOR = "CONTRACTOR_SUPERVISOR"


class Contractor(Base):
    """External contractor agency providing outsourced mining workforce."""

    __tablename__ = "contractors"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    contract_code: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        index=True,
        nullable=False,
    )
    contact_person: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    contact_phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    contact_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    safety_rating: Mapped[float] = mapped_column(Float, default=100.0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    workers: Mapped[List["User"]] = relationship(
        "User",
        back_populates="contractor",
    )


class User(Base):
    """Personnel Identity and Statutory Role model."""

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    rfid_tag: Mapped[Optional[str]] = mapped_column(
        String(128),
        unique=True,
        index=True,
        nullable=True,
    )
    username: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        index=True,
        nullable=False,
    )
    email: Mapped[Optional[str]] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=True,
    )
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(
        String(50),
        default=UserRole.MINER.value,
        nullable=False,
    )
    contractor_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("contractors.id", ondelete="SET NULL"),
        nullable=True,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    contractor: Mapped[Optional["Contractor"]] = relationship(
        "Contractor",
        back_populates="workers",
    )
    credentials: Mapped[Optional["WorkerCredential"]] = relationship(
        "WorkerCredential",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class WorkerCredential(Base):
    """Statutory eligibility certifications for pithead descent authorization.

    Tracks Vocational Training Centre (VTC) validity, Periodic Medical Exam (PME)
    dates, and shift duration limits.
    """

    __tablename__ = "worker_credentials"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    vtc_training_expiry: Mapped[date] = mapped_column(Date, nullable=False)
    pme_medical_expiry: Mapped[date] = mapped_column(Date, nullable=False)
    current_shift_start: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationship
    user: Mapped["User"] = relationship(
        "User",
        back_populates="credentials",
    )

    @hybrid_property
    def is_statutorily_eligible(self) -> bool:
        """Evaluates whether statutory VTC and PME requirements are met for today."""
        today = date.today()
        return (
            self.vtc_training_expiry >= today and self.pme_medical_expiry >= today
        )
