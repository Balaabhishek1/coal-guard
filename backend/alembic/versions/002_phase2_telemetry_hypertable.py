"""Phase 2 Telemetry Ingestion, Hardware Registry & TimescaleDB Hypertable

Revision ID: 002_phase2_telemetry
Revises: 001_phase1_init
Create Date: 2026-09-17 14:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision: str = "002_phase2_telemetry"
down_revision: Union[str, None] = "001_phase1_init"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    is_postgres = conn.dialect.name == "postgresql"

    # 1. Create hardware_registry table
    op.create_table(
        "hardware_registry",
        sa.Column(
            "id",
            UUID(as_uuid=True) if is_postgres else sa.String(36),
            server_default=sa.text("gen_random_uuid()") if is_postgres else None,
            primary_key=True,
            nullable=False,
        ),
        sa.Column("device_name", sa.String(255), nullable=False),
        sa.Column("device_type", sa.String(50), nullable=False),
        sa.Column(
            "location_id",
            UUID(as_uuid=True) if is_postgres else sa.String(36),
            sa.ForeignKey("mine_locations.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("protocol", sa.String(50), nullable=False),
        sa.Column("is_online", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("last_heartbeat", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_hardware_registry_device_type", "hardware_registry", ["device_type"])
    op.create_index("ix_hardware_registry_location_id", "hardware_registry", ["location_id"])

    # 2. Create sensor_telemetry table
    op.create_table(
        "sensor_telemetry",
        sa.Column("time", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "hardware_id",
            UUID(as_uuid=True) if is_postgres else sa.String(36),
            sa.ForeignKey("hardware_registry.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("metric_type", sa.String(50), nullable=False),
        sa.Column("reading_value", sa.Float(), nullable=False),
        sa.PrimaryKeyConstraint("time", "hardware_id", "metric_type", name="pk_sensor_telemetry"),
    )
    op.create_index("ix_sensor_telemetry_time_desc", "sensor_telemetry", ["time"])
    op.create_index(
        "ix_sensor_telemetry_hw_metric_time",
        "sensor_telemetry",
        ["hardware_id", "metric_type", "time"],
    )

    # 3. TimescaleDB Hypertable & Continuous Aggregate (PostgreSQL Only)
    if is_postgres:
        op.execute(
            """
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM pg_extension WHERE extname = 'timescaledb'
                ) THEN
                    BEGIN
                        PERFORM create_hypertable(
                            'sensor_telemetry',
                            'time',
                            chunk_time_interval => INTERVAL '7 days',
                            if_not_exists => TRUE
                        );
                    EXCEPTION WHEN OTHERS THEN
                        RAISE NOTICE 'Skipping hypertable creation: %', SQLERRM;
                    END;

                    BEGIN
                        EXECUTE '
                            CREATE MATERIALIZED VIEW IF NOT EXISTS hourly_gas_averages
                            WITH (timescaledb.continuous) AS
                            SELECT time_bucket(''1 hour'', time) AS bucket,
                                   hardware_id,
                                   metric_type,
                                   AVG(reading_value) AS avg_reading,
                                   MAX(reading_value) AS max_reading,
                                   MIN(reading_value) AS min_reading,
                                   COUNT(reading_value) AS sample_count
                            FROM sensor_telemetry
                            GROUP BY bucket, hardware_id, metric_type
                            WITH NO DATA;
                        ';
                    EXCEPTION WHEN OTHERS THEN
                        RAISE NOTICE 'Skipping continuous aggregate creation: %', SQLERRM;
                    END;
                END IF;
            END $$;
            """
        )


def downgrade() -> None:
    conn = op.get_bind()
    is_postgres = conn.dialect.name == "postgresql"

    if is_postgres:
        op.execute("DROP MATERIALIZED VIEW IF EXISTS hourly_gas_averages CASCADE;")

    op.drop_table("sensor_telemetry")
    op.drop_table("hardware_registry")
