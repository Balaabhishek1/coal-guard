"""Database Session & Connection Engine Module

Provides async engine, sessionmaker, and spatial extension initializers.
"""

import logging
from typing import AsyncGenerator
from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import settings

logger = logging.getLogger("coalguard.db")

# Handle engine configuration for both PostgreSQL (asyncpg) and SQLite (testing)
engine_kwargs = {"future": True}

if "sqlite" in settings.DATABASE_URL:
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_size"] = 20
    engine_kwargs["max_overflow"] = 10

engine = create_async_engine(settings.DATABASE_URL, **engine_kwargs)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency yielding an active AsyncSession within an atomic transaction context."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_spatial_extensions() -> None:
    """Safely executes initialization statements for required PostgreSQL extensions:

    PostGIS 3.4, TimescaleDB, and pgcrypto.
    """
    if "sqlite" in settings.DATABASE_URL:
        logger.info("SQLite in use, skipping PostgreSQL extensions initialization.")
        return

    extension_statements = [
        "CREATE EXTENSION IF NOT EXISTS postgis;",
        "CREATE EXTENSION IF NOT EXISTS timescaledb;",
        "CREATE EXTENSION IF NOT EXISTS pgcrypto;",
    ]

    async with engine.begin() as conn:
        for stmt in extension_statements:
            try:
                await conn.execute(text(stmt))
                logger.info(f"Database extension verified: {stmt}")
            except Exception as exc:
                logger.warning(
                    f"Extension initialization warning ({stmt}): {exc}. "
                    "Ensure target database has required privileges/binaries."
                )
