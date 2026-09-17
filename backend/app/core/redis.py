"""Redis Client Connection & Pub/Sub Alert Dispatcher

Manages asynchronous Redis connection pooling and broadcasts high-priority
statutory alarms and telemetry alerts across control room channels.
"""

import json
import logging
from datetime import date, datetime
from typing import Any, Dict, Optional
import uuid

import redis.asyncio as aioredis
from app.core.config import settings

logger = logging.getLogger("coalguard.redis")

# Global Redis connection pool
_redis_pool: Optional[aioredis.ConnectionPool] = None
_redis_client: Optional[aioredis.Redis] = None


class JSONEncoderWithDates(json.JSONEncoder):
    """Custom JSON encoder supporting UUIDs and ISO 8601 Datetime objects."""

    def default(self, obj: Any) -> Any:
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        if isinstance(obj, uuid.UUID):
            return str(obj)
        return super().default(obj)


def get_redis_pool() -> aioredis.ConnectionPool:
    """Returns or initializes the singleton asynchronous Redis connection pool."""
    global _redis_pool
    if _redis_pool is None:
        _redis_pool = aioredis.ConnectionPool.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            max_connections=50,
        )
    return _redis_pool


def get_redis_client() -> aioredis.Redis:
    """Returns a client instance using the singleton connection pool."""
    global _redis_client
    if _redis_client is None:
        _redis_client = aioredis.Redis(
            connection_pool=get_redis_pool(),
            decode_responses=True,
        )
    return _redis_client


async def init_redis_pool() -> None:
    """Initializes and verifies Redis connectivity during application startup."""
    try:
        client = get_redis_client()
        await client.ping()
        logger.info(f"Connected to Redis broker at {settings.REDIS_URL}")
    except Exception as exc:
        logger.warning(
            f"Redis connection warning ({settings.REDIS_URL}): {exc}. "
            "Real-time Pub/Sub will operate in resilient offline logging mode."
        )


async def close_redis_pool() -> None:
    """Gracefully closes Redis connection pool on application shutdown."""
    global _redis_client, _redis_pool
    if _redis_client is not None:
        try:
            await _redis_client.close()
        except Exception as exc:
            logger.debug(f"Error closing Redis client: {exc}")
        _redis_client = None

    if _redis_pool is not None:
        try:
            await _redis_pool.disconnect()
        except Exception as exc:
            logger.debug(f"Error disconnecting Redis pool: {exc}")
        _redis_pool = None
    logger.info("Redis connection pool disposed.")


# Test hook to inspect published alerts during test runs
_published_alerts_history = []


async def publish_safety_alert(channel: str, message: Dict[str, Any]) -> bool:
    """Serializes and broadcasts safety alarms over designated Redis Pub/Sub channels.

    Channels:
    - gas_alerts: Critical CH4 trips, elevated methane warnings, CO heating alerts.
    - hardware_alerts: Device offline notifications, critical sensor disconnects.
    """
    try:
        payload_str = json.dumps(message, cls=JSONEncoderWithDates)
    except Exception as exc:
        logger.error(f"Failed to serialize alert message for channel '{channel}': {exc}")
        return False

    _published_alerts_history.append({"channel": channel, "message": message})

    try:
        client = get_redis_client()
        subscribers_reached = await client.publish(channel, payload_str)
        logger.info(
            f"[PUB/SUB] Dispatched alert to '{channel}' ({subscribers_reached} listeners): "
            f"{message.get('alert_type', 'ALERT')}"
        )
        return True
    except Exception as exc:
        logger.warning(
            f"Unable to publish alert to Redis channel '{channel}': {exc}. "
            f"Message recorded in memory fallback buffer."
        )
        return False
