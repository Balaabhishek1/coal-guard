"""AI MineGuard Central Backend Entry Point

High-performance asynchronous FastAPI application with PostGIS spatial registry,
statutory governance workflows, and sub-millisecond pithead gate arbitration.
"""

from contextlib import asynccontextmanager
from datetime import datetime, timezone
import logging

from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.v1 import api_router
from app.core.config import settings
from app.db.session import engine, init_spatial_extensions

# Configure application logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("coalguard.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle manager: verifies database connectivity and spatial extensions."""
    logger.info(f"Booting {settings.PROJECT_NAME} v{settings.VERSION} [{settings.ENVIRONMENT}]...")
    try:
        await init_spatial_extensions()
        logger.info("Database connectivity and spatial extensions verified successfully.")
    except Exception as exc:
        logger.error(f"Startup database initialization error: {exc}")
    yield
    logger.info(f"Shutting down {settings.PROJECT_NAME} engine...")
    await engine.dispose()
    logger.info("Database connection pool disposed cleanly.")


app = FastAPI(
    title="AI MineGuard Core Engine",
    version=settings.VERSION,
    description=(
        "AI MineGuard: Industrial Coal Mining Governance, Statutory Safety Compliance, "
        "and Edge Vision Gate Ingress Arbitration Engine under CMR 2017 & Mines Act 1952."
    ),
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Cross-Origin Resource Sharing (CORS) Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get(
    "/health",
    tags=["System Diagnostics"],
    summary="System Health Check",
    status_code=status.HTTP_200_OK,
)
async def health_check():
    """Comprehensive readiness probe verifying API status and database responsiveness."""
    db_status = "HEALTHY"
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception as exc:
        db_status = f"UNHEALTHY: {str(exc)}"

    return {
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "ONLINE" if "UNHEALTHY" not in db_status else "DEGRADED",
        "database": db_status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "environment": settings.ENVIRONMENT,
    }


@app.get(
    "/",
    tags=["System Diagnostics"],
    summary="Root Gateway",
)
async def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API Gateway",
        "docs_url": "/docs",
        "health_url": "/health",
        "version": settings.VERSION,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
