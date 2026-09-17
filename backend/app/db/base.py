"""Database Base & Model Registry Module

Declares SQLAlchemy 2.0 DeclarativeBase and aggregates models for Alembic migrations.
"""

from sqlalchemy import MetaData
from sqlalchemy.ext.asyncio import AsyncAttrs
from sqlalchemy.orm import DeclarativeBase

# Standardized constraint naming convention for consistent Alembic migrations
POSTGRES_NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(AsyncAttrs, DeclarativeBase):
    """Base declarative class with async attributes and naming conventions."""

    metadata = MetaData(naming_convention=POSTGRES_NAMING_CONVENTION)


__all__ = ["Base"]
