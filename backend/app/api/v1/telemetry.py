"""Industrial Gas Telemetry Ingestion Endpoints

High-throughput multi-reading sensor ingestion with statutory safety interlocks.
"""

from typing import List
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_db
from app.models.telemetry import SensorTelemetry
from app.schemas.telemetry import (
    GasIngestPayload,
    GasIngestResponse,
    GasReading,
)
from app.services.telemetry_service import TelemetryService

router = APIRouter(prefix="/telemetry", tags=["Industrial Telemetry & Gas Ingestion"])


@router.post(
    "/ingest/gas",
    response_model=GasIngestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Batch Ingest Environmental Gas Telemetry",
    description=(
        "High-throughput multi-row sensor telemetry ingestion into TimescaleDB hypertable. "
        "Enforces Coal Mines Regulations (CMR 2017) interlock checks: triggers warning alert "
        "if CH4 >= 0.75% or CO >= 50 PPM, and critical emergency power isolation if CH4 >= 1.25%."
    ),
)
async def ingest_gas_telemetry(
    payload: GasIngestPayload,
    db: AsyncSession = Depends(get_db),
) -> GasIngestResponse:
    """Ingests multi-reading sensor payload with sub-second statutory threshold arbitration."""
    return await TelemetryService.ingest_gas_readings(db, payload)


@router.get(
    "/hardware/{hardware_id}/latest",
    summary="Retrieve Latest Sensor Telemetry for Device",
    description="Fetches recent environmental telemetry readings recorded for a specified hardware node.",
)
async def get_latest_device_telemetry(
    hardware_id: uuid.UUID,
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(SensorTelemetry)
        .where(SensorTelemetry.hardware_id == hardware_id)
        .order_by(desc(SensorTelemetry.time))
        .limit(min(100, max(1, limit)))
    )
    res = await db.execute(stmt)
    records = res.scalars().all()

    return {
        "hardware_id": hardware_id,
        "count": len(records),
        "readings": [
            {
                "time": r.time,
                "metric_type": r.metric_type,
                "reading_value": r.reading_value,
            }
            for r in records
        ],
    }
