# BACKEND_GUIDE.md

## 1. Backend Architecture & Tech Stack
The backend operates as the central authority for the entire mining platform (Module 1, 2, and 5 integrations). It is built for high concurrency (to handle high-frequency telemetry and sync requests) and strict data validation (to meet regulatory compliance standards).

*   **Runtime:** Python 3.12+
*   **Web Framework:** FastAPI (Asynchronous, built-in OpenAPI docs, dependency injection).
*   **Data Validation:** Pydantic v2.
*   **ORM:** SQLAlchemy 2.0 (Async mode via `asyncpg`).
*   **Databases:** 
    *   PostgreSQL 16 (Primary relational data).
    *   PostGIS 3.4 (Spatial extension for GIS operations).
    *   TimescaleDB (Extension for time-series gas/telemetry data).
*   **Caching & Queues:** Redis 7.
*   **Background Workers:** Celery (for SLA countdowns, report generation, and OCR processing).
*   **Authentication:** OAuth2 with JWT (JSON Web Tokens).

## 2. Standardized Directory Structure
We follow a domain-driven, feature-sliced directory structure:

```text
backend/
├── alembic/                  # Database migrations
├── app/
│   ├── api/
│   │   ├── dependencies.py   # JWT validation, DB sessions
│   │   └── v1/               # API Routers (auth, governance, telemetry, sync, ocr)
│   ├── core/                 # Configs, Security (Hashing, JWT), Constants
│   ├── db/                   # SQLAlchemy setup, PostGIS/Timescale configs
│   ├── models/               # SQLAlchemy ORM Models (AuditLogs, Violations, Workers)
│   ├── schemas/              # Pydantic validation schemas (Input/Output definitions)
│   ├── services/             # Business Logic (Escalations, Hash-chaining)
│   └── worker/               # Celery tasks (OCR, SLA checks, Reports)
├── requirements.txt
└── main.py                   # FastAPI application entry point
```

---

## 3. API Routes & Services Breakdown

### 3.1. Authentication & Identity (`/api/v1/auth`)
* **Purpose:** Manages user sessions, RBAC, and statutory worker credentials.
* **Routes:**
  * `POST /login`: Issues JWT tokens based on role (e.g., `Colliery_Manager`, `Safety_Officer`, `Inspector`).
  * `GET /workers/{worker_id}/eligibility`: Called by the Edge Vision Gate (Module 3) after an RFID badge tap.
* **Service Logic:** Queries the database to check if the worker's Vocational Training Center (VTC) and Periodic Medical Examination (PME) certifications are valid, and verifies shift limits to prevent statutory overtime violations. Returns `{"eligible": true}` or triggers access denial with a statutory explanation.

---

### 3.2. Statutory Governance & Workflows (`/api/v1/governance`)
* **Purpose:** Drives the Remediation State Machine and maintains the Immutable Audit Ledger.
* **Routes:**
  * `POST /violations`: Creates a new safety violation ticket.
  * `PATCH /violations/{id}/status`: Updates workflow state (`NOTICE_SERVED` → `ACTION_TAKEN` → `RESOLVED`).
  * `GET /audit-logs`: Retrieves the cryptographic audit trail for DGMS inspections and internal reviews.
* **Service Logic (`audit_service.py`):** Every state transition triggers the `HashChainService`. It fetches the last known hash from the `audit_logs` table, concatenates it with the new payload and timestamp, computes the SHA-256 hash, and inserts the new cryptographic anchor.
* **Celery Worker (`sla_escalation_worker`):** Runs every 5 minutes. Scans for violations exceeding their statutory SLA clock (e.g., > 24 hours unresolved). Automatically bumps the severity level and sends alerts to higher-tier managers (Overman → Safety Officer → Colliery Manager).

---

