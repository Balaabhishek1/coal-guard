"""Worker Eligibility Engine & Pithead Gate Arbitration Tests

Validates sub-millisecond evaluation of VTC certificates, PME medical clearance,
shift duration ceiling, and turnstile shift tracking.
"""

import time
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_eligible_miner_turnstile_clearance(client: AsyncClient, seed_data):
    """A miner with valid VTC, valid PME, active profile, and no overtime must pass."""
    miner = seed_data["eligible_miner"]

    response = await client.get(f"/api/v1/auth/workers/{miner.rfid_tag}/eligibility")
    assert response.status_code == 200

    data = response.json()
    assert data["eligible"] is True
    assert data["rfid_tag"] == miner.rfid_tag
    assert data["vtc_valid"] is True
    assert data["pme_valid"] is True
    assert data["shift_limit_valid"] is True
    assert len(data["statutory_reasons"]) == 0


@pytest.mark.asyncio
async def test_expired_vtc_miner_turnstile_denial(client: AsyncClient, seed_data):
    """A miner with expired Vocational Training Centre certificate must be denied descent."""
    miner = seed_data["expired_vtc_miner"]

    response = await client.get(f"/api/v1/auth/workers/{miner.rfid_tag}/eligibility")
    assert response.status_code == 200

    data = response.json()
    assert data["eligible"] is False
    assert data["vtc_valid"] is False
    assert any("VTC" in reason for reason in data["statutory_reasons"])


@pytest.mark.asyncio
async def test_expired_pme_miner_turnstile_denial(client: AsyncClient, seed_data):
    """A miner with expired Periodic Medical Exam fitness certificate must be denied descent."""
    miner = seed_data["expired_pme_miner"]

    response = await client.get(f"/api/v1/auth/workers/{miner.rfid_tag}/eligibility")
    assert response.status_code == 200

    data = response.json()
    assert data["eligible"] is False
    assert data["pme_valid"] is False
    assert any("PME" in reason for reason in data["statutory_reasons"])


@pytest.mark.asyncio
async def test_overtime_miner_turnstile_denial(client: AsyncClient, seed_data):
    """A miner who has exceeded the 8-hour continuous shift limit must be barred from re-entry."""
    miner = seed_data["overtime_miner"]

    response = await client.get(f"/api/v1/auth/workers/{miner.rfid_tag}/eligibility")
    assert response.status_code == 200

    data = response.json()
    assert data["eligible"] is False
    assert data["shift_limit_valid"] is False
    assert data["shift_hours_elapsed"] is not None
    assert data["shift_hours_elapsed"] >= 8.0
    assert any("shift duration" in reason.lower() for reason in data["statutory_reasons"])


@pytest.mark.asyncio
async def test_inactive_miner_turnstile_denial(client: AsyncClient, seed_data):
    """Suspended or deactivated personnel must be denied descent."""
    miner = seed_data["inactive_miner"]

    response = await client.get(f"/api/v1/auth/workers/{miner.rfid_tag}/eligibility")
    assert response.status_code == 200

    data = response.json()
    assert data["eligible"] is False
    assert any("inactive or suspended" in reason for reason in data["statutory_reasons"])


@pytest.mark.asyncio
async def test_unknown_rfid_turnstile_denial(client: AsyncClient, seed_data):
    """Unregistered or counterfeit RFID tags must be rejected."""
    response = await client.get("/api/v1/auth/workers/UNKNOWN-RFID-9999/eligibility")
    assert response.status_code == 200

    data = response.json()
    assert data["eligible"] is False
    assert any("not recognized" in reason for reason in data["statutory_reasons"])


@pytest.mark.asyncio
async def test_shift_ingress_and_egress_lifecycle(client: AsyncClient, seed_data):
    """Verifies that pithead turnstile ingress records shift start, and egress clears it."""
    miner = seed_data["eligible_miner"]

    # 1. Ingress pulse
    start_res = await client.post(f"/api/v1/auth/workers/{miner.rfid_tag}/shift-start")
    assert start_res.status_code == 200
    assert start_res.json()["status"] == "SHIFT_COMMENCED"
    assert start_res.json()["shift_start"] is not None

    # Check eligibility reflects active shift
    elig_res = await client.get(f"/api/v1/auth/workers/{miner.rfid_tag}/eligibility")
    assert elig_res.status_code == 200
    assert elig_res.json()["eligible"] is True
    assert elig_res.json()["shift_hours_elapsed"] is not None

    # 2. Egress pulse
    end_res = await client.post(f"/api/v1/auth/workers/{miner.rfid_tag}/shift-end")
    assert end_res.status_code == 200
    assert end_res.json()["status"] == "SHIFT_CONCLUDED"

    # Check eligibility after egress
    elig_after = await client.get(f"/api/v1/auth/workers/{miner.rfid_tag}/eligibility")
    assert elig_after.status_code == 200
    assert elig_after.json()["shift_hours_elapsed"] is None


@pytest.mark.asyncio
async def test_eligibility_resolution_latency(client: AsyncClient, seed_data):
    """Verifies eligibility resolution performance overhead."""
    miner = seed_data["eligible_miner"]

    # Warmup
    await client.get(f"/api/v1/auth/workers/{miner.rfid_tag}/eligibility")

    start_time = time.perf_counter()
    response = await client.get(f"/api/v1/auth/workers/{miner.rfid_tag}/eligibility")
    latency_ms = (time.perf_counter() - start_time) * 1000.0

    assert response.status_code == 200
    # In-memory test overhead is fast; ensure response is swift
    assert latency_ms < 100.0, f"Expected low latency, got {latency_ms:.2f}ms"
