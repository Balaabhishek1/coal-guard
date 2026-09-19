"""Industrial Gas Telemetry Ingestion Endpoints

High-throughput multi-reading sensor ingestion with statutory safety interlocks.
"""

from typing import List, Optional
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


@router.get(
    "/gas/history",
    summary="Retrieve Historical Environmental Gas Telemetry Points",
    description="Fetches aggregated time-series readings for continuous chart visualization.",
)
async def get_gas_history(
    metric_type: str = "CH4_PERCENT",
    time_range: str = "24h",
    hardware_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_db),
):
    from datetime import datetime, timedelta, timezone

    now = datetime.now(timezone.utc)
    delta = timedelta(hours=24)
    if time_range == "1h":
        delta = timedelta(hours=1)
    elif time_range == "6h":
        delta = timedelta(hours=6)
    elif time_range == "7d":
        delta = timedelta(days=7)

    since = now - delta

    conditions = [
        SensorTelemetry.time >= since,
        SensorTelemetry.metric_type == metric_type,
    ]
    if hardware_id:
        conditions.append(SensorTelemetry.hardware_id == hardware_id)

    stmt = (
        select(SensorTelemetry)
        .where(*conditions)
        .order_by(SensorTelemetry.time.asc())
        .limit(200)
    )
    res = await db.execute(stmt)
    records = res.scalars().all()

    points = [
        {
            "bucket": r.time.isoformat(),
            "avg_reading": r.reading_value,
            "peak_reading": r.reading_value,
        }
        for r in records
    ]

    return {
        "metric_type": metric_type,
        "time_range": time_range,
        "points": points,
    }