### 3.3. Offline Mobile Sync (`/api/v1/sync`)
* **Purpose:** Handles batched data synchronization from the Flutter mobile app (Module 4) when field inspectors return to surface Wi-Fi/LTE connectivity.
* **Routes:**
  * `POST /sync/batch`: Accepts a compressed Protocol Buffer (Protobuf) or chunked JSON payload containing multiple offline shift diaries, roof-sounding tests, and checklists.
  * `POST /sync/upload-evidence`: Utilizes the `tus.io` resumable upload protocol for large WebP evidence photos and audio notes.
* **Service Logic (`sync_service.py`):** Uses UUID idempotency keys to ensure that if a sync drops midway, retries will not duplicate entries. Unpacks checklists and persists them to PostgreSQL within an atomic transaction.

---

### 3.4. Telemetry & Hardware Hub (`/api/v1/telemetry`)
* **Purpose:** Ingests normalized environmental and hardware status data from colliery equipment (Module 2).
* **Routes:**
  * `POST /ingest/gas`: Receives high-frequency Methane ($\text{CH}_4$) and Carbon Monoxide ($\text{CO}$) sensor readings.
  * `POST /ingest/hardware-status`: Receives heartbeat pings and ping latency logs from turnstiles, CCTV cameras, and edge gateways.
* **Service Logic (`telemetry_service.py`):**
  * Routes continuous environmental gas telemetry directly into TimescaleDB hypertables for partition-optimized storage.
  * Evaluates incoming values in real time. If $\text{CH}_4 \ge 1.25\%$ (CMR 2017 threshold), it triggers a Redis Pub/Sub broadcast to immediately push a critical alarm banner to the React Control Room (Module 6) via WebSockets.

---

### 3.5. Vision Edge Gateway (`/api/v1/vision-edge`)
* **Purpose:** Receives lightweight metadata and access arbitration events from the Pithead Checkpoint (Module 3). *(Note: Raw video streams bypass this API and route via MediaMTX WebRTC directly to the frontend).*
* **Routes:**
  * `POST /events/access-attempt`: Logs who attempted pithead entry, their detected wear-state (`hardhat_worn`, `vest_worn`, `scsr_missing`), and the access decision (`Granted` / `Denied`).
* **Service Logic:** Generates an immediate statutory compliance alert if an individual attempts entry without mandatory PPE, linking the violation to the contractor and worker profiles to dynamically adjust their safety rating.

---

### 3.6. OCR & Document Digitization (`/api/v1/documents`)
* **Purpose:** Digitizes legacy paperwork, DGMS certifications, and equipment fitness records (Module 5).
* **Routes:**
  * `POST /upload`: Accepts PDF or image files; returns an asynchronous `task_id`.
  * `GET /status/{task_id}`: Polls for OCR completion and extracted entity status.
* **Service Logic (`document_worker.py`):** Offloads compute-heavy document processing to Celery workers. Uses PaddleOCR for OCR text detection and LayoutLMv3/regex NER pipelines to extract Expiry Dates, DGMS Approval Numbers, and Flameproof (FLPM) classes, automatically updating the equipment database.

---

## 4. Crucial Packages & Integrations

| Package | Purpose & Functionality |
| :--- | :--- |
| `fastapi`, `uvicorn[standard]` | High-performance asynchronous REST API framework and ASGI server |
| `sqlalchemy`, `asyncpg`, `geoalchemy2` | Async database ORM with native PostGIS spatial types and GIS query capabilities |
| `pydantic`, `pydantic-settings` | Schema validation, request serialization, and strongly typed environment management |
| `celery`, `redis` | Distributed asynchronous task queue and in-memory Pub/Sub cache for real-time alerting |
| `passlib`, `python-jose` | Password hashing (Bcrypt) and secure JWT token creation/verification |
| `paddleocr`, `opencv-python-headless` | Optical character recognition, document deskewing, and image filtering in Celery workers |
| `protobuf` | High-efficiency deserialization of binary synchronization payloads from the Flutter mobile app |
