"""Authentication & Token Schemas

Defines JWT login requests, token structures, and decoded claims payload.
"""

from typing import Optional
from pydantic import BaseModel, Field

from app.schemas.user import UserRead


class LoginRequest(BaseModel):
    """User credentials for authentication.

    Supports username, email, or RFID tag identifier paired with password.
    """

    username: str = Field(
        ...,
        description="Username, email address, or RFID badge identifier",
    )
    password: str = Field(..., description="Plaintext secret password")


class Token(BaseModel):
    """JWT Bearer access token response."""

    access_token: str
    token_type: str = "bearer"
    expires_in: int = Field(
        ...,
        description="Token expiration lifespan in seconds",
    )
    user: UserRead


class TokenPayload(BaseModel):
    """Decoded JWT payload containing statutory claims."""

    sub: str = Field(..., description="User ID (UUID)")
    role: str = Field(..., description="Statutory role of the user")
    rfid_tag: Optional[str] = None
    exp: int
    iat: Optional[int] = None
