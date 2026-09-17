"""API v1 Router Aggregation Module

Mounts all sub-routers (auth, and future governance, telemetry, sync routers).
"""

from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.governance import router as governance_router
from app.api.v1.hardware import router as hardware_router
from app.api.v1.sync import router as sync_router
from app.api.v1.telemetry import router as telemetry_router
from app.api.v1.vision_edge import router as vision_edge_router
from app.api.v1.websocket import router as websocket_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(governance_router)
api_router.include_router(hardware_router)
api_router.include_router(telemetry_router)
api_router.include_router(vision_edge_router)
api_router.include_router(websocket_router)
api_router.include_router(sync_router)

__all__ = ["api_router"]


