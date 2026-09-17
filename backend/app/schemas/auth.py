"""Authentication & Token Schemas

Defines JWT login requests, token structures, and decoded claims payload.
"""

from typing import Optional
from pydantic import BaseModel, Field, model_validator

from app.schemas.user import UserRead


class LoginRequest(BaseModel):
    """User credentials for authentication.

    Supports rfid_tag or username paired with password.
    """

    username: Optional[str] = Field(
        None,
        description="Username, email address, or identification handle",
    )
    rfid_tag: Optional[str] = Field(
        None,
        description="RFID badge or cap-lamp identifier",
    )
    password: str = Field(..., description="Plaintext secret password")

    @model_validator(mode="after")
    def validate_identifier(self):
        if not self.username and not self.rfid_tag:
            raise ValueError("Either 'username' or 'rfid_tag' must be supplied.")
        return self


class Token(BaseModel):
    """JWT Bearer access token response."""

    access_token: str
    token_type: str = "bearer"
    expires_in: Optional[int] = Field(
        None,
        description="Token expiration lifespan in seconds",
    )
    user: Optional[UserRead] = None


class TokenPayload(BaseModel):
    """Decoded JWT payload containing statutory claims."""

    sub: str = Field(..., description="User ID (UUID)")
    role: str = Field(..., description="Statutory role of the user")
    rfid_tag: Optional[str] = None
    exp: int
    iat: Optional[int] = None
