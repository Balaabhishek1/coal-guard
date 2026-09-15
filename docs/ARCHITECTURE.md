# ARCHITECTURE.md

## 1. End-to-End System Topology

The platform architecture is designed as a highly available, edge-resilient ecosystem. It separates concerns between the harsh physical mining environment (where connectivity is poor) and the administrative cloud (where heavy aggregation and reporting occurs).

The architecture is divided into three primary layers:
1.  **Edge & Field Layer (Capture & Actuate)**
2.  **Enterprise Backend Layer (Process, Govern & Store)**
3.  **Presentation & Command Layer (Visualize & Control)**

---

## 2. Layered Architecture Diagram

```text
========================================================================================================================
                                     1. EDGE & FIELD LAYER (The Mine Site)
========================================================================================================================

  [SURFACE & UNDERGROUND FIELD OPS]                           [PITHEAD SHAFT-COLLAR CHECKPOINT]
  
  +---------------------------------------+                   +---------------------------------------+
  |    Field Inspector Mobile App         |                   |         Pithead Edge Gateway          |
  |    (Flutter + Drift SQLite)           |                   |       (NVIDIA Jetson / Mini-PC)       |
  |                                       |                   |                                       |
  |  * CMR 2017 Digital Checklists        |                   |  +---------------------------------+  |
  |  * Offline-First Storage              |                   |  |  RTSP Camera: 1080p @ 30 FPS    |  |
  |  * Dual Tagging (GPS + NFC/BLE)       |                   |  +----------------┬----------------+  |
  +-------------------┬-------------------+                   |                   │                   |
                      │ (Auto-Sync upon Wi-Fi)                |                   ▼                   |
                      │                                       |  +---------------------------------+  |
                      ▼                                       |  | DeepStream / TensorRT (YOLO11s) |  |
            [Tus.io / Protobuf API]                           |  | Direct State Wear Classification|  |
                      │                                       |  +----------------┬----------------+  |
                      │                                       |                   │                   |
                      │                                       |  +----------------┴----------------+  |
                      │                                       |  | Cap-Lamp RFID / Wiegand Reader  |  |
                      │                                       |  +----------------┬----------------+  |
                      │                                       |                   │                   |
                      │                                       |                   ▼                   |
                      │                                       |      [Access Policy Evaluator]        |
                      │                                       |       /                      \        |
                      │                                       | (COMPLIANT)              (VIOLATION)  |
                      │                                       |     │                         │       |
                      │                                       |     ▼                         ▼       |
                      │                                       | [Modbus Relay Pulse]     [Lock Gate]  |
                      │                                       +---------┬──────────────────┬----------+
                      │                                                 │                  │
                      │                              (Metadata / JSON)  │                  │ (WebRTC)
                      │                                                 ▼                  ▼
======================╪=================================================╪==================╪===========================
                      │           2. ENTERPRISE BACKEND LAYER (On-Prem Server / Cloud)     │
======================╪=================================================╪==================╪===========================
                      │                                                 │                  │
                      ▼                                                 ▼                  │
  +-------------------------------------------------------------------------------------+  │
  |                          FastAPI Enterprise Gateway                                 |  │
  |                                                                                     |  │
  |  * OAuth2 & RBAC Engine                                                             |  │
  |  * Worker Credential Resolver (VTC, Medical, Shift Overtime Guard)                  |  │
  |  * SLA Remediation State Machine (Detected -> Verified -> Resolved -> Closed)       |  │
  |  * SHA-256 Hash-Chained Audit Ledger (Tamper-Evident Logic)                         |  │
  +-------------------------┬───────────────────────────┬──────────────────────────────-+  │
                            │                           │                                  │
                            ▼                           ▼                                  │
  +-----------------------------------+   +------------------------------------+           │
  |     Hardware Telemetry Hub        |   |   Document Digitization Pipeline   |           │
  |      (Node.js / Mosquitto)        |   |     (Celery Worker + PaddleOCR)    |           │
  |                                   |   |                                    |           │
  | * Modbus / OPC-UA / MQTT Adapters |   | * Image Deskewing & Binarization   |           │
  | * Device Heartbeat Diagnostics    |   | * LayoutLMv3 Entity Extraction     |           │
  | * Environmental Gas Interlocks    |   | * Validity / Expiry Parsing        |           │
  +-----------------┬-----------------+   +-----------------┬------------------+           │
                    │                                       │                              │
                    ▼                                       ▼                              │
  +-------------------------------------------------------------------------------------+  │
  |                               Storage & Messaging Bus                               |  │
  |                                                                                     |  │
  |  * PostgreSQL 16 + PostGIS 3.4 : Relational Data, RBAC, Spatial Mine Geometry       |  │
  |  * TimescaleDB Engine          : Time-Series Environmental Telemetry (CH4, CO)      |  │
  |  * Redis 7                     : Caching, Pub/Sub Alerting, Celery Task Queues      |  │
  +-------------------------------------------------------------┬-----------------------+  │
                                                                │                          │
                                                                │ WebSockets (JSON)        │
                                                                ▼                          │
===========================================================================================╪===========================
                                   3. PRESENTATION & COMMAND LAYER (Control Room)          │
===========================================================================================╪===========================
                                                                                           │
  +-------------------------------------------------------------------------------------+  │
  |                   React 19 + TypeScript + Vite Enterprise Web Portal                |  │
  |                                                                                     |  │
  |   +-----------------------------+  +-------------------------------+                |  │
  |   |    Pithead Live Gate HUD    |  |     Mine Spatial GIS Map      |                |  │
  |   |  - Native WebRTC Video ◄────┼──┼───────────────────────────────┼────────────────┼──┘
  |   |  - HTML5 Canvas Overlays    |  |  - MapLibre GL Vector Tiles   |                |
  |   |  - Real-time Gate Status    |  |  - Lease vs Active Bench Geo  |                |
  |   +-----------------------------+  +-------------------------------+                |
  |                                                                                     |
  |   +-----------------------------+  +-------------------------------+                |
  |   |   Diagnostic Health Matrix  |  |  Statutory Compliance Center  |                |
  |   |  - Sensor Heartbeat Monitor |  |  - SLA Escalation Kanban      |                |
  |   |  - Ping / Packet Loss Stats |  |  - Hash-Chained Audit Ledger  |                |
  |   +-----------------------------+  +-------------------------------+                |
  +-------------------------------------------------------------------------------------+

  3. Core Architectural Patterns
3.1. Edge Arbitration (Avoid Cloud Latency)
To prevent shift bottlenecks, the Pithead Gate does not rely on a round-trip to the cloud to make an access decision.

The Edge Gateway holds a cached, daily-synced Redis replica of authorized workers (credential cache).

The YOLO11s model evaluates the wear-state locally.

The Modbus relay fires locally.

The result (the metadata of the event) is fired to the Central FastAPI server asynchronously after the gate has already permitted/denied entry.

3.2. Out-of-Band Video Delivery
Streaming multi-channel video through the central Python web server will kill CPU performance.

Pattern: Out-of-Band Streaming.

Flow: The Edge Gateway uses MediaMTX to bridge the RTSP camera feed directly to a WebRTC stream. The React Frontend connects directly to the WebRTC stream. The FastAPI backend never touches the video frames; it only sends the bounding-box coordinate JSON via WebSockets, which the frontend paints onto a Canvas overlay.

3.3. Dual-Store Strategy (Relational vs. Time-Series)
PostgreSQL: Handles strongly consistent, highly relational data (User roles, hash-chained audit logs, compliance tickets, geospatial geometries via PostGIS).

TimescaleDB: (A PostgreSQL extension) Handles high-throughput append-only data from the Telemetry Hub (e.g., CH 
4
​
  sensors firing readings every second). It automatically partitions this data into time-based chunks (hypertables) for rapid querying and aggregation without locking the relational tables.

3.4. Resilient Delta-Sync for the Mobile Client
Due to the lack of cellular coverage underground:

The Flutter app operates with an Offline-First architecture via Drift (SQLite).

When syncing, it uses Idempotency Keys (UUIDs). If a sync attempt fails mid-transmission due to weak Wi-Fi, the backend safely ignores duplicates on the next attempt.

Large photo evidence payloads are decoupled from textual audits and uploaded separately via chunked, resumable APIs.