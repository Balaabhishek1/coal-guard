"""Phase 4 Edge Vision Access Logs & Actuation Records

Revision ID: 004_phase4_access
Revises: 003_phase3_governance
Create Date: 2026-09-17 17:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID

# revision identifiers, used by Alembic.
revision: str = "004_phase4_access"
down_revision: Union[str, None] = "003_phase3_governance"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    is_postgres = conn.dialect.name == "postgresql"

    # 1. Create access_attempt_logs table
    op.create_table(
        "access_attempt_logs",
        sa.Column(
            "id",
            UUID(as_uuid=True) if is_postgres else sa.String(36),
            server_default=sa.text("gen_random_uuid()") if is_postgres else None,
            primary_key=True,
            nullable=False,
        ),
        sa.Column(
            "user_id",
            UUID(as_uuid=True) if is_postgres else sa.String(36),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("rfid_tag", sa.String(128), nullable=False),
        sa.Column(
            "location_id",
            UUID(as_uuid=True) if is_postgres else sa.String(36),
            sa.ForeignKey("mine_locations.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("optical_compliance", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("credential_eligibility", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("gate_actuated", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("wear_states", JSONB if is_postgres else sa.JSON(), nullable=False),
        sa.Column("snapshot_crop_url", sa.String(512), nullable=True),
        sa.Column(
            "timestamp",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )

    # 2. Create indices for high-frequency search on RFID, location, and timestamp
    op.create_index("ix_access_attempt_logs_rfid", "access_attempt_logs", ["rfid_tag"])
    op.create_index("ix_access_attempt_logs_location", "access_attempt_logs", ["location_id"])
    op.create_index("ix_access_attempt_logs_user", "access_attempt_logs", ["user_id"])
    op.create_index("ix_access_attempt_logs_timestamp", "access_attempt_logs", ["timestamp"])


def downgrade() -> None:
    op.drop_index("ix_access_attempt_logs_timestamp", table_name="access_attempt_logs")
    op.drop_index("ix_access_attempt_logs_user", table_name="access_attempt_logs")
    op.drop_index("ix_access_attempt_logs_location", table_name="access_attempt_logs")
    op.drop_index("ix_access_attempt_logs_rfid", table_name="access_attempt_logs")
    op.drop_table("access_attempt_logs")
