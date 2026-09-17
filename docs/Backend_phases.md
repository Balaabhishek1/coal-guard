Here is a complete, phase-wise backend development plan tailored to your enterprise architecture. It covers the entire system step-by-step—from the core identity layer and hardware diagnostic gateways up to the OCR pipeline and WebSockets server.
Execute these phases sequentially to build a fully testable API before connecting the React frontend or Flutter app.
Phase 1: Core System Setup, Identity & Database Schema
Goal: Establish the foundational FastAPI application, database schemas, and RBAC authentication system.
1.1. Project & Environment Setup
Initialize the FastAPI project directory structure as specified in BACKEND_GUIDE.md.
Configure pydantic-settings to load environment variables (DATABASE_URL, REDIS_URL, JWT_SECRET, ALGORITHM).
Set up Alembic for database migrations.
1.2. Database & Spatial Extensions Init
Set up SQLAlchemy 2.0 with async engine (asyncpg).
Execute initialization scripts to enable postgis, timescaledb, and pgcrypto extensions.
Implement ORM models for users, worker_credentials, mine_locations, and contractors.
1.3. Identity & RBAC Authentication Routes (/api/v1/auth)
Implement password hashing (Bcrypt) and JWT token generation.
Build POST /auth/login to authenticate users based on roles (MINER, OVERMAN, MANAGER, DGMS_INSPECTOR).
Build FastAPI security dependencies (get_current_user, require_role).
1.4. Worker Eligibility Resolver (GET /auth/workers/{rfid_tag}/eligibility)
Implement logic to query a worker's VTC training expiration, Periodic Medical Exam (PME) date, and shift duration limits.
Return a sub-millisecond JSON boolean evaluation ({"eligible": true/false}) for consumption by the edge gate.
Phase 2: Hardware Gateway, Telemetry Ingestion & TimescaleDB
Goal: Build the integration hub (Module 2) that ingests third-party hardware diagnostics and high-frequency gas data.
2.1. Telemetry Data Layer Setup
Implement ORM models for hardware_registry and sensor_telemetry.
Execute Alembic migration to convert sensor_telemetry into a TimescaleDB hypertable (7-day time chunks).
Create continuous aggregates (materialized views) for hourly $CH_4$ and $CO$ averages.
2.2. Hardware Diagnostic Routes (/api/v1/telemetry/hardware)
POST /hardware/register: Register new cameras, turnstiles, and ETD sensors.
POST /hardware/heartbeat: Ingest heartbeat pings from devices to track online/offline status.
GET /hardware/matrix: Fetch the live diagnostic health status of all colliery hardware.
2.3. Gas Telemetry Ingestion (POST /api/v1/telemetry/ingest/gas)
Build high-throughput ingestion route accepting batch sensor readings ($CH_4$, $CO$, air velocity).
Implement threshold interlock check: if $CH_4 \ge 0.75\%$ (warning) or $\ge 1.25\%$ (critical), publish a real-time event to Redis Pub/Sub.
Phase 3: Statutory Governance, Workflows & Cryptographic Audit Ledger
Goal: Implement Module 1 logic to track safety violations, drive the remediation state machine, and enforce SHA-256 hash chaining.
3.1. Remediation State Machine (/api/v1/governance/violations)
Implement ORM model for compliance_violations.
POST /violations: Create new safety tickets with assigned severity levels and SLA deadlines.
PATCH /violations/{id}/status: Handle state transitions (DETECTED $\to$ NOTICE_SERVED $\to$ ACTION_TAKEN $\to$ VERIFIED $\to$ STATUTORY_CLOSEOUT).
3.2. SHA-256 Hash-Chained Audit Ledger (audit_service.py)
Implement the audit_ledger model.
Build the HashChainService:
$$\text{Current Hash} = \text{SHA256}\left(\text{Previous Hash} \parallel \text{Timestamp} \parallel \text{ActorID} \parallel \text{Payload}\right)$$
Hook the service into all state machine transitions and statutory shift sign-offs to guarantee non-repudiation.
3.3. SLA Escalation Celery Worker (sla_worker.py)
Set up Celery with Redis as the message broker.
Create a periodic Celery task (running every 5 minutes) that scans for open violations exceeding their SLA deadline and automatically escalates their severity tier.
Phase 4: Edge Vision Gateway Interlocks & Real-time WebSockets
Goal: Bridge Module 3 edge vision metadata with Module 6 control room streams.
4.1. Edge Access Event Logging (POST /api/v1/vision-edge/events/access-attempt)
Build an endpoint to receive post-turnstile actuation metadata from the edge mini-PC (rfid_tag, optical_compliance, wear_states).
Automatically commit non-compliant entry attempts as high-severity violations linked to contractor profiles.
4.2. Control Room WebSocket Gateway (/api/v1/ws/control-room)
Implement a unified WebSocket endpoint using FastAPI's WebSocketManager.
Connect the endpoint to Redis Pub/Sub channels to broadcast:
Live edge gate access attempts and bounding-box coordinates.
Gas threshold warnings ($CH_4$ spikes).
Hardware offline alerts.
Phase 5: Resilient Offline-First Mobile Sync Engine
Goal: Implement Module 4 backend capabilities to receive sync dumps from the Flutter inspector client.
5.1. Idempotent Batch Sync Route (POST /api/v1/sync/batch)
Build a batch sync endpoint supporting JSON or binary Protocol Buffers (Protobuf).
Implement UUID idempotency verification to prevent duplicate entries if an upload is interrupted and retried.
Unpack offline Form IV shift logs, roof-bolt torque tests, and ventilation readings into PostgreSQL.
5.2. Resumable Evidence Upload Protocol (POST /api/v1/sync/upload-evidence)
Integrate a chunked, resumable file upload handler (Tus.io protocol or custom chunked streamer) to accept compressed WebP photos captured underground.
Link uploaded photos to their corresponding compliance ticket IDs in the database.
Phase 6: OCR Document Processing & Report Generation
Goal: Implement Module 5 asynchronous document extraction and automated statutory report compilation.
6.1. Asynchronous OCR Celery Pipeline (/api/v1/documents)
POST /documents/upload: Accept paper scans (PDF/PNG), save to local/S3 storage, and dispatch a Celery task ID.
Implement the document Celery worker using PaddleOCR for text extraction and regular expressions/LayoutLMv3 for entity parsing (Expiry Date, Certificate No, FLPM Class).
Auto-update worker_credentials or hardware_registry based on extracted expiration dates.
6.2. Statutory PDF Report Exporters (/api/v1/reports)
Build services using ReportLab or WeasyPrint to compile database records into official DGMS-formatted PDF summaries.
Expose endpoints for single-click downloads of daily shift diaries, MSRI (Mine Safety Risk Index) scorecards, and audit ledger verifications.
Summary Checklist for Backend Implementation
Phase
Core Deliverable
Primary Tech Used
Phase 1
Auth, RBAC & Eligibility Endpoint
FastAPI, PostgreSQL, PostGIS, PyJWT
Phase 2
Telemetry Hub & Gas Ingestion
TimescaleDB, Redis, AsyncPG
Phase 3
SLA State Machine & Hash Ledger
Celery, Redis, SQLAlchemy 2.0
Phase 4
Vision Edge Log & WS Server
WebSockets, Redis Pub/Sub
Phase 5
Mobile Sync & Chunked Uploads
Protobuf, Tus.io protocol
Phase 6
OCR Pipeline & DGMS PDF Exporter
PaddleOCR, WeasyPrint, Celery

