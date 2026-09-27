"""Phase 7 Pithead Gate Direction & Egress Safe Passage

Revision ID: 007_phase7_direction
Revises: 006_phase6_document
Create Date: 2026-09-27 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "007_phase7_direction"
down_revision: Union[str, None] = "006_phase6_document"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add statutory access direction column (INGRESS or EGRESS)
    op.add_column(
        "access_attempt_logs",
        sa.Column(
            "direction",
            sa.String(length=10),
            nullable=False,
            server_default="INGRESS",
        ),
    )


def downgrade() -> None:
    op.drop_column("access_attempt_logs", "direction")
