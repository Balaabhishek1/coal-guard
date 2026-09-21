#!/bin/sh
set -e

# Asynchronous healthcheck & wait script for PostgreSQL and Redis
echo "Checking database connection..."
python - << 'EOF'
import sys
import time
import os
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

try:
    from app.core.config import settings
    db_url = settings.DATABASE_URL
except Exception:
    db_url = os.environ.get("DATABASE_URL", "")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+"):
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if "sslmode=" in db_url:
        db_url = db_url.replace("sslmode=", "ssl=")

async def wait_for_db():
    if not db_url or "sqlite" in db_url:
        return
    for attempt in range(1, 31):
        try:
            engine = create_async_engine(db_url, connect_args={"timeout": 5})
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            await engine.dispose()
            print("Database connection verified.")
            return
        except Exception as err:
            print(f"Waiting for database (attempt {attempt}/30): {err}")
            await asyncio.sleep(2)
    print("Database connection timed out after 60 seconds.")
    sys.exit(1)

asyncio.run(wait_for_db())
EOF

# If running uvicorn web server, execute Alembic migrations
if [ "$1" = "uvicorn" ] || [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "Applying statutory database migrations (alembic upgrade head)..."
    alembic upgrade head
    echo "Database migrations applied successfully."
fi

# Create upload directories if not present
mkdir -p "${UPLOAD_DIR:-uploads/evidence}"

# Hand over to CMD
exec "$@"
