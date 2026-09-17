"""Hardware Diagnostic & Health Management Service

Handles device registration, heartbeat tracking, and control room status matrix.
"""

from datetime import datetime, timezone
import logging
from typing import List, Optional
import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.redis import publish_safety_alert
from app.models.location import MineLocation
from app.models.telemetry import HardwareRegistry
from app.schemas.telemetry import (
    DeviceStatusEnum,
    HardwareHeartbeat,
    HardwareRegister,
    HardwareStatusMatrix,
    HeartbeatResponse,
)

logger = logging.getLogger("coalguard.hardware")


class HardwareService:
    """Service arbitrating colliery IoT asset registration and live diagnostics."""

    @staticmethod
    async def register_device(
        db: AsyncSession,
        payload: HardwareRegister,
    ) -> HardwareRegistry:
        """Registers a new edge asset (turnstile, camera, gas sensor) in the colliery registry."""
        # Verify location if specified
        if payload.location_id:
            loc_stmt = select(MineLocation).where(MineLocation.id == payload.location_id)
            loc_res = await db.execute(loc_stmt)
            if not loc_res.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Mine location '{payload.location_id}' not found in spatial registry",
                )

        device = HardwareRegistry(
            device_name=payload.device_name,
            device_type=payload.device_type.value,
            location_id=payload.location_id,
            ip_address=payload.ip_address,
            protocol=payload.protocol.value,
            is_online=True,  # Activated upon successful registration
            last_heartbeat=datetime.now(timezone.utc),
        )
        db.add(device)
        await db.commit()
        await db.refresh(device)
        logger.info(f"Registered new hardware asset: {device.device_name} [{device.device_type}]")
        return device

    @staticmethod
    async def record_heartbeat(
        db: AsyncSession,
        payload: HardwareHeartbeat,
    ) -> HeartbeatResponse:
        """Records a heartbeat ping from an integrated device and evaluates connectivity."""
        stmt = (
            select(HardwareRegistry)
            .where(HardwareRegistry.id == payload.hardware_id)
            .options(selectinload(HardwareRegistry.location))
        )
        res = await db.execute(stmt)
        device = res.scalar_one_or_none()

        if not device:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Hardware device '{payload.hardware_id}' not found in registry",
            )

        now = datetime.now(timezone.utc)
        is_online = payload.status == DeviceStatusEnum.ONLINE

        was_online = device.is_online
        device.is_online = is_online
        device.last_heartbeat = now
        await db.commit()
        await db.refresh(device)

        # If device dropped offline unexpectedly, publish hardware alert
        if was_online and not is_online:
            await publish_safety_alert(
                channel="hardware_alerts",
                message={
                    "alert_type": "HARDWARE_OFFLINE",
                    "severity": "WARNING",
                    "hardware_id": str(device.id),
                    "device_name": device.device_name,
                    "device_type": device.device_type,
                    "location_id": str(device.location_id) if device.location_id else None,
                    "message": f"Hardware device '{device.device_name}' reported OFFLINE state.",
                    "timestamp": now,
                },
            )

        return HeartbeatResponse(
            status="ACK",
            hardware_id=device.id,
            recorded_at=now,
            is_online=is_online,
        )

    @staticmethod
    async def get_diagnostic_matrix(
        db: AsyncSession,
    ) -> List[HardwareStatusMatrix]:
        """Compiles the diagnostic status matrix across all integrated devices and zones."""
        stmt = (
            select(HardwareRegistry)
            .options(selectinload(HardwareRegistry.location))
            .order_by(HardwareRegistry.device_type, HardwareRegistry.device_name)
        )
        res = await db.execute(stmt)
        devices = res.scalars().all()

        matrix = []
        for dev in devices:
            loc_name = dev.location.location_name if dev.location else None
            matrix.append(
                HardwareStatusMatrix(
                    hardware_id=dev.id,
                    device_name=dev.device_name,
                    device_type=dev.device_type,
                    is_online=dev.is_online,
                    last_heartbeat=dev.last_heartbeat,
                    location_id=dev.location_id,
                    location_name=loc_name,
                    ip_address=dev.ip_address,
                    protocol=dev.protocol,
                    latency_ms=None,
                )
            )
        return matrix
