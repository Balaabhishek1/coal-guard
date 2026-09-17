"""Authentication & RBAC Security Tests

Validates password hashing, JWT token lifecycle, login flows, and role gating.
"""

from datetime import timedelta
import pytest
from httpx import AsyncClient

from app.core.security import (
    create_access_token,
    decode_access_token,
    get_password_hash,
    verify_password,
)
from app.models.user import UserRole


@pytest.mark.asyncio
async def test_password_hashing_and_verification():
    """Verifies that bcrypt correctly hashes and validates credentials."""
    raw_password = "MineSafetyPassword2026!"
    hashed = get_password_hash(raw_password)

    assert hashed != raw_password
    assert verify_password(raw_password, hashed) is True
    assert verify_password("WrongPassword123", hashed) is False
    assert verify_password("", hashed) is False


@pytest.mark.asyncio
async def test_jwt_token_creation_and_claims():
    """Verifies JWT encoding, claims preservation, and decoding."""
    payload = {
        "sub": "b2c8f8b6-96b5-4b5b-80a5-3a7e584f23e0",
        "role": UserRole.SAFETY_OFFICER.value,
        "rfid_tag": "RFID-TEST-999",
    }
    token = create_access_token(data=payload, expires_delta=timedelta(minutes=30))
    decoded = decode_access_token(token)

    assert decoded is not None
    assert decoded["sub"] == payload["sub"]
    assert decoded["role"] == UserRole.SAFETY_OFFICER.value
    assert decoded["rfid_tag"] == "RFID-TEST-999"
    assert "exp" in decoded
    assert "iat" in decoded


@pytest.mark.asyncio
async def test_login_success_with_username(client: AsyncClient, seed_data):
    """Verifies login via username."""
    response = await client.post(
        "/api/v1/auth/login",
        json={"username": "colliery_mgr", "password": "ManagerSecret2026!"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["username"] == "colliery_mgr"
    assert data["user"]["role"] == UserRole.COLLIERY_MANAGER.value


@pytest.mark.asyncio
async def test_login_success_with_email(client: AsyncClient, seed_data):
    """Verifies login via email address."""
    response = await client.post(
        "/api/v1/auth/login",
        json={"username": "safety@mineguard.in", "password": "SafetySecret2026!"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["username"] == "safety_officer"


@pytest.mark.asyncio
async def test_login_success_with_rfid(client: AsyncClient, seed_data):
    """Verifies login via RFID tag."""
    response = await client.post(
        "/api/v1/auth/login",
        json={"username": "RFID-ELIGIBLE-001", "password": "MinerSecret2026!"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["username"] == "miner_rajesh"


@pytest.mark.asyncio
async def test_login_invalid_password(client: AsyncClient, seed_data):
    """Verifies that invalid passwords are rejected with 401 Unauthorized."""
    response = await client.post(
        "/api/v1/auth/login",
        json={"username": "colliery_mgr", "password": "IncorrectPassword!"},
    )
    assert response.status_code == 401
    assert "Invalid" in response.json()["detail"]


@pytest.mark.asyncio
async def test_login_suspended_account(client: AsyncClient, seed_data):
    """Verifies that deactivated personnel cannot authenticate (403 Forbidden)."""
    response = await client.post(
        "/api/v1/auth/login",
        json={"username": "miner_inactive", "password": "MinerSecret2026!"},
    )
    assert response.status_code == 403
    assert "suspended" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_get_me_profile(client: AsyncClient, seed_data):
    """Verifies /auth/me returns the authenticated user's profile."""
    miner = seed_data["eligible_miner"]
    token = create_access_token(data={"sub": str(miner.id), "role": miner.role})

    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == miner.username
    assert data["role"] == UserRole.MINER.value
    assert data["credentials"] is not None
    assert data["credentials"]["is_statutorily_eligible"] is True


@pytest.mark.asyncio
async def test_rbac_restriction_on_credentials_route(client: AsyncClient, seed_data):
    """Verifies that a MINER cannot modify worker credentials, but a MANAGER can."""
    miner = seed_data["eligible_miner"]
    manager = seed_data["manager"]

    miner_token = create_access_token(data={"sub": str(miner.id), "role": miner.role})
    manager_token = create_access_token(data={"sub": str(manager.id), "role": manager.role})

    update_payload = {
        "vtc_training_expiry": "2027-01-01",
        "pme_medical_expiry": "2027-01-01",
    }

    # 1. Miner attempt -> 403 Forbidden
    denied_res = await client.post(
        f"/api/v1/auth/workers/{miner.id}/credentials",
        json=update_payload,
        headers={"Authorization": f"Bearer {miner_token}"},
    )
    assert denied_res.status_code == 403
    assert "Statutory Access Denied" in denied_res.json()["detail"]

    # 2. Manager attempt -> 201 Created
    allowed_res = await client.post(
        f"/api/v1/auth/workers/{miner.id}/credentials",
        json=update_payload,
        headers={"Authorization": f"Bearer {manager_token}"},
    )
    assert allowed_res.status_code == 201
    assert allowed_res.json()["vtc_training_expiry"] == "2027-01-01"
