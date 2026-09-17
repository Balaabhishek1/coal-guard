"""Initial Phase 1 Schema (Extensions, Users, Credentials, Locations, Contractors)

Revision ID: 001_phase1_init
Revises: 
Create Date: 2026-09-17 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
import geoalchemy2

# revision identifiers, used by Alembic.
revision: str = "001_phase1_init"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Enable Required Database Extensions (PostGIS, TimescaleDB, pgcrypto)
    conn = op.get_bind()
    dialect_name = conn.dialect.name

    if dialect_name == "postgresql":
        op.execute("CREATE EXTENSION IF NOT EXISTS postgis;")
        try:
            op.execute("CREATE EXTENSION IF NOT EXISTS timescaledb;")
        except Exception:
            pass  # Allow setup if timescaledb binary is absent on standard vanilla postgres
        op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto;")

    # 2. Contractors Table
    op.create_table(
        "contractors",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("company_name", sa.String(length=255), nullable=False),
        sa.Column("contract_code", sa.String(length=100), nullable=False),
        sa.Column("contact_person", sa.String(length=255), nullable=True),
        sa.Column("contact_phone", sa.String(length=50), nullable=True),
        sa.Column("contact_email", sa.String(length=255), nullable=True),
        sa.Column("safety_rating", sa.Float(), nullable=False, server_default="100.0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_contractors_contract_code", "contractors", ["contract_code"], unique=True)

    # 3. Users Table
    op.create_table(
        "users",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("rfid_tag", sa.String(length=128), nullable=True),
        sa.Column("username", sa.String(length=100), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=50), nullable=False, server_default="MINER"),
        sa.Column("contractor_id", UUID(as_uuid=True), sa.ForeignKey("contractors.id", ondelete="SET NULL"), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_users_rfid_tag", "users", ["rfid_tag"], unique=True)
    op.create_index("ix_users_username", "users", ["username"], unique=True)
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # 4. Worker Credentials Table
    op.create_table(
        "worker_credentials",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("vtc_training_expiry", sa.Date(), nullable=False),
        sa.Column("pme_medical_expiry", sa.Date(), nullable=False),
        sa.Column("current_shift_start", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_worker_credentials_user_id", "worker_credentials", ["user_id"], unique=True)

    # 5. Mine Locations Table (PostGIS)
    op.create_table(
        "mine_locations",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("location_name", sa.String(length=255), nullable=False),
        sa.Column("location_type", sa.String(length=50), nullable=False, server_default="SURFACE_BENCH"),
        sa.Column("rfid_beacon_id", sa.String(length=128), nullable=True),
        sa.Column(
            "geom",
            geoalchemy2.Geometry(geometry_type="GEOMETRY", srid=4326, spatial_index=True, nullable=True),
            nullable=True,
        ),
        sa.Column("parent_location_id", UUID(as_uuid=True), sa.ForeignKey("mine_locations.id", ondelete="SET NULL"), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_mine_locations_rfid_beacon_id", "mine_locations", ["rfid_beacon_id"], unique=True)


def downgrade() -> None:
    op.drop_table("mine_locations")
    op.drop_table("worker_credentials")
    op.drop_table("users")
    op.drop_table("contractors")
