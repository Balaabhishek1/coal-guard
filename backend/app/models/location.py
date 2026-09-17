"""Mine Location & PostGIS Spatial ORM Model

Represents topological and GIS definitions for surface opencast benches,
underground seams, districts, and shaft collar entry points.
"""

from datetime import datetime
from enum import Enum
import uuid
from typing import List, Optional

from geoalchemy2 import Geometry
from sqlalchemy import Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import TypeDecorator

from app.db.base import Base


class PostGISGeometry(TypeDecorator):
    """PostgreSQL PostGIS Geometry type with seamless String/BLOB fallback for SQLite testing."""

    impl = Geometry
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect is not None and dialect.name == "sqlite":
            return dialect.type_descriptor(String())
        elif dialect is None:
            return Geometry(
                geometry_type="GEOMETRY",
                srid=4326,
                spatial_index=True,
                from_text="ST_GeomFromEWKT",
                name="geometry",
                nullable=True,
            )
        return dialect.type_descriptor(
            Geometry(
                geometry_type="GEOMETRY",
                srid=4326,
                spatial_index=True,
                from_text="ST_GeomFromEWKT",
                name="geometry",
                nullable=True,
            )
        )


class LocationType(str, Enum):
    """Categorization of colliery operational zones."""

    SURFACE_BENCH = "SURFACE_BENCH"
    UNDERGROUND_SEAM = "UNDERGROUND_SEAM"
    SHAFT_COLLAR = "SHAFT_COLLAR"
    VENTILATION_DISTRICT = "VENTILATION_DISTRICT"
    HAULAGE_ROADWAY = "HAULAGE_ROADWAY"
    WORKING_FACE = "WORKING_FACE"


class MineLocation(Base):
    """Topological mine asset coordinate and boundary registry."""

    __tablename__ = "mine_locations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    location_name: Mapped[str] = mapped_column(String(255), nullable=False)
    location_type: Mapped[str] = mapped_column(
        String(50),
        default=LocationType.SURFACE_BENCH.value,
        nullable=False,
    )
    rfid_beacon_id: Mapped[Optional[str]] = mapped_column(
        String(128),
        unique=True,
        index=True,
        nullable=True,
    )
    # PostGIS spatial column: supports Points (sensors/gates) or Polygons (benches/seams)
    geom = mapped_column(
        PostGISGeometry(),
        nullable=True,
    )
    parent_location_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("mine_locations.id", ondelete="SET NULL"),
        nullable=True,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Hierarchical Relationship (e.g., Seam -> District -> Pillar/Face)
    parent: Mapped[Optional["MineLocation"]] = relationship(
        "MineLocation",
        remote_side=[id],
        back_populates="children",
    )
    children: Mapped[List["MineLocation"]] = relationship(
        "MineLocation",
        back_populates="parent",
        cascade="all, delete-orphan",
    )
