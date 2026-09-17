"""Application Configuration Module

Loads and validates environment variables using Pydantic Settings v2.
"""

from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # Core Project Metadata
    PROJECT_NAME: str = "AI MineGuard"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # CORS Configuration
    BACKEND_CORS_ORIGINS: List[Union[str, AnyHttpUrl]] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8000",
    ]

    # Database Configuration (PostgreSQL 16 + PostGIS 3.4 + TimescaleDB)
    DATABASE_URL: str = (
        "postgresql+asyncpg://postgres:postgres@localhost:5432/coalguard"
    )

    # Redis Broker & Cache
    REDIS_URL: str = "redis://localhost:6379/0"

    # JWT Security Settings
    JWT_SECRET: str = "mineguard_statutory_jwt_secret_key_change_in_production_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 hours (Standard mining shift)

    # Statutory Governance & Shift Limits (CMR 2017 / Mines Act 1952)
    MAX_CONTINUOUS_SHIFT_HOURS: float = 8.0

    # Celery Task Queue & Asynchronous Workers
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # Statutory SLA Remediation Clocks (Hours)
    SLA_LOW_HOURS: int = 72
    SLA_MEDIUM_HOURS: int = 24
    SLA_HIGH_HOURS: int = 12
    SLA_CRITICAL_HOURS: int = 2


settings = Settings()

