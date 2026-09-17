"""Pydantic v2 Schemas for Statutory Governance & Audit Ledger

Validates safety violation lifecycle tickets and cryptographic audit chain verification.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
import uuid

from pydantic import BaseModel, ConfigDict, Field


class SeverityEnum(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class StatusEnum(str, Enum):
    DETECTED = "DETECTED"
    NOTICE_SERVED = "NOTICE_SERVED"
    ACTION_TAKEN = "ACTION_TAKEN"
    VERIFIED = "VERIFIED"
    STATUTORY_CLOSEOUT = "STATUTORY_CLOSEOUT"


# ---------------------------------------------------------
# Compliance Violation Schemas
# ---------------------------------------------------------
class ViolationCreate(BaseModel):
    """Payload to raise a new statutory compliance safety violation ticket."""

    location_id: uuid.UUID = Field(..., description="Colliery zone or underground district reference")
    contractor_id: Optional[uuid.UUID] = Field(None, description="Contractor employer reference, if applicable")
    violation_type: str = Field(..., min_length=3, max_length=100, description="Code (e.g., MISSING_SCSR, ROOF_ALERT)")
    title: str = Field(..., min_length=3, max_length=255, description="Brief descriptive hazard summary")
    description: Optional[str] = Field(None, description="Detailed statutory findings or sensor evidence")
    severity: SeverityEnum = Field(default=SeverityEnum.MEDIUM, description="Statutory risk classification")
    deadline_sla: Optional[datetime] = Field(None, description="Custom SLA deadline (computed if omitted)")


class ViolationStatusTransition(BaseModel):
    """Payload to trigger remediation state machine advancement."""

    status: StatusEnum = Field(..., description="Target statutory lifecycle stage")
    remarks: Optional[str] = Field(None, description="Engineering remediation notes or inspection report")


class ViolationResponse(BaseModel):
    """Complete violation ticket entity details."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    location_id: uuid.UUID
    reporter_id: Optional[uuid.UUID] = None
    contractor_id: Optional[uuid.UUID] = None
    violation_type: str
    title: str
    description: Optional[str] = None
    severity: str
    status: str
    deadline_sla: datetime
    created_at: datetime
    resolved_at: Optional[datetime] = None
    location_name: Optional[str] = None
    reporter_name: Optional[str] = None


# ---------------------------------------------------------
# Cryptographic Audit Ledger Schemas
# ---------------------------------------------------------
class AuditLedgerRead(BaseModel):
    """Individual entry in the immutable SHA-256 audit ledger."""

    model_config = ConfigDict(from_attributes=True)

    seq_id: int
    timestamp: datetime
    actor_id: Optional[uuid.UUID] = None
    action_type: str
    payload: Dict[str, Any]
    previous_hash: str
    current_hash: str


class AuditIntegrityResponse(BaseModel):
    """Comprehensive cryptographic validation report over entire audit trail."""

    valid: bool = Field(..., description="True if every hash block and pointer is untampered")
    total_records: int = Field(..., description="Total sequential records evaluated")
    broken_seq_id: Optional[int] = Field(None, description="Sequence ID where hash corruption was detected, if any")
    reason: Optional[str] = Field(None, description="Explanation of verification outcome")
