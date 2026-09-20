# Multi-Stage Dockerfile for CoalGuard FastAPI Backend & Celery Workers

# ==============================================================================
# Stage 1: Build & Dependency Compilation
# ==============================================================================
FROM python:3.12-slim AS builder

WORKDIR /build

# Install compilation toolchain for native C extensions (asyncpg, shapely, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment to isolate wheels
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt

# ==============================================================================
# Stage 2: Minimal Production Runtime
# ==============================================================================
FROM python:3.12-slim AS runner

# System packages required for OpenCV, OCR engine, PDF rasterization & PostGIS drivers
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    tesseract-ocr \
    tesseract-ocr-eng \
    ghostscript \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy isolated virtual environment from builder stage
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Environment Variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

WORKDIR /app

# Copy application source code and configuration
COPY . /app

# Ensure entrypoint script has executable permissions and Unix line breaks
RUN chmod +x /app/entrypoint.sh && \
    mkdir -p /app/uploads/evidence

EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
