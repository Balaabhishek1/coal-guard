"""API v1 Router Aggregation Module

Mounts all sub-routers (auth, and future governance, telemetry, sync routers).
"""

from fastapi import APIRouter

from app.api.v1.auth import router as auth_router

api_router = APIRouter()
api_router.include_router(auth_router)

__all__ = ["api_router"]
