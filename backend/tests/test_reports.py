"""Tests for Statutory PDF Exporter Endpoints (Phase 6)

Validates Directorate General of Mines Safety (DGMS) shift reports,
Mine Safety Risk Index (MSRI) scorecards, and cryptographic audit proofs.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.audit_service import HashChainService


@pytest.mark.asyncio
async def test_download_dgms_shift_report(client: AsyncClient):
    """Verifies that DGMS shift report compiles and streams valid binary PDF."""
    response = await client.get("/api/v1/reports/dgms-shift", params={"mine_code": "MINE-ECL-04", "shift": "SHIFT_1"})
    assert response.status_code == 200
    assert "application/pdf" in response.headers.get("content-type", "")
    assert "attachment" in response.headers.get("content-disposition", "")
    assert "DGMS_Form_IV_Shift_Report_MINE-ECL-04_SHIFT_1.pdf" in response.headers.get("content-disposition", "")

    # Validate standard PDF magic bytes header (%PDF-)
    content = response.content
    assert content.startswith(b"%PDF-")
    assert len(content) > 1000


@pytest.mark.asyncio
async def test_download_msri_scorecard(client: AsyncClient):
    """Verifies that MSRI safety risk scorecard compiles and streams valid binary PDF."""
    response = await client.get("/api/v1/reports/msri-scorecard", params={"mine_code": "MINE-ECL-04"})
    assert response.status_code == 200
    assert "application/pdf" in response.headers.get("content-type", "")
    assert "MSRI_Safety_Scorecard_MINE-ECL-04.pdf" in response.headers.get("content-disposition", "")

    content = response.content
    assert content.startswith(b"%PDF-")
    assert len(content) > 1000


@pytest.mark.asyncio
async def test_download_audit_chain_proof(client: AsyncClient, db_session: AsyncSession):
    """Verifies that cryptographic audit chain proof compiles and streams valid binary PDF."""
    # Seed audit ledger blocks
    await HashChainService.append_log(
        db=db_session,
        action_type="TEST_INSPECTION_RECORDED",
        actor_id=None,
        payload={"note": "Initial shift inspection record"},
    )
    await HashChainService.append_log(
        db=db_session,
        action_type="TEST_CORRECTIVE_ACTION",
        actor_id=None,
        payload={"note": "Ventilation adjustment verified"},
    )

    response = await client.get("/api/v1/reports/audit-chain-proof")
    assert response.status_code == 200
    assert "application/pdf" in response.headers.get("content-type", "")
    assert "Audit_Ledger_Cryptographic_Proof.pdf" in response.headers.get("content-disposition", "")

    content = response.content
    assert content.startswith(b"%PDF-")
    assert len(content) > 1000
