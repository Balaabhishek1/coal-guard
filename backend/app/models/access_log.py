"""Edge Vision Gate Access Log ORM Model

Captures post-turnstile optical and credential actuation events at pithead ingress points,
recording wearer compliance, gate mechanics, and biometric visual crops under CMR 2017.
"""

from datetime import datetime, timezone
from typing import Optional
import uuid

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    JSON,
    String,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class AccessAttemptLog(Base):
    """Immutable audit record of a worker ingress attempt at a turnstile or vision gate."""

    __tablename__ = "access_attempt_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    rfid_tag: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
        index=True,
    )
    location_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("mine_locations.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    optical_compliance: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )
    credential_eligibility: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )
    gate_actuated: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )
    wear_states: Mapped[dict] = mapped_column(
        JSON().with_variant(JSONB, "postgresql"),
        nullable=False,
    )
    snapshot_crop_url: Mapped[Optional[str]] = mapped_column(
        String(512),
        nullable=True,
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
    location = relationship("MineLocation", foreign_keys=[location_id])

    def __repr__(self) -> str:
        return (
            f"<AccessAttemptLog(id={self.id}, rfid='{self.rfid_tag}', "
            f"actuated={self.gate_actuated}, optical={self.optical_compliance})>"
        )
