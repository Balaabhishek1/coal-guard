"""Authentication, RBAC & Pithead Worker Eligibility Endpoints

Exposes identity validation, token issuance, and sub-millisecond edge turnstile arbitration.
"""

from datetime import timedelta
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.dependencies import (
    get_current_active_user,
    get_current_user,
    get_db,
    require_role,
)
from app.core.config import settings
from app.core.security import (
    create_access_token,
    get_password_hash,
    verify_password,
)
from app.models.user import User, UserRole, WorkerCredential
from app.schemas.auth import LoginRequest, Token
from app.schemas.user import (
    EligibilityResponse,
    UserCreate,
    UserRead,
    UserWithCredentialsRead,
    WorkerCredentialCreate,
    WorkerCredentialRead,
)
from app.services.eligibility_service import EligibilityService

router = APIRouter(prefix="/auth", tags=["Identity & Statutory Access Control"])


@router.post(
    "/login",
    response_model=Token,
    summary="Authenticate User and Issue JWT",
    description="Authenticates personnel via username, email, or RFID badge and issues signed JWT bearer token.",
)
async def login(
    payload: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> Token:
    identifier = payload.username.strip()

    stmt = (
        select(User)
        .where(
            or_(
                User.username == identifier,
                User.email == identifier,
                User.rfid_tag == identifier,
            )
        )
        .options(selectinload(User.credentials), selectinload(User.contractor))
    )
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid colliery identification credentials or incorrect password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been suspended or deactivated",
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token_data = {
        "sub": str(user.id),
        "role": user.role,
        "rfid_tag": user.rfid_tag,
    }
    access_token = create_access_token(
        data=token_data,
        expires_delta=access_token_expires,
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserRead.model_validate(user),
    )


@router.post(
    "/login-form",
    response_model=Token,
    summary="OAuth2 Compatible Form Login",
    description="Supports standard application/x-www-form-urlencoded for Swagger UI authorization.",
)
async def login_form(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
) -> Token:
    return await login(
        LoginRequest(username=form_data.username, password=form_data.password),
        db=db,
    )


@router.post(
    "/register",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
    summary="Register New Personnel Record",
    description="Enrolls new mining personnel. Allowed for Colliery Managers and Safety Officers.",
)
async def register_user(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
) -> UserRead:
    # Check if first user bootstrap or authorized manager
    if current_user is not None:
        user_role = str(current_user.role).upper()
        if user_role not in [
            UserRole.COLLIERY_MANAGER.value,
            UserRole.SAFETY_OFFICER.value,
            UserRole.CORPORATE_HQ.value,
        ]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only Colliery Managers or Safety Officers can register personnel",
            )

    # Check for existing username/email/rfid conflicts
    existing_stmt = select(User).where(
        or_(
            User.username == user_in.username,
            (User.email == user_in.email) if user_in.email else False,
            (User.rfid_tag == user_in.rfid_tag) if user_in.rfid_tag else False,
        )
    )
    existing_result = await db.execute(existing_stmt)
    if existing_result.first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username, email, or RFID tag already allocated in colliery database",
        )

    new_user = User(
        username=user_in.username,
        full_name=user_in.full_name,
        email=user_in.email,
        rfid_tag=user_in.rfid_tag,
        role=user_in.role.value if hasattr(user_in.role, "value") else str(user_in.role),
        contractor_id=user_in.contractor_id,
        hashed_password=get_password_hash(user_in.password),
        is_active=user_in.is_active,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return UserRead.model_validate(new_user)


@router.get(
    "/me",
    response_model=UserWithCredentialsRead,
    summary="Current User Statutory Profile",
    description="Returns full profile, active credentials, and employer information for authenticated user.",
)
async def get_me(
    current_user: User = Depends(get_current_active_user),
) -> UserWithCredentialsRead:
    return UserWithCredentialsRead.model_validate(current_user)


# ---------------------------------------------------------
# Pithead Vision Gate Worker Eligibility Resolver Route
# ---------------------------------------------------------
@router.get(
    "/workers/{rfid_tag}/eligibility",
    response_model=EligibilityResponse,
    summary="Pithead Turnstile Worker Eligibility Resolver",
    description=(
        "Sub-millisecond statutory compliance evaluation invoked by Module 3 Edge Vision Gate. "
        "Evaluates VTC training, Periodic Medical Examination (PME) fitness, and 8-hour shift ceiling."
    ),
)
async def check_worker_eligibility(
    rfid_tag: str,
    db: AsyncSession = Depends(get_db),
) -> EligibilityResponse:
    """High-performance clearance arbitration called during RFID badge scan."""
    return await EligibilityService.resolve_worker_eligibility(db, rfid_tag=rfid_tag)


@router.get(
    "/workers/id/{worker_id}/eligibility",
    response_model=EligibilityResponse,
    summary="Worker Eligibility Lookup by UUID",
    description="Provides eligibility arbitration resolution referenced by primary worker UUID.",
)
async def check_worker_eligibility_by_id(
    worker_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> EligibilityResponse:
    return await EligibilityService.resolve_worker_eligibility_by_id(
        db,
        worker_id=worker_id,
    )


@router.post(
    "/workers/{rfid_tag}/shift-start",
    summary="Record Pithead Descent Turnstile Ingress",
    description="Commences active shift countdown when miner actuates pithead turnstile.",
)
async def record_shift_start(
    rfid_tag: str,
    db: AsyncSession = Depends(get_db),
):
    cred = await EligibilityService.record_shift_start(db, rfid_tag=rfid_tag)
    if not cred:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Worker or credentials record not found for specified RFID tag",
        )
    return {
        "status": "SHIFT_COMMENCED",
        "rfid_tag": rfid_tag,
        "shift_start": cred.current_shift_start,
    }


@router.post(
    "/workers/{rfid_tag}/shift-end",
    summary="Record Pithead Egress Turnstile Outbye",
    description="Concludes active shift record when miner resurfaces at shaft collar.",
)
async def record_shift_end(
    rfid_tag: str,
    db: AsyncSession = Depends(get_db),
):
    cred = await EligibilityService.record_shift_end(db, rfid_tag=rfid_tag)
    if not cred:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Worker or credentials record not found for specified RFID tag",
        )
    return {
        "status": "SHIFT_CONCLUDED",
        "rfid_tag": rfid_tag,
    }


