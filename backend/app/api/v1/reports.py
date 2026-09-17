"""Statutory PDF Report & Compliance Scorecard API Endpoints

Generates and streams Directorate General of Mines Safety (DGMS) CMR 2017 Form IV reports,
Mine Safety Risk Index (MSRI) scorecards, and Cryptographic Audit Chain verification certificates.
"""

import logging

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_db
from app.services.pdf_generator import PDFReportService

logger = logging.getLogger("coalguard.api.reports")

router = APIRouter(prefix="/reports", tags=["Statutory Reports & PDF Exporters"])


@router.get(
    "/dgms-shift",
    summary="Download DGMS Shift Safety Report (CMR 2017 Form IV)",
    description="Compiles atmospheric gas telemetry, statutory violations, and pithead turnstile descent audits into an official PDF.",
    responses={
        200: {
            "content": {"application/pdf": {}},
            "description": "Statutory DGMS Shift Safety Report in PDF format.",
        }
    },
)
async def download_dgms_shift_report(
    mine_code: str = Query("MINE-ALPHA-01", description="Statutory Colliery Identifier"),
    shift: str = Query("SHIFT_1", description="Operational Shift (SHIFT_1, SHIFT_2, SHIFT_3)"),
    db: AsyncSession = Depends(get_db),
):
    data = await PDFReportService.get_dgms_report_data(db, mine_code=mine_code, shift=shift)
    pdf_bytes = PDFReportService.generate_dgms_shift_report(data)

    filename = f"DGMS_Form_IV_Shift_Report_{mine_code}_{shift}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get(
    "/msri-scorecard",
    summary="Download Mine Safety Risk Index (MSRI) Scorecard",
    description="Generates an executive safety scorecard summarizing aggregate hazards, ventilation risk, and PPE compliance.",
    responses={
        200: {
            "content": {"application/pdf": {}},
            "description": "MSRI Safety Risk Scorecard in PDF format.",
        }
    },
)
async def download_msri_scorecard(
    mine_code: str = Query("MINE-ALPHA-01", description="Statutory Colliery Identifier"),
    db: AsyncSession = Depends(get_db),
):
    data = await PDFReportService.get_msri_data(db, mine_code=mine_code)
    pdf_bytes = PDFReportService.generate_msri_scorecard(data)

    filename = f"MSRI_Safety_Scorecard_{mine_code}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get(
    "/audit-chain-proof",
    summary="Download Cryptographic Audit Chain Integrity Certificate",
    description="Traverses SHA-256 linear hash chain blocks and outputs an authenticated statutory digital certificate.",
    responses={
        200: {
            "content": {"application/pdf": {}},
            "description": "Cryptographic Audit Ledger Proof in PDF format.",
        }
    },
)
async def download_audit_chain_proof(
    db: AsyncSession = Depends(get_db),
):
    data = await PDFReportService.get_audit_proof_data(db)
    pdf_bytes = PDFReportService.generate_audit_chain_proof(data)

    filename = "Audit_Ledger_Cryptographic_Proof.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
