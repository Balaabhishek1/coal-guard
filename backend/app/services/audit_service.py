"""Cryptographic Audit Ledger & SHA-256 Hash Chaining Service

Guarantees non-repudiation and tamper-evident statutory record-keeping by enforcing
linear cryptographic hash chaining across all compliance transitions and shift events.
"""

from datetime import datetime, timezone
import hashlib
import json
import logging
from typing import Any, Dict, List, Optional
import uuid

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.governance import AuditLedger

logger = logging.getLogger("coalguard.audit")

GENESIS_HASH = "0" * 64


class HashChainService:
    """Cryptographic non-repudiation service maintaining the immutable audit trail."""

    @staticmethod
    def canonical_json(payload: Dict[str, Any]) -> str:
        """Serializes dictionary payload into deterministic, canonically sorted JSON."""
        return json.dumps(
            payload,
            sort_keys=True,
            separators=(",", ":"),
            default=str,
        )

    @classmethod
    def canonical_timestamp(cls, timestamp: datetime) -> str:
        """Converts any datetime to canonical UTC ISO string representation."""
        if timestamp.tzinfo is None:
            ts = timestamp.replace(tzinfo=timezone.utc)
        else:
            ts = timestamp.astimezone(timezone.utc)
        return ts.strftime("%Y-%m-%dT%H:%M:%S.%f+00:00")

    @classmethod
    def compute_entry_hash(
        cls,
        previous_hash: str,
        timestamp: datetime,
        actor_id: Optional[uuid.UUID],
        action_type: str,
        payload: Dict[str, Any],
    ) -> str:
        """Computes deterministic SHA-256 hash across entry fields:

        Current Hash = SHA256(Previous Hash || Timestamp || ActorID || ActionType || CanonicalPayload)
        """
        actor_str = str(actor_id) if actor_id else "SYSTEM"
        ts_str = cls.canonical_timestamp(timestamp)
        canonical_payload = cls.canonical_json(payload)

        raw_preimage = f"{previous_hash}|{ts_str}|{actor_str}|{action_type}|{canonical_payload}"
        return hashlib.sha256(raw_preimage.encode("utf-8")).hexdigest()

    @classmethod
    async def append_log(
        cls,
        db: AsyncSession,
        action_type: str,
        payload: Dict[str, Any],
        actor_id: Optional[uuid.UUID] = None,
    ) -> AuditLedger:
        """Appends a new cryptographically chained transaction record to the audit ledger."""
        now = datetime.now(timezone.utc)

        # 1. Fetch latest record to retrieve previous hash
        latest_stmt = (
            select(AuditLedger)
            .order_by(desc(AuditLedger.seq_id))
            .limit(1)
        )
        res = await db.execute(latest_stmt)
        latest_entry = res.scalar_one_or_none()

        if latest_entry is None:
            previous_hash = GENESIS_HASH
        else:
            previous_hash = latest_entry.current_hash

        # 2. Compute cryptographic digest
        current_hash = cls.compute_entry_hash(
            previous_hash=previous_hash,
            timestamp=now,
            actor_id=actor_id,
            action_type=action_type,
            payload=payload,
        )

        # 3. Persist record
        new_entry = AuditLedger(
            timestamp=now,
            actor_id=actor_id,
            action_type=action_type,
            payload=payload,
            previous_hash=previous_hash,
            current_hash=current_hash,
        )
        db.add(new_entry)
        await db.commit()
        await db.refresh(new_entry)

        logger.info(
            f"[AUDIT] Block #{new_entry.seq_id} committed ({action_type}). "
            f"Prev: {previous_hash[:10]}... Curr: {current_hash[:10]}..."
        )
        return new_entry

    @classmethod
    async def verify_audit_integrity(
        cls,
        db: AsyncSession,
    ) -> Dict[str, Any]:
        """Validates the entire sequential cryptographic chain from Genesis to HEAD.

        Detects modified rows, broken pointer linkages, or unauthorized SQL insertions.
        """
        stmt = select(AuditLedger).order_by(AuditLedger.seq_id.asc())
        res = await db.execute(stmt)
        records: List[AuditLedger] = list(res.scalars().all())

        if not records:
            return {
                "valid": True,
                "total_records": 0,
                "broken_seq_id": None,
                "reason": "Audit ledger is in pristine Genesis state (0 records).",
            }

        expected_previous_hash = GENESIS_HASH

        for record in records:
            # 1. Verify previous hash pointer
            if record.previous_hash != expected_previous_hash:
                logger.error(
                    f"Audit integrity failure at seq_id #{record.seq_id}: "
                    f"Previous hash pointer mismatch! Expected {expected_previous_hash}, got {record.previous_hash}"
                )
                return {
                    "valid": False,
                    "total_records": len(records),
                    "broken_seq_id": record.seq_id,
                    "reason": f"Chain linkage broken at sequence #{record.seq_id}: previous_hash mismatch.",
                }

            # 2. Re-compute current hash from payload and fields
            recalculated_hash = cls.compute_entry_hash(
                previous_hash=record.previous_hash,
                timestamp=record.timestamp,
                actor_id=record.actor_id,
                action_type=record.action_type,
                payload=record.payload,
            )

            if recalculated_hash != record.current_hash:
                logger.error(
                    f"Audit integrity failure at seq_id #{record.seq_id}: "
                    f"Payload or timestamp tampering! Recalculated {recalculated_hash}, stored {record.current_hash}"
                )
                return {
                    "valid": False,
                    "total_records": len(records),
                    "broken_seq_id": record.seq_id,
                    "reason": f"Content tampering detected at sequence #{record.seq_id}: hash signature corrupted.",
                }

            expected_previous_hash = record.current_hash

        return {
            "valid": True,
            "total_records": len(records),
            "broken_seq_id": None,
            "reason": f"All {len(records)} audit ledger cryptographic blocks verified successfully.",
        }
