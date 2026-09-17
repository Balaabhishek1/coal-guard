"""Pydantic v2 Schemas for Hardware Diagnostics & Gas Telemetry

Validates edge hardware registration, heartbeat telemetry, and high-throughput
environmental gas readings under Coal Mines Regulations (CMR 2017).
"""

from datetime import datetime
from enum import Enum
from typing import List, Optional
import uuid

from pydantic import BaseModel, ConfigDict, Field, field_validator


class DeviceTypeEnum(str, Enum):
    TURNSTILE = "TURNSTILE"
    CCTV_CAMERA = "CCTV_CAMERA"
    GAS_SENSOR_CH4 = "GAS_SENSOR_CH4"
    GAS_SENSOR_CO = "GAS_SENSOR_CO"
    AIR_MONITOR = "AIR_MONITOR"
    RFID_BEACON = "RFID_BEACON"


class ProtocolEnum(str, Enum):
    MODBUS = "MODBUS"
    RTSP = "RTSP"
    MQTT = "MQTT"
    WIEGAND = "WIEGAND"
    HTTP = "HTTP"


class MetricTypeEnum(str, Enum):
    CH4_PERCENT = "CH4_PERCENT"
    CO_PPM = "CO_PPM"
    AIR_VELOCITY = "AIR_VELOCITY"
    TEMPERATURE = "TEMPERATURE"
    HUMIDITY = "HUMIDITY"


class DeviceStatusEnum(str, Enum):
    ONLINE = "ONLINE"
    OFFLINE = "OFFLINE"
    DEGRADED = "DEGRADED"


# ---------------------------------------------------------
# Hardware Registry & Diagnostic Schemas
# ---------------------------------------------------------
class HardwareRegister(BaseModel):
    """Payload to enroll IoT equipment into colliery monitoring network."""

    device_name: str = Field(..., min_length=2, max_length=255, description="Unique asset identifier label")
    device_type: DeviceTypeEnum = Field(..., description="Classification category")
    location_id: Optional[uuid.UUID] = Field(None, description="Physical mine zone or seam reference UUID")
    ip_address: Optional[str] = Field(None, max_length=45, description="IPv4 or IPv6 network address")
    protocol: ProtocolEnum = Field(..., description="Communication interface protocol")


class HardwareResponse(BaseModel):
    """Registered hardware asset entity details."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    device_name: str
    device_type: str
    location_id: Optional[uuid.UUID] = None
    ip_address: Optional[str] = None
    protocol: str
    is_online: bool
    last_heartbeat: Optional[datetime] = None
    created_at: datetime


class HardwareHeartbeat(BaseModel):
    """Heartbeat telemetry sent periodically by edge devices."""

    hardware_id: uuid.UUID = Field(..., description="Device asset UUID")
    status: DeviceStatusEnum = Field(default=DeviceStatusEnum.ONLINE, description="Current operational state")
    latency_ms: Optional[float] = Field(None, ge=0.0, description="Ping round-trip latency in milliseconds")


class HeartbeatResponse(BaseModel):
    """Acknowledgment payload returned to edge device."""

    status: str = "ACK"
    hardware_id: uuid.UUID
    recorded_at: datetime
    is_online: bool


class HardwareStatusMatrix(BaseModel):
    """Diagnostic health state of an integrated hardware asset for control room overview."""

    hardware_id: uuid.UUID
    device_name: str
    device_type: str
    is_online: bool
    last_heartbeat: Optional[datetime] = None
    location_id: Optional[uuid.UUID] = None
    location_name: Optional[str] = None
    ip_address: Optional[str] = None
    protocol: Optional[str] = None
    latency_ms: Optional[float] = None


# ---------------------------------------------------------
# Gas Telemetry Ingestion Schemas
# ---------------------------------------------------------
class GasReading(BaseModel):
    """Individual physical environmental measurement."""

    metric_type: MetricTypeEnum = Field(..., description="Measured gas parameter or environmental metric")
    value: float = Field(..., description="Numeric sensor reading (e.g., % CH4, PPM CO, m/s air velocity)")

    @field_validator("value")
    @classmethod
    def validate_reading_bounds(cls, v: float, info) -> float:
        # Basic physical sanity check (negative concentration is impossible)
        if v < 0.0:
            raise ValueError("Telemetry measurement value cannot be negative")
        return v


class GasIngestPayload(BaseModel):
    """High-throughput multi-reading sensor payload transmitted by underground telemetry node."""

    hardware_id: uuid.UUID = Field(..., description="Originating multi-gas sensor UUID")
    timestamp: datetime = Field(..., description="UTC sample acquisition timestamp")
    readings: List[GasReading] = Field(..., min_length=1, description="List of physical sensor metric readings")


class StatutoryAlert(BaseModel):
    """Details of statutory safety alarms triggered during batch ingestion."""

    alert_type: str
    severity: str
    metric: str
    value: float
    threshold: float
    statutory_rule: str
    message: str
    timestamp: datetime


class GasIngestResponse(BaseModel):
    """Ingestion confirmation returning interlock alerts triggered."""

    status: str = "INGESTED"
    hardware_id: uuid.UUID
    ingested_count: int
    alerts_triggered: List[StatutoryAlert] = Field(default_factory=list)
    critical_interlock_active: bool = False
    timestamp: datetime
