"""Phase 5 Offline Mobile Sync Engine, Form IV Shift Diary & Evidence Logs

Revision ID: 005_phase5_sync
Revises: 004_phase4_access
Create Date: 2026-09-17 18:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision: str = "005_phase5_sync"
down_revision: Union[str, None] = "004_phase4_access"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    is_postgres = conn.dialect.name == "postgresql"

    # 1. Create sync_logs table
    op.create_table(
        "sync_logs",
        sa.Column(
            "sync_id",
            UUID(as_uuid=True) if is_postgres else sa.String(36),
            primary_key=True,
            nullable=False,
        ),
        sa.Column(
            "user_id",
            UUID(as_uuid=True) if is_postgres else sa.String(36),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("device_id", sa.String(128), nullable=False),
        sa.Column("records_processed", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("status", sa.String(50), nullable=False, server_default="PROCESSING"),
        sa.Column(
            "timestamp",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index("ix_sync_logs_user_id", "sync_logs", ["user_id"])
    op.create_index("ix_sync_logs_device_id", "sync_logs", ["device_id"])
    op.create_index("ix_sync_logs_timestamp", "sync_logs", ["timestamp"])

    # 2. Create form_iv_inspections table
    op.create_table(
        "form_iv_inspections",
        sa.Column(
            "id",
            UUID(as_uuid=True) if is_postgres else sa.String(36),
            server_default=sa.text("gen_random_uuid()") if is_postgres else None,
            primary_key=True,
            nullable=False,
        ),
        sa.Column(
            "sync_id",
            UUID(as_uuid=True) if is_postgres else sa.String(36),
            sa.ForeignKey("sync_logs.sync_id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "inspector_id",
            UUID(as_uuid=True) if is_postgres else sa.String(36),
            sa.ForeignKey("users.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column(
            "location_id",
            UUID(as_uuid=True) if is_postgres else sa.String(36),
            sa.ForeignKey("mine_locations.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("roof_bolt_torque_nm", sa.Float(), nullable=True),
        sa.Column("air_velocity_m_per_min", sa.Float(), nullable=True),
        sa.Column("gas_ch4_percent", sa.Float(), nullable=True),
        sa.Column("gas_co_ppm", sa.Float(), nullable=True),
        sa.Column("strata_remarks", sa.Text(), nullable=True),
        sa.Column("is_geotagged_nfc", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("inspection_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index("ix_form_iv_inspections_sync_id", "form_iv_inspections", ["sync_id"])
    op.create_index("ix_form_iv_inspections_inspector_id", "form_iv_inspections", ["inspector_id"])
    op.create_index("ix_form_iv_inspections_location_id", "form_iv_inspections", ["location_id"])
    op.create_index("ix_form_iv_inspections_inspection_time", "form_iv_inspections", ["inspection_time"])

    # 3. Create inspection_evidence table
    op.create_table(
        "inspection_evidence",
        sa.Column(
            "id",
            UUID(as_uuid=True) if is_postgres else sa.String(36),
            server_default=sa.text("gen_random_uuid()") if is_postgres else None,
            primary_key=True,
            nullable=False,
        ),
        sa.Column(
            "inspection_id",
            UUID(as_uuid=True) if is_postgres else sa.String(36),
            sa.ForeignKey("form_iv_inspections.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("file_path", sa.String(512), nullable=False),
        sa.Column("file_size_bytes", sa.BigInteger(), nullable=False),
        sa.Column("mime_type", sa.String(50), nullable=False, server_default="image/webp"),
        sa.Column("upload_completed", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index("ix_inspection_evidence_inspection_id", "inspection_evidence", ["inspection_id"])


def downgrade() -> None:
    op.drop_index("ix_inspection_evidence_inspection_id", table_name="inspection_evidence")
    op.drop_table("inspection_evidence")

    op.drop_index("ix_form_iv_inspections_inspection_time", table_name="form_iv_inspections")
    op.drop_index("ix_form_iv_inspections_location_id", table_name="form_iv_inspections")
    op.drop_index("ix_form_iv_inspections_inspector_id", table_name="form_iv_inspections")
    op.drop_index("ix_form_iv_inspections_sync_id", table_name="form_iv_inspections")
    op.drop_table("form_iv_inspections")

    op.drop_index("ix_sync_logs_timestamp", table_name="sync_logs")
    op.drop_index("ix_sync_logs_device_id", table_name="sync_logs")
    op.drop_index("ix_sync_logs_user_id", table_name="sync_logs")
    op.drop_table("sync_logs")
