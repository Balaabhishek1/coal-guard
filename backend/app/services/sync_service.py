"""Mobile Field Sync Service

Implements idempotent batch unpacking for offline DGMS Form IV shift logs,
enforces statutory ventilation/strata interlocks (CMR 2017 Reg 169 & Reg 153),
anchors sync transactions into the cryptographic audit ledger, and publishes alerts.
"""

from datetime import datetime, timezone
import logging
from typing import Dict, List, Optional, Set
import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.redis import publish_safety_alert
from app.models.governance import ViolationSeverity
from app.models.location import MineLocation
from app.models.sync_log import FormIVInspection, SyncLog, SyncStatus
from app.models.user import User
from app.schemas.governance import SeverityEnum, ViolationCreate
from app.schemas.sync import SyncBatchPayload, SyncBatchResponse
from app.services.audit_service import HashChainService
from app.services.violation_service import ViolationService

logger = logging.getLogger("coalguard.sync")


class SyncService:
    """Manages offline batch synchronization and statutory safety interlocks."""

    @classmethod
    async def process_batch(
        cls,
        db: AsyncSession,
        payload: SyncBatchPayload,
        inspector_id: uuid.UUID,
    ) -> SyncBatchResponse:
        """Processes an offline batch of Form IV shift logs with strict UUID idempotency."""
        # 1. Idempotency Check: Verify if sync_id has already been processed
        existing_stmt = select(SyncLog).where(SyncLog.sync_id == payload.sync_id)
        existing_res = await db.execute(existing_stmt)
        existing_sync = existing_res.scalar_one_or_none()

        if existing_sync is not None and existing_sync.status == SyncStatus.SUCCESS.value:
            logger.info(
                f"[SYNC IDEMPOTENCY] Batch '{payload.sync_id}' from device '{payload.device_id}' "
                f"already processed ({existing_sync.records_processed} records). Returning idempotent acknowledgement."
            )
            return SyncBatchResponse(
                sync_id=payload.sync_id,
                status="DUPLICATE_ACKNOWLEDGED",
                records_processed=existing_sync.records_processed,
                violations_created=0,
                message="Batch was already synchronized idempotently. No duplicate records created.",
            )

        # 2. Verify Inspector / User exists
        user_stmt = select(User).where(User.id == inspector_id)
        user_res = await db.execute(user_stmt)
        inspector = user_res.scalar_one_or_none()
        if not inspector:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Inspector with ID '{inspector_id}' not found.",
            )

        # 3. Create or update SyncLog with PROCESSING status
        if existing_sync is None:
            sync_log = SyncLog(
                sync_id=payload.sync_id,
                user_id=inspector_id,
                device_id=payload.device_id,
                status=SyncStatus.PROCESSING.value,
                records_processed=0,
                timestamp=datetime.now(timezone.utc),
            )
            db.add(sync_log)
            await db.commit()
            await db.refresh(sync_log)
        else:
            sync_log = existing_sync

        # 4. Validate Location IDs for all checklist entries
        location_ids = {entry.location_id for entry in payload.checklists}
        locations_map: Dict[uuid.UUID, MineLocation] = {}

        if location_ids:
            loc_stmt = select(MineLocation).where(MineLocation.id.in_(location_ids))
            loc_res = await db.execute(loc_stmt)
            found_locations = loc_res.scalars().all()
            locations_map = {loc.id: loc for loc in found_locations}

            missing_locations = location_ids - set(locations_map.keys())
            if missing_locations:
                sync_log.status = SyncStatus.FAILED.value
                await db.commit()
                missing_str = ", ".join(str(m) for m in missing_locations)
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Batch references invalid or non-existent MineLocation IDs: {missing_str}",
                )

        # 5. Unpack and evaluate inspections with Statutory Hazard Interlocks
        inspections_to_insert: List[FormIVInspection] = []
        violations_created = 0
        now = datetime.now(timezone.utc)

        for entry in payload.checklists:
            location = locations_map[entry.location_id]

            inspection = FormIVInspection(
                id=entry.record_id or uuid.uuid4(),
                sync_id=payload.sync_id,
                inspector_id=inspector_id,
                location_id=entry.location_id,
                roof_bolt_torque_nm=entry.roof_bolt_torque_nm,
                air_velocity_m_per_min=entry.air_velocity_m_per_min,
                gas_ch4_percent=entry.gas_ch4_percent,
                gas_co_ppm=entry.gas_co_ppm,
                strata_remarks=entry.strata_remarks,
                is_geotagged_nfc=entry.is_geotagged_nfc,
                inspection_time=entry.inspection_time,
                created_at=now,
            )
            inspections_to_insert.append(inspection)

            # --- Statutory Anomaly Interlock 1: Methane Hazard (CMR 2017 Reg 169) ---
            if entry.gas_ch4_percent is not None and entry.gas_ch4_percent >= 1.25:
                viol_payload = ViolationCreate(
                    location_id=entry.location_id,
                    violation_type="UNDERGROUND_VENTILATION_DEFECT",
                    title=f"Statutory Methane Exceedance ({entry.gas_ch4_percent}% CH4)",
                    description=(
                        f"Field Form IV inspection recorded CH4 concentration of {entry.gas_ch4_percent}% "
                        f"(Statutory electrical trip threshold >= 1.25%) at {location.location_name}. "
                        f"Inspector: {inspector.full_name}."
                    ),
                    severity=SeverityEnum.CRITICAL,
                    contractor_id=inspector.contractor_id,
                )
                await ViolationService.create_violation(
                    db=db,
                    payload=viol_payload,
                    reporter_id=inspector_id,
                )
                violations_created += 1
                logger.warning(
                    f"[VENTILATION INTERLOCK] Critical CH4 exceedance ({entry.gas_ch4_percent}%) "
                    f"at {location.location_name} logged via sync #{payload.sync_id}"
                )

            # --- Statutory Anomaly Interlock 2: Sluggish Airflow (CMR 2017 Reg 153) ---
            if entry.air_velocity_m_per_min is not None and entry.air_velocity_m_per_min < 30.0:
                viol_payload = ViolationCreate(
                    location_id=entry.location_id,
                    violation_type="INADEQUATE_VENTILATION_AIRFLOW",
                    title=f"Sub-Statutory Air Velocity ({entry.air_velocity_m_per_min} m/min)",
                    description=(
                        f"Ventilation survey measured air velocity of {entry.air_velocity_m_per_min} m/min "
                        f"(Statutory minimum < 30 m/min) at {location.location_name}. Stagnation risk."
                    ),
                    severity=SeverityEnum.HIGH,
                    contractor_id=inspector.contractor_id,
                )
                await ViolationService.create_violation(
                    db=db,
                    payload=viol_payload,
                    reporter_id=inspector_id,
                )
                violations_created += 1

            # --- Statutory Anomaly Interlock 3: Inadequate Roof Bolt Torque ---
            if entry.roof_bolt_torque_nm is not None and entry.roof_bolt_torque_nm < 100.0:
                viol_payload = ViolationCreate(
                    location_id=entry.location_id,
                    violation_type="ROOF_SUPPORT_DEFECT",
                    title=f"Under-Torqued Roof Bolt ({entry.roof_bolt_torque_nm} Nm)",
                    description=(
                        f"Strata audit recorded roof bolt torque of {entry.roof_bolt_torque_nm} Nm "
                        f"(Statutory minimum < 100 Nm) at {location.location_name}. Risk of strata failure."
                    ),
                    severity=SeverityEnum.HIGH,
                    contractor_id=inspector.contractor_id,
                )
                await ViolationService.create_violation(
                    db=db,
                    payload=viol_payload,
                    reporter_id=inspector_id,
                )
                violations_created += 1

        # 6. Bulk persist inspections
        db.add_all(inspections_to_insert)

        # 7. Non-repudiation: Anchor batch in the cryptographic AuditLedger
        await HashChainService.append_log(
            db=db,
            action_type="MOBILE_OFFLINE_SYNC",
            actor_id=inspector_id,
            payload={
                "sync_id": str(payload.sync_id),
                "device_id": payload.device_id,
                "inspector_id": str(inspector_id),
                "records_processed": len(inspections_to_insert),
                "violations_created": violations_created,
            },
        )

        # 8. Update sync_log to SUCCESS
        sync_log.status = SyncStatus.SUCCESS.value
        sync_log.records_processed = len(inspections_to_insert)
        await db.commit()

        # 9. Alert dispatch if statutory defects were uncovered
        if violations_created > 0:
            await publish_safety_alert(
                channel="governance_escalations",
                message={
                    "event_type": "OFFLINE_SYNC_DEFECTS_DETECTED",
                    "data": {
                        "sync_id": str(payload.sync_id),
                        "device_id": payload.device_id,
                        "inspector_name": inspector.full_name,
                        "violations_created": violations_created,
                    },
                    "timestamp": now.isoformat(),
                },
            )

        logger.info(
            f"[SYNC COMPLETE] Sync #{payload.sync_id} successfully processed "
            f"{len(inspections_to_insert)} Form IV records ({violations_created} violations created)."
        )

        return SyncBatchResponse(
            sync_id=payload.sync_id,
            status="COMPLETED",
            records_processed=len(inspections_to_insert),
            violations_created=violations_created,
            message="Batch synchronized successfully.",
        )
