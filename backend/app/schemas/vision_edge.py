"""Edge Vision Gate & Real-time WebSocket Multiplexer Schemas

Defines Pydantic v2 validation models for post-turnstile optical compliance events,
wearer state telemetry, and real-time control room WebSocket payload envelopes.
"""

from datetime import datetime
from typing import Any, Dict, Optional
import uuid

from pydantic import BaseModel, ConfigDict, Field


class WearStateDetails(BaseModel):
    """Statutory PPE detector confidence states at pithead turnstile camera."""

    hardhat_worn: bool = Field(..., description="True if industrial safety hardhat is detected on head")
    vest_worn: bool = Field(..., description="True if high-visibility reflective safety vest is detected")
    scsr_worn: bool = Field(..., description="True if Self-Contained Self-Rescuer apparatus is detected")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "hardhat_worn": True,
                "vest_worn": True,
                "scsr_worn": False,
            }
        }
    )


class EdgeAccessEventPayload(BaseModel):
    """Post-turnstile actuation metadata payload ingested from edge vision mini-PCs."""

    rfid_tag: str = Field(..., min_length=1, max_length=128, description="Scanned RFID tag UID")
    location_id: uuid.UUID = Field(..., description="MineLocation UUID for the pithead turnstile gate")
    optical_compliance: bool = Field(..., description="True if all statutory PPE items are confirmed worn")
    credential_eligibility: bool = Field(..., description="True if worker passed VTC/PME/Shift eligibility")
    gate_actuated: bool = Field(..., description="True if physical turnstile unlocked, False if denied/held")
    wear_states: WearStateDetails = Field(..., description="Individual PPE wear states")
    snapshot_crop_url: Optional[str] = Field(None, max_length=512, description="URL/path to visual crop evidence")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "rfid_tag": "RFID-MINER-0091",
                "location_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
                "optical_compliance": False,
                "credential_eligibility": True,
                "gate_actuated": False,
                "wear_states": {
                    "hardhat_worn": True,
                    "vest_worn": True,
                    "scsr_worn": False,
                },
                "snapshot_crop_url": "https://storage.mineguard.internal/crops/gate_01_20260917.jpg",
            }
        }
    )


class AccessAttemptResponse(BaseModel):
    """Response returned after processing post-turnstile actuation event."""

    status: str = Field(default="logged", description="Status code of logging transaction")
    access_log_id: uuid.UUID = Field(..., description="UUID of persisted AccessAttemptLog entry")
    violation_ticket_created: bool = Field(..., description="True if non-compliance resulted in a violation ticket")
    violation_id: Optional[uuid.UUID] = Field(None, description="UUID of created ComplianceViolation if applicable")
    timestamp: datetime = Field(..., description="Timestamp when event was processed")

    model_config = ConfigDict(from_attributes=True)


class WSEventMessage(BaseModel):
    """Standardized real-time WebSocket envelope broadcasted to Control Room HUD clients."""

    event_type: str = Field(..., description="Identifier (GATE_ACCESS_ATTEMPT, GAS_SPIKE_ALERT, HARDWARE_OFFLINE, etc.)")
    data: Dict[str, Any] = Field(..., description="Arbitrary event payload data dictionary")
    timestamp: str = Field(..., description="ISO 8601 UTC timestamp of event dispatch")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "event_type": "GATE_ACCESS_ATTEMPT",
                "data": {
                    "rfid_tag": "RFID-MINER-0091",
                    "worker_name": "Ramesh Kumar",
                    "optical_compliance": False,
                    "gate_actuated": False,
                    "violation_ticket_created": True,
                },
                "timestamp": "2026-09-17T17:05:00.000000+00:00",
            }
        }
    )
