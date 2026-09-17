"""Phase 6 Document Digitization & OCR Certificates

Revision ID: 006_phase6_document
Revises: 005_phase5_sync
Create Date: 2026-09-17 19:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision: str = "006_phase6_document"
down_revision: Union[str, None] = "005_phase5_sync"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    is_postgres = conn.dialect.name == "postgresql"

    # 1. Create digitized_certificates table
    op.create_table(
        "digitized_certificates",
        sa.Column(
            "id",
            UUID(as_uuid=True) if is_postgres else sa.String(36),
            server_default=sa.text("gen_random_uuid()") if is_postgres else None,
            primary_key=True,
            nullable=False,
        ),
        sa.Column(
            "document_type",
            sa.String(50),
            nullable=False,
            server_default="OTHER",
        ),
        sa.Column(
            "extracted_serial_no",
            sa.String(100),
            nullable=True,
        ),
        sa.Column(
            "issuing_authority",
            sa.String(255),
            nullable=True,
        ),
        sa.Column(
            "target_user_id",
            UUID(as_uuid=True) if is_postgres else sa.String(36),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "target_hardware_id",
            UUID(as_uuid=True) if is_postgres else sa.String(36),
            sa.ForeignKey("hardware_registry.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "valid_from",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "valid_until",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "raw_text",
            sa.Text(),
            nullable=True,
        ),
        sa.Column(
            "file_url",
            sa.String(512),
            nullable=False,
        ),
        sa.Column(
            "processing_status",
            sa.String(50),
            nullable=False,
            server_default="PENDING",
        ),
        sa.Column(
            "is_verified_by_human",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index("ix_digitized_certificates_document_type", "digitized_certificates", ["document_type"])
    op.create_index("ix_digitized_certificates_extracted_serial_no", "digitized_certificates", ["extracted_serial_no"])
    op.create_index("ix_digitized_certificates_target_user_id", "digitized_certificates", ["target_user_id"])
    op.create_index("ix_digitized_certificates_target_hardware_id", "digitized_certificates", ["target_hardware_id"])
    op.create_index("ix_digitized_certificates_processing_status", "digitized_certificates", ["processing_status"])


def downgrade() -> None:
    op.drop_index("ix_digitized_certificates_processing_status", table_name="digitized_certificates")
    op.drop_index("ix_digitized_certificates_target_hardware_id", table_name="digitized_certificates")
    op.drop_index("ix_digitized_certificates_target_user_id", table_name="digitized_certificates")
    op.drop_index("ix_digitized_certificates_extracted_serial_no", table_name="digitized_certificates")
    op.drop_index("ix_digitized_certificates_document_type", table_name="digitized_certificates")
    op.drop_table("digitized_certificates")
