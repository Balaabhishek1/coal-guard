"""Hardware Registry & Sensor Telemetry ORM Models

Defines IoT hardware assets, continuous diagnostic heartbeats, and high-frequency
environmental gas sensor telemetry stored in TimescaleDB hypertables.
"""

from datetime import datetime
from enum import Enum
from typing import List, Optional
import uuid

from sqlalchemy import (
    Boolean,
    DateTime,
    Double,
    ForeignKey,
    Index,
    PrimaryKeyConstraint,
    String,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class DeviceType(str, Enum):
    """Categorization of colliery IoT and edge hardware assets."""

    TURNSTILE = "TURNSTILE"
    CCTV_CAMERA = "CCTV_CAMERA"
    GAS_SENSOR_CH4 = "GAS_SENSOR_CH4"
    GAS_SENSOR_CO = "GAS_SENSOR_CO"
    AIR_MONITOR = "AIR_MONITOR"
    RFID_BEACON = "RFID_BEACON"


class CommunicationProtocol(str, Enum):
    """Industrial communication protocols used by colliery hardware."""

    MODBUS = "MODBUS"
    RTSP = "RTSP"
    MQTT = "MQTT"
    WIEGAND = "WIEGAND"
    HTTP = "HTTP"


class MetricType(str, Enum):
    """Physical telemetry metric parameters tracked underground."""

    CH4_PERCENT = "CH4_PERCENT"
    CO_PPM = "CO_PPM"
    AIR_VELOCITY = "AIR_VELOCITY"
    TEMPERATURE = "TEMPERATURE"
    HUMIDITY = "HUMIDITY"


class HardwareRegistry(Base):
    """Colliery hardware asset registry tracking connectivity and diagnostics."""

    __tablename__ = "hardware_registry"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
    )
    device_name: Mapped[str] = mapped_column(String(255), nullable=False)
    device_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )
    location_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("mine_locations.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    protocol: Mapped[str] = mapped_column(String(50), nullable=False)
    is_online: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    last_heartbeat: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    location = relationship("MineLocation", foreign_keys=[location_id], lazy="selectin")
    telemetry_readings: Mapped[List["SensorTelemetry"]] = relationship(
        "SensorTelemetry",
        back_populates="hardware",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class SensorTelemetry(Base):
    """Time-series sensor telemetry mapped to a TimescaleDB hypertable.

    Stores continuous measurements for Methane (CH4), Carbon Monoxide (CO),
    and ventilation air velocity.
    """

    __tablename__ = "sensor_telemetry"
    __table_args__ = (
        PrimaryKeyConstraint("time", "hardware_id", "metric_type", name="pk_sensor_telemetry"),
        Index("ix_sensor_telemetry_time_desc", "time"),
        Index("ix_sensor_telemetry_hw_metric_time", "hardware_id", "metric_type", "time"),
    )

    time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )
    hardware_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hardware_registry.id", ondelete="CASCADE"),
        nullable=False,
    )
    metric_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )
    reading_value: Mapped[float] = mapped_column(
        Double,
        nullable=False,
    )

    # Relationship
    hardware: Mapped["HardwareRegistry"] = relationship(
        "HardwareRegistry",
        back_populates="telemetry_readings",
    )
