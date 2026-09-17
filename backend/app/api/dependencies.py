"""FastAPI Security & Database Dependencies

Provides JWT extraction, current user authentication, and granular RBAC role guards.
"""

from typing import AsyncGenerator, Callable, List, Sequence, Union
import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.security import decode_access_token
from app.db.session import get_async_session
from app.models.user import User, UserRole

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login-form",
    auto_error=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Provides active async database session for request lifecycle."""
    async for session in get_async_session():
        yield session


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Authenticates JWT bearer token and retrieves user model from database."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate statutory credentials or session expired",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not token:
        raise credentials_exception

    payload = decode_access_token(token)
    if not payload:
        raise credentials_exception

    user_id_str: str = payload.get("sub")
    if not user_id_str:
        raise credentials_exception

    try:
        user_uuid = uuid.UUID(user_id_str)
    except ValueError:
        raise credentials_exception

    stmt = (
        select(User)
        .where(User.id == user_uuid)
        .options(selectinload(User.credentials), selectinload(User.contractor))
    )
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Ensures authenticated user account is active."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Worker profile is suspended or deactivated by colliery administration",
        )
    return current_user


def require_role(*allowed_roles: Union[UserRole, str]) -> Callable:
    """Dependency factory enforcing statutory Role-Based Access Control (RBAC).

    Raises 403 Forbidden if the user's role is not within the permitted authorization set.
    """
    normalized_roles: List[str] = [
        r.value if isinstance(r, UserRole) else str(r).upper() for r in allowed_roles
    ]

    async def role_checker(
        current_user: User = Depends(get_current_active_user),
    ) -> User:
        user_role = str(current_user.role).upper()
        if user_role not in normalized_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Statutory Access Denied. Operation requires one of the following roles: "
                    f"{', '.join(normalized_roles)}. Your current role is '{current_user.role}'."
                ),
            )
        return current_user

    return role_checker
