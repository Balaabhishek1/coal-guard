"""Vision Gate Edge Service

Processes post-turnstile optical and credential actuation events from edge mini-PCs,
enforces automated statutory compliance ticketing under CMR 2017, commits immutable
audit ledger entries, and broadcasts live telemetry frames to the Control Room HUD.
"""

from datetime import datetime, timezone
import logging
from typing import Optional
import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.redis import publish_safety_alert
from app.core.ws_manager import ws_manager
from app.models.access_log import AccessAttemptLog
from app.models.governance import ViolationSeverity
from app.models.location import MineLocation
from app.models.user import User
from app.schemas.governance import SeverityEnum, ViolationCreate
from app.schemas.vision_edge import AccessAttemptResponse, EdgeAccessEventPayload
from app.services.audit_service import HashChainService
from app.services.violation_service import ViolationService

logger = logging.getLogger("coalguard.vision_gate")


class VisionGateService:
    """Orchestrates edge vision verification, violation generation, and live dispatch."""

    @classmethod
    async def record_access_attempt(
        cls,
        db: AsyncSession,
        payload: EdgeAccessEventPayload,
    ) -> AccessAttemptResponse:
        """Ingests post-turnstile event, creates violation if non-compliant, and notifies HUD."""
        # 1. Verify location exists
        loc_stmt = select(MineLocation).where(MineLocation.id == payload.location_id)
        loc_res = await db.execute(loc_stmt)
        location = loc_res.scalar_one_or_none()
        if not location:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Mine location '{payload.location_id}' does not exist in spatial registry.",
            )

        # 2. Resolve worker identity and contractor association via RFID tag
        user_stmt = select(User).where(User.rfid_tag == payload.rfid_tag)
        user_res = await db.execute(user_stmt)
        user = user_res.scalar_one_or_none()

        user_id: Optional[uuid.UUID] = user.id if user else None
        contractor_id: Optional[uuid.UUID] = user.contractor_id if user and user.contractor_id else None
        worker_name: str = user.full_name if user else "UNREGISTERED_WORKER"

        now = datetime.now(timezone.utc)

        # 3. Persist record in access_attempt_logs
        log_entry = AccessAttemptLog(
            user_id=user_id,
            rfid_tag=payload.rfid_tag,
            location_id=payload.location_id,
            optical_compliance=payload.optical_compliance,
            credential_eligibility=payload.credential_eligibility,
            gate_actuated=payload.gate_actuated,
            wear_states=payload.wear_states.model_dump(),
            snapshot_crop_url=payload.snapshot_crop_url,
            timestamp=now,
        )
        db.add(log_entry)
        await db.commit()
        await db.refresh(log_entry)

        violation_created = False
        violation_id: Optional[uuid.UUID] = None

        # 4. Automated Statutory Compliance Violation Ticketing
        # Interlock Condition: optical compliance failure OR physical gate denied/held locked
        if not payload.optical_compliance or not payload.gate_actuated:
            wear_dict = payload.wear_states.model_dump()
            missing_ppe = [gear.replace("_worn", "").upper() for gear, worn in wear_dict.items() if not worn]

            if not payload.optical_compliance:
                # CMR 2017 Reg 169 & DGMS Circular 02: SCSR is critical life-safety apparatus
                if not payload.wear_states.scsr_worn:
                    severity = SeverityEnum.CRITICAL
                else:
                    severity = SeverityEnum.HIGH

                violation_type = "MISSING_PPE_AT_SHAFT"
                title = f"Optical PPE Non-Compliance: Tag {payload.rfid_tag}"
                missing_str = ", ".join(missing_ppe) if missing_ppe else "UNKNOWN"
                description = (
                    f"Turnstile optical vision gate detected missing safety equipment ({missing_str}) "
                    f"for worker '{worker_name}' (Tag: {payload.rfid_tag}) at {location.location_name}. "
                    f"Gate actuated: {payload.gate_actuated}."
                )
            else:
                # Optical check passed, but gate held locked due to credential or shift breach
                severity = SeverityEnum.HIGH
                violation_type = "UNAUTHORIZED_ENTRY_ATTEMPT"
                title = f"Unauthorized Pithead Entry Attempt: Tag {payload.rfid_tag}"
                description = (
                    f"Physical turnstile locked/denied for worker '{worker_name}' (Tag: {payload.rfid_tag}) "
                    f"at {location.location_name}. Credential eligibility was {payload.credential_eligibility}."
                )

            violation_in = ViolationCreate(
                location_id=payload.location_id,
                violation_type=violation_type,
                title=title,
                description=description,
                severity=severity,
                contractor_id=contractor_id,
            )

            violation = await ViolationService.create_violation(
                db=db,
                payload=violation_in,
                reporter_id=None,  # System-generated autonomous ticket
            )
            violation_created = True
            violation_id = violation.id

            logger.warning(
                f"[VISION GATE INTERLOCK] Auto-generated violation #{violation_id} "
                f"[{severity.value}] for tag '{payload.rfid_tag}' at {location.location_name}"
            )

        # 5. Non-repudiation: Anchor event in cryptographic AuditLedger
        await HashChainService.append_log(
            db=db,
            action_type="GATE_ACCESS_ATTEMPT",
            actor_id=user_id,
            payload={
                "access_log_id": str(log_entry.id),
                "rfid_tag": payload.rfid_tag,
                "worker_name": worker_name,
                "location_id": str(payload.location_id),
                "location_name": location.location_name,
                "optical_compliance": payload.optical_compliance,
                "credential_eligibility": payload.credential_eligibility,
                "gate_actuated": payload.gate_actuated,
                "violation_created": violation_created,
                "violation_id": str(violation_id) if violation_id else None,
                "wear_states": payload.wear_states.model_dump(),
                "snapshot_crop_url": payload.snapshot_crop_url,
            },
        )

        # 6. Broadcast event over Redis Pub/Sub channel 'gate_events'
        ws_event_payload = {
            "event_type": "GATE_ACCESS_ATTEMPT",
            "channel": "gate_events",
            "data": {
                "access_log_id": str(log_entry.id),
                "rfid_tag": payload.rfid_tag,
                "worker_name": worker_name,
                "location_id": str(payload.location_id),
                "location_name": location.location_name,
                "optical_compliance": payload.optical_compliance,
                "credential_eligibility": payload.credential_eligibility,
                "gate_actuated": payload.gate_actuated,
                "wear_states": payload.wear_states.model_dump(),
                "snapshot_crop_url": payload.snapshot_crop_url,
                "violation_ticket_created": violation_created,
                "violation_id": str(violation_id) if violation_id else None,
            },
            "timestamp": now.isoformat(),
        }

        # Dispatch via Redis Pub/Sub
        await publish_safety_alert(channel="gate_events", message=ws_event_payload)

        # Direct in-process broadcast ensures delivery in unit tests & single-process environments
        await ws_manager.broadcast(ws_event_payload)

        logger.info(
            f"[VISION GATE] Ingress logged for tag '{payload.rfid_tag}' at {location.location_name}. "
            f"Actuated: {payload.gate_actuated}, Optical: {payload.optical_compliance}, Violation: {violation_created}"
        )

        return AccessAttemptResponse(
            status="logged",
            access_log_id=log_entry.id,
            violation_ticket_created=violation_created,
            violation_id=violation_id,
            timestamp=log_entry.timestamp,
        )
