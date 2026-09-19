"""Statutory PDF Report & Compliance Scorecard API Endpoints

Generates and streams Directorate General of Mines Safety (DGMS) CMR 2017 Form IV reports,
Mine Safety Risk Index (MSRI) scorecards, and Cryptographic Audit Chain verification certificates.
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, Query, Response, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_db
from app.services.pdf_generator import PDFReportService

logger = logging.getLogger("coalguard.api.reports")

router = APIRouter(prefix="/reports", tags=["Statutory Reports & PDF Exporters"])


class ReportGeneratePayload(BaseModel):
    """Payload for generating statutory PDF reports."""

    report_type: str = Field(..., description="Report type: DGMS_SHIFT_SUMMARY, MSRI_SCORECARD, AUDIT_CHAIN_VERIFICATION")
    start_date: Optional[str] = Field(None, description="Report interval start date (ISO)")
    end_date: Optional[str] = Field(None, description="Report interval end date (ISO)")
    location_id: Optional[str] = Field(None, description="Optional mine location UUID")
    mine_code: Optional[str] = Field("MINE-ALPHA-01", description="Statutory Colliery Code")
    shift: Optional[str] = Field("SHIFT_1", description="Operational Shift (SHIFT_1, SHIFT_2, SHIFT_3)")


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


@router.post(
    "/generate",
    summary="Generate & Stream Statutory PDF Report",
    description="Generates DGMS Form IV, MSRI scorecard, or Cryptographic Audit Chain proof PDF based on report_type.",
    responses={
        200: {
            "content": {"application/pdf": {}},
            "description": "Generated Statutory Report in PDF format.",
        }
    },
)
async def generate_report(
    payload: ReportGeneratePayload,
    db: AsyncSession = Depends(get_db),
):
    report_type = payload.report_type.upper()
    mine_code = payload.mine_code or "MINE-ALPHA-01"
    shift = payload.shift or "SHIFT_1"

    if report_type in ("DGMS_SHIFT_SUMMARY", "DGMS_SHIFT", "DGMS_FORM_IV", "DGMS"):
        data = await PDFReportService.get_dgms_report_data(db, mine_code=mine_code, shift=shift)
        pdf_bytes = PDFReportService.generate_dgms_shift_report(data)
        filename = f"DGMS_Form_IV_Shift_Report_{mine_code}_{shift}.pdf"
    elif report_type in ("MSRI_SCORECARD", "MSRI", "SCORECARD"):
        data = await PDFReportService.get_msri_data(db, mine_code=mine_code)
        pdf_bytes = PDFReportService.generate_msri_scorecard(data)
        filename = f"MSRI_Safety_Scorecard_{mine_code}.pdf"
    elif report_type in ("AUDIT_CHAIN_VERIFICATION", "AUDIT_PROOF", "AUDIT_CHAIN"):
        data = await PDFReportService.get_audit_proof_data(db)
        pdf_bytes = PDFReportService.generate_audit_chain_proof(data)
        filename = "Audit_Ledger_Cryptographic_Proof.pdf"
    else:
        # Default fallback to DGMS
        data = await PDFReportService.get_dgms_report_data(db, mine_code=mine_code, shift=shift)
        pdf_bytes = PDFReportService.generate_dgms_shift_report(data)
        filename = f"Statutory_Report_{mine_code}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

