"""Hardware Diagnostics & Edge Gateway Endpoints

Manages equipment enrollment, keep-alive heartbeats, and colliery-wide status matrix.
"""

from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_db
from app.schemas.telemetry import (
    HardwareHeartbeat,
    HardwareRegister,
    HardwareResponse,
    HardwareStatusMatrix,
    HeartbeatResponse,
)
from app.services.hardware_service import HardwareService

router = APIRouter(prefix="/hardware", tags=["Hardware Diagnostics & Edge Gateway"])


@router.post(
    "/register",
    response_model=HardwareResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register Colliery Hardware Asset",
    description="Enrolls edge devices (CCTV cameras, pithead turnstiles, telemetry nodes) into system inventory.",
)
async def register_hardware(
    payload: HardwareRegister,
    db: AsyncSession = Depends(get_db),
) -> HardwareResponse:
    device = await HardwareService.register_device(db, payload)
    return HardwareResponse.model_validate(device)


@router.post(
    "/heartbeat",
    response_model=HeartbeatResponse,
    summary="Ingest Edge Hardware Heartbeat",
    description="Ingests connectivity and latency pings from underground nodes and triggers offline alerts on dropout.",
)
async def ingest_heartbeat(
    payload: HardwareHeartbeat,
    db: AsyncSession = Depends(get_db),
) -> HeartbeatResponse:
    return await HardwareService.record_heartbeat(db, payload)


@router.get(
    "/matrix",
    response_model=List[HardwareStatusMatrix],
    summary="Retrieve Colliery Hardware Diagnostic Matrix",
    description="Provides real-time health, connectivity status, and zone topology for all registered colliery assets.",
)
async def get_hardware_matrix(
    db: AsyncSession = Depends(get_db),
) -> List[HardwareStatusMatrix]:
    return await HardwareService.get_diagnostic_matrix(db)