@router.post(
    "/workers/{user_id}/credentials",
    response_model=WorkerCredentialRead,
    status_code=status.HTTP_201_CREATED,
    summary="Assign Statutory Credentials to Worker",
    description="Registers VTC and PME compliance dates for a worker. Restricted to safety officers.",
)
async def set_worker_credentials(
    user_id: uuid.UUID,
    cred_in: WorkerCredentialCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_role(
            UserRole.COLLIERY_MANAGER,
            UserRole.SAFETY_OFFICER,
            UserRole.CORPORATE_HQ,
        )
    ),
) -> WorkerCredentialRead:
    # Check user existence
    user_stmt = select(User).where(User.id == user_id).options(selectinload(User.credentials))
    res = await db.execute(user_stmt)
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Worker ID does not exist",
        )

    if user.credentials:
        # Update existing
        user.credentials.vtc_training_expiry = cred_in.vtc_training_expiry
        user.credentials.pme_medical_expiry = cred_in.pme_medical_expiry
        if cred_in.current_shift_start is not None:
            user.credentials.current_shift_start = cred_in.current_shift_start
        cred = user.credentials
    else:
        # Create new
        cred = WorkerCredential(
            user_id=user_id,
            vtc_training_expiry=cred_in.vtc_training_expiry,
            pme_medical_expiry=cred_in.pme_medical_expiry,
            current_shift_start=cred_in.current_shift_start,
        )
        db.add(cred)

    await db.commit()
    await db.refresh(cred)
    return WorkerCredentialRead.model_validate(cred)
