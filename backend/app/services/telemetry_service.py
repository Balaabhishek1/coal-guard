"""Gas Telemetry Ingestion & Statutory Interlock Service

Ingests multi-row batch gas readings into TimescaleDB hypertable and executes
real-time threshold interlock evaluations under Coal Mines Regulations (CMR 2017).
"""

from datetime import datetime, timezone
import logging
from typing import List
import uuid

from fastapi import HTTPException, status
from sqlalchemy import insert, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.redis import publish_safety_alert
from app.models.telemetry import HardwareRegistry, MetricType, SensorTelemetry
from app.schemas.telemetry import (
    GasIngestPayload,
    GasIngestResponse,
    MetricTypeEnum,
    StatutoryAlert,
)

logger = logging.getLogger("coalguard.telemetry")

# Statutory Thresholds under Coal Mines Regulations (CMR 2017)
STATUTORY_THRESHOLDS = {
    # CMR 2017 Reg 169(1): General body return air concentration warning
    "CH4_WARNING_PERCENT": 0.75,
    # CMR 2017 Reg 169(3): Mandatory electric power cut-off & district withdrawal
    "CH4_CRITICAL_TRIP_PERCENT": 1.25,
    # CMR 2017 Reg 142: Sub-surface spontaneous combustion indication
    "CO_WARNING_PPM": 50.0,
}


class TelemetryService:
    """Service processing high-throughput environmental gas telemetry."""

    @staticmethod
    async def ingest_gas_readings(
        db: AsyncSession,
        payload: GasIngestPayload,
    ) -> GasIngestResponse:
        """Writes batch readings into the TimescaleDB hypertable and evaluates statutory safety interlocks."""
        # 1. Validate device presence and retrieve location metadata
        stmt = (
            select(HardwareRegistry)
            .where(HardwareRegistry.id == payload.hardware_id)
            .options(selectinload(HardwareRegistry.location))
        )
        res = await db.execute(stmt)
        hardware = res.scalar_one_or_none()

        if not hardware:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Telemetry hardware ID '{payload.hardware_id}' not found in registry",
            )

        # Update last heartbeat on the sensor node
        now = datetime.now(timezone.utc)
        hardware.last_heartbeat = now
        hardware.is_online = True

        # 2. Multi-row bulk insert into sensor_telemetry table/hypertable
        insert_rows = [
            {
                "time": payload.timestamp,
                "hardware_id": payload.hardware_id,
                "metric_type": reading.metric_type.value,
                "reading_value": reading.value,
            }
            for reading in payload.readings
        ]

        if insert_rows:
            bulk_stmt = insert(SensorTelemetry).values(insert_rows)
            await db.execute(bulk_stmt)

        await db.commit()

        # 3. Statutory Interlock Evaluation (CMR 2017)
        alerts: List[StatutoryAlert] = []
        critical_trip_active = False

        location_name = hardware.location.location_name if hardware.location else "Unknown Underground District"

        for reading in payload.readings:
            val = reading.value
            metric = reading.metric_type

            # Methane (CH4) Checks
            if metric == MetricTypeEnum.CH4_PERCENT:
                if val >= STATUTORY_THRESHOLDS["CH4_CRITICAL_TRIP_PERCENT"]:
                    critical_trip_active = True
                    alert = StatutoryAlert(
                        alert_type="CRITICAL_CH4_POWER_TRIP",
                        severity="CRITICAL",
                        metric="CH4_PERCENT",
                        value=val,
                        threshold=STATUTORY_THRESHOLDS["CH4_CRITICAL_TRIP_PERCENT"],
                        statutory_rule="CMR 2017 Regulation 169(3)",
                        message=(
                            f"CRITICAL: Methane concentration reached {val:.2f}% (Limit: 1.25%) at '{location_name}'. "
                            f"Mandatory electric power isolation tripped. Immediate personnel withdrawal required."
                        ),
                        timestamp=payload.timestamp,
                    )
                    alerts.append(alert)
                    # Broadcast immediately via Redis
                    await publish_safety_alert(
                        channel="gas_alerts",
                        message={
                            "alert_type": alert.alert_type,
                            "severity": alert.severity,
                            "hardware_id": str(hardware.id),
                            "device_name": hardware.device_name,
                            "location": location_name,
                            "metric": alert.metric,
                            "value": alert.value,
                            "threshold": alert.threshold,
                            "statutory_rule": alert.statutory_rule,
                            "action": "POWER_TRIP_RELAY_SIGNAL",
                            "message": alert.message,
                            "timestamp": payload.timestamp,
                        },
                    )

                elif val >= STATUTORY_THRESHOLDS["CH4_WARNING_PERCENT"]:
                    alert = StatutoryAlert(
                        alert_type="WARNING_CH4_ELEVATED",
                        severity="WARNING",
                        metric="CH4_PERCENT",
                        value=val,
                        threshold=STATUTORY_THRESHOLDS["CH4_WARNING_PERCENT"],
                        statutory_rule="CMR 2017 Regulation 169(1)",
                        message=(
                            f"WARNING: Methane level elevated to {val:.2f}% (Threshold: 0.75%) at '{location_name}'. "
                            f"Inspect ventilation airflow immediately."
                        ),
                        timestamp=payload.timestamp,
                    )
                    alerts.append(alert)
                    await publish_safety_alert(
                        channel="gas_alerts",
                        message={
                            "alert_type": alert.alert_type,
                            "severity": alert.severity,
                            "hardware_id": str(hardware.id),
                            "device_name": hardware.device_name,
                            "location": location_name,
                            "metric": alert.metric,
                            "value": alert.value,
                            "threshold": alert.threshold,
                            "statutory_rule": alert.statutory_rule,
                            "message": alert.message,
                            "timestamp": payload.timestamp,
                        },
                    )

            # Carbon Monoxide (CO) Checks
            elif metric == MetricTypeEnum.CO_PPM:
                if val >= STATUTORY_THRESHOLDS["CO_WARNING_PPM"]:
                    alert = StatutoryAlert(
                        alert_type="WARNING_CO_HEATING",
                        severity="WARNING",
                        metric="CO_PPM",
                        value=val,
                        threshold=STATUTORY_THRESHOLDS["CO_WARNING_PPM"],
                        statutory_rule="CMR 2017 Regulation 142",
                        message=(
                            f"WARNING: Carbon Monoxide level reached {val:.1f} PPM (Threshold: 50 PPM) at '{location_name}'. "
                            f"Possible spontaneous heating of coal seam detected."
                        ),
                        timestamp=payload.timestamp,
                    )
                    alerts.append(alert)
                    await publish_safety_alert(
                        channel="gas_alerts",
                        message={
                            "alert_type": alert.alert_type,
                            "severity": alert.severity,
                            "hardware_id": str(hardware.id),
                            "device_name": hardware.device_name,
                            "location": location_name,
                            "metric": alert.metric,
                            "value": alert.value,
                            "threshold": alert.threshold,
                            "statutory_rule": alert.statutory_rule,
                            "message": alert.message,
                            "timestamp": payload.timestamp,
                        },
                    )

        return GasIngestResponse(
            status="INGESTED",
            hardware_id=payload.hardware_id,
            ingested_count=len(payload.readings),
            alerts_triggered=alerts,
            critical_interlock_active=critical_trip_active,
            timestamp=payload.timestamp,
        )
