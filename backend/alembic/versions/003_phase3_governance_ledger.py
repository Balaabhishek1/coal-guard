"""Phase 3 Governance State Machine & Cryptographic Audit Ledger

Revision ID: 003_phase3_governance
Revises: 002_phase2_telemetry
Create Date: 2026-09-17 16:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID

# revision identifiers, used by Alembic.
revision: str = "003_phase3_governance"
down_revision: Union[str, None] = "002_phase2_telemetry"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    is_postgres = conn.dialect.name == "postgresql"

    # 1. Create compliance_violations table
    op.create_table(
        "compliance_violations",
        sa.Column(
            "id",
            UUID(as_uuid=True) if is_postgres else sa.String(36),
            server_default=sa.text("gen_random_uuid()") if is_postgres else None,
            primary_key=True,
            nullable=False,
        ),
        sa.Column(
            "location_id",
            UUID(as_uuid=True) if is_postgres else sa.String(36),
            sa.ForeignKey("mine_locations.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column(
            "reporter_id",
            UUID(as_uuid=True) if is_postgres else sa.String(36),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "contractor_id",
            UUID(as_uuid=True) if is_postgres else sa.String(36),
            sa.ForeignKey("contractors.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("violation_type", sa.String(100), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("severity", sa.String(50), server_default="MEDIUM", nullable=False),
        sa.Column("status", sa.String(50), server_default="DETECTED", nullable=False),
        sa.Column("deadline_sla", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_compliance_violations_location_id", "compliance_violations", ["location_id"])
    op.create_index("ix_compliance_violations_reporter_id", "compliance_violations", ["reporter_id"])
    op.create_index("ix_compliance_violations_contractor_id", "compliance_violations", ["contractor_id"])
    op.create_index("ix_compliance_violations_violation_type", "compliance_violations", ["violation_type"])
    op.create_index("ix_compliance_violations_severity", "compliance_violations", ["severity"])
    op.create_index("ix_compliance_violations_status", "compliance_violations", ["status"])
    op.create_index("ix_compliance_violations_deadline_sla", "compliance_violations", ["deadline_sla"])

    # 2. Create audit_ledger table
    op.create_table(
        "audit_ledger",
        sa.Column("seq_id", sa.BigInteger(), primary_key=True, autoincrement=True, nullable=False),
        sa.Column(
            "timestamp",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "actor_id",
            UUID(as_uuid=True) if is_postgres else sa.String(36),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("action_type", sa.String(100), nullable=False),
        sa.Column("payload", JSONB if is_postgres else sa.JSON(), nullable=False),
        sa.Column("previous_hash", sa.String(64), nullable=False),
        sa.Column("current_hash", sa.String(64), nullable=False),
    )
    op.create_index("ix_audit_ledger_timestamp", "audit_ledger", ["timestamp"])
    op.create_index("ix_audit_ledger_actor_id", "audit_ledger", ["actor_id"])
    op.create_index("ix_audit_ledger_action_type", "audit_ledger", ["action_type"])
    op.create_index("ix_audit_ledger_current_hash", "audit_ledger", ["current_hash"])
    op.create_index("ix_audit_ledger_seq_timestamp", "audit_ledger", ["seq_id", "timestamp"])


def downgrade() -> None:
    op.drop_table("audit_ledger")
    op.drop_table("compliance_violations")
