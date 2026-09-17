"""SLA Escalation Worker & Periodic Task Scheduler

Scans active compliance tickets, detects SLA clock breaches, automatically bumps
severity tiers, and dispatches real-time alerts over Redis Pub/Sub.
"""

import asyncio
from datetime import datetime, timedelta, timezone
import logging
from typing import Any, Dict, List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.redis import publish_safety_alert
from app.db.session import AsyncSessionLocal
from app.models.governance import (
    ComplianceViolation,
    ViolationSeverity,
    ViolationStatus,
)
from app.services.audit_service import HashChainService
from app.worker.celery_app import celery_app

logger = logging.getLogger("coalguard.sla_worker")

# Severity escalation progression mapping
ESCALATION_MAP = {
    ViolationSeverity.LOW.value: ViolationSeverity.MEDIUM.value,
    ViolationSeverity.MEDIUM.value: ViolationSeverity.HIGH.value,
    ViolationSeverity.HIGH.value: ViolationSeverity.CRITICAL.value,
}


async def execute_sla_escalation_sweep(db: AsyncSession) -> Dict[str, Any]:
    """Inspects all unresolved compliance violations and escalates overdue tickets."""
    now = datetime.now(timezone.utc)

    # 1. Query active violations that breached their deadline SLA
    stmt = (
        select(ComplianceViolation)
        .where(
            ComplianceViolation.status != ViolationStatus.STATUTORY_CLOSEOUT.value,
            ComplianceViolation.deadline_sla <= now,
        )
        .options(
            selectinload(ComplianceViolation.location),
            selectinload(ComplianceViolation.reporter),
        )
    )
    res = await db.execute(stmt)
    overdue_violations: List[ComplianceViolation] = list(res.scalars().all())

    escalated_records = []

    for violation in overdue_violations:
        old_severity = violation.severity
        new_severity = ESCALATION_MAP.get(old_severity, old_severity)

        # Grant additional buffer after escalation (2 hours)
        new_deadline = now + timedelta(hours=2)
        violation.severity = new_severity
        violation.deadline_sla = new_deadline

        # 2. Dispatch real-time alert via Redis
        loc_name = violation.location.location_name if violation.location else "Unknown Zone"
        alert_payload = {
            "alert_type": "SLA_ESCALATED",
            "violation_id": str(violation.id),
            "title": violation.title,
            "location": loc_name,
            "previous_severity": old_severity,
            "escalated_severity": new_severity,
            "status": violation.status,
            "overdue_by_minutes": round((now - violation.deadline_sla).total_seconds() / 60.0, 1),
            "new_deadline_sla": new_deadline.isoformat(),
            "message": (
                f"SLA BREACH ESCALATION: Safety ticket #{violation.id} at '{loc_name}' "
                f"escalated from {old_severity} to {new_severity}."
            ),
            "timestamp": now.isoformat(),
        }

        await publish_safety_alert(
            channel="governance_escalations",
            message=alert_payload,
        )

        # 3. Cryptographically anchor escalation event in the audit ledger
        await HashChainService.append_log(
            db=db,
            action_type="SLA_ESCALATED",
            actor_id=None,  # Automated System Action
            payload=alert_payload,
        )

        escalated_records.append(
            {
                "violation_id": str(violation.id),
                "from_severity": old_severity,
                "to_severity": new_severity,
            }
        )

    await db.commit()
    logger.info(f"SLA Escalation Sweep complete: {len(escalated_records)} violations escalated.")

    return {
        "status": "COMPLETED",
        "timestamp": now.isoformat(),
        "total_overdue_found": len(overdue_violations),
        "escalated_count": len(escalated_records),
        "escalations": escalated_records,
    }


@celery_app.task(name="check_sla_escalations")
def check_sla_escalations() -> Dict[str, Any]:
    """Synchronous Celery task wrapper invoking the asynchronous escalation sweep."""
    async def _runner():
        async with AsyncSessionLocal() as session:
            return await execute_sla_escalation_sweep(session)

    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    if loop.is_running():
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor() as pool:
            return pool.submit(asyncio.run, _runner()).result()
    else:
        return loop.run_until_complete(_runner())
