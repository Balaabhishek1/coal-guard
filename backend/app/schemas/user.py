"""Pydantic v2 Schemas for Users, Credentials & Eligibility

Provides strict input validation and response serialization.
"""

from datetime import date, datetime
from typing import List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.user import UserRole


# ---------------------------------------------------------
# Contractor Schemas
# ---------------------------------------------------------
class ContractorBase(BaseModel):
    company_name: str = Field(..., min_length=2, max_length=255)
    contract_code: str = Field(..., min_length=2, max_length=100)
    contact_person: Optional[str] = Field(None, max_length=255)
    contact_phone: Optional[str] = Field(None, max_length=50)
    contact_email: Optional[EmailStr] = None
    safety_rating: float = Field(default=100.0, ge=0.0, le=100.0)
    is_active: bool = True


class ContractorCreate(ContractorBase):
    pass


class ContractorRead(ContractorBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime


class ContractorUpdate(BaseModel):
    company_name: Optional[str] = None
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    safety_rating: Optional[float] = None
    is_active: Optional[bool] = None


# ---------------------------------------------------------
# Worker Credential Schemas
# ---------------------------------------------------------
class WorkerCredentialBase(BaseModel):
    vtc_training_expiry: date = Field(
        ...,
        description="Vocational Training Centre certificate expiry",
    )
    pme_medical_expiry: date = Field(
        ...,
        description="Periodic Medical Examination fitness certificate expiry",
    )
    current_shift_start: Optional[datetime] = None


class WorkerCredentialCreate(WorkerCredentialBase):
    pass


class WorkerCredentialUpdate(BaseModel):
    vtc_training_expiry: Optional[date] = None
    pme_medical_expiry: Optional[date] = None
    current_shift_start: Optional[datetime] = None


class WorkerCredentialRead(WorkerCredentialBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    is_statutorily_eligible: bool


# ---------------------------------------------------------
# User & Identity Schemas
# ---------------------------------------------------------
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=100)
    full_name: str = Field(..., min_length=2, max_length=255)
    email: Optional[EmailStr] = None
    rfid_tag: Optional[str] = Field(None, max_length=128)
    role: UserRole = Field(default=UserRole.MINER)
    contractor_id: Optional[uuid.UUID] = None
    is_active: bool = True


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=128)


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    rfid_tag: Optional[str] = None
    role: Optional[UserRole] = None
    contractor_id: Optional[uuid.UUID] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


class UserRead(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime


class UserWithCredentialsRead(UserRead):
    credentials: Optional[WorkerCredentialRead] = None
    contractor: Optional[ContractorRead] = None


# ---------------------------------------------------------
# Pithead Edge Gate Worker Eligibility Response Schema
# ---------------------------------------------------------
class EligibilityResponse(BaseModel):
    """Sub-millisecond worker clearance evaluation schema consumed by the Pithead Vision Gate."""

    eligible: bool = Field(
        ...,
        description="True if worker passes all statutory checks (Active, VTC, PME, Shift limit)",
    )
    rfid_tag: str = Field(..., description="Badge or cap-lamp RFID identifier")
    worker_id: Optional[uuid.UUID] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    vtc_valid: bool = Field(
        ...,
        description="True if Vocational Training Certificate has not expired",
    )
    vtc_expiry: Optional[date] = None
    pme_valid: bool = Field(
        ...,
        description="True if Periodic Medical Examination clearance has not expired",
    )
    pme_expiry: Optional[date] = None
    shift_limit_valid: bool = Field(
        ...,
        description="True if worker has not exceeded maximum statutory continuous shift duration",
    )
    shift_hours_elapsed: Optional[float] = Field(
        None,
        description="Hours elapsed since current shift start timestamp",
    )
    statutory_reasons: List[str] = Field(
        default_factory=list,
        description="Detailed list of compliance violations or statutory reasons if access is denied",
    )
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="UTC evaluation timestamp",
    )
