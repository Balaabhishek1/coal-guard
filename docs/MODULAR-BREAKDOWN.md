# MODULAR-BREAKDOWN.md

## 1. System Architecture Overview

The platform is strictly decoupled into six discrete modules. This ensures that field operations can survive network blackouts, edge vision systems can operate autonomously, and the central API remains highly available for corporate reporting.

```text
+--------------------------------------------------------------------------------------------------+
|                    MODULE 6: COMMAND & CONTROL CENTER, WEB PORTAL & GIS                          |
|                             (React 19 + TypeScript + MapLibre GL)                                |
+--------------------------------------------------------------------------------------------------+
             ▲                                ▲                                 ▲
             │ REST / WebSockets              │ WebRTC / Canvas Overlay         │ REST / Protobuf
             ▼                                ▼                                 ▼
+-------------------------+      +-------------------------+      +--------------------------+
| MODULE 1: CORE ENGINE   |      | MODULE 3: VISION GATE   |      | MODULE 4: MOBILE CLIENT  |
| FastAPI, Postgres/GIS,  |<────>| DeepStream, YOLO11s,    |<────>| Flutter, Drift (SQLite), |
| Redis, Celery Workers   |      | Modbus Relay Interlocks |      | BLE/NFC Seam Checkpoints |
+-------------------------+      +-------------------------+      +--------------------------+
             ▲                                ▲
             │ Pub/Sub Events                 │ Extracted Entities
             ▼                                ▼
+-------------------------+      +-------------------------+
| MODULE 2: TELEMETRY HUB |      | MODULE 5: OCR / NER     |
| MQTT Broker, Polling,   |      | PaddleOCR, LayoutLMv3,  |
| SCADA/PLC Adapters      |      | Certificate Validations |
+-------------------------+      +-------------------------+
```

---

## 2. Module Specifications

### MODULE 1: Central Governance, Workforce & Statutory Engine
* **Role:** The platform's authoritative "brain" handling relational data, identities, permissions, and regulatory lifecycles.
* **Technology Stack:** FastAPI, PostgreSQL + PostGIS, Redis, Celery Workers

#### Core Responsibilities
* **Credential Resolution:** Verifies miner eligibility (Vocational Training Center / VTC training, periodic medical clearance, shift limits) when queried by the edge gate.
* **Workflow & Escalations:** Drives the remediation state machine. Evaluates open violations against statutory SLA clocks and auto-escalates to higher authorities (e.g., Overman → Safety Officer → Colliery Manager).
* **Tamper-Evident Ledger:** Implements linear SHA-256 cryptographic hash-chaining on all database writes pertaining to safety logs and administrative sign-offs to guarantee non-repudiation.

---

### MODULE 2: Industrial Telemetry & Hardware Diagnostic Gateway
* **Role:** The integration middleware that connects existing third-party mine hardware to the platform.
* **Technology Stack:** MQTT Broker (EMQX / Mosquitto), Modbus TCP/RTU, OPC-UA, Wiegand Adapters

#### Core Responsibilities
* **Hardware Agnostic Ingestion:** Translates Modbus, OPC-UA, MQTT, and Wiegand protocols into standard JSON payloads.
* **Status Monitoring:** Continuously pings pithead CCTV streams, turnstile relays, and Electronic Telemonitoring Devices (ETDs) to maintain a live hardware health matrix.
* **Threshold Interlocks:** Monitors continuous gas telemetry ($\text{CH}_4$, $\text{CO}$) and triggers emergency workflows if readings breach statutory limits.

---

### MODULE 3: Pithead Checkpoint Computer Vision Engine
* **Role:** An edge-deployed gatekeeper verifying 100% PPE compliance before authorizing shaft access.
* **Technology Stack:** NVIDIA DeepStream / TensorRT, YOLO11s, Modbus / GPIO Relay Interlocks, MediaMTX (WebRTC/RTSP)

#### Core Responsibilities
* **Direct Wear-State Detection:** Uses a lightweight YOLO model to directly classify operational states (`hardhat_worn`, `head_bare`, `vest_worn`, `scsr_worn`), completely bypassing heavy skeletal pose-estimation.
* **Sub-500ms Arbitration:** Operates on an edge mini-PC to validate miners within an engineered single-file choke corridor, ensuring zero bottlenecking during chaotic shift changes.
* **Access Actuation:** Fires a hardware pulse (Modbus/GPIO) to unlock the turnstile **only** if optical compliance and Module 1 RFID credential checks both pass.

---

### MODULE 4: Offline-First Field Inspector & Underground Audit Client
* **Role:** A ruggedized mobile application for Overmen and DGMS inspectors.
* **Technology Stack:** Flutter, Drift (SQLite), BLE/NFC Seam Checkpoints, Protobuf Sync Engine

#### Core Responsibilities
* **Dual-Mode Localization:** Relies on Satellite GPS for surface benches and dynamically switches to NFC/BLE topological checkpoint tagging (`Seam-II -> 14-Dip -> Pillar 42`) for underground workings.
* **Digital Shift Diaries:** Replaces paper Form IV logs for recording roof-sounding tests, air velocity, and strata support parameters.
* **Resilient Delta Sync:** Writes all data to a local SQLite database and pushes highly-compressed Protocol Buffer (Protobuf) chunks to the server upon detecting a reliable Wi-Fi/4G connection.

---

### MODULE 5: Multimodal Document Digitization Engine (OCR & NER)
* **Role:** The AI-driven digitization pipeline for legacy mining documentation and certificates.
* **Technology Stack:** PaddleOCR, LayoutLMv3, FastAPI Microservice

#### Core Responsibilities
* **Image Preprocessing:** Cleans and deskews faded or dusty paper scans using computer vision filters.
* **Entity Extraction:** Uses Named Entity Recognition to parse dates, DGMS approval numbers, and Flameproof Apparatus (FLPM) classes from machinery and contractor documents.
* **Automated Expiry Tracking:** Seeds Module 1 with validation dates to auto-lock expired equipment or untrained personnel from deployment.

---

### MODULE 6: Command & Control Center, Web Portal & GIS
* **Role:** The unified presentation layer providing high-density dashboards for decision-makers.
* **Technology Stack:** React 19, TypeScript, MapLibre GL, HTML5 Canvas, WebRTC Client

#### Core Responsibilities
* **Live Checkpoint HUD:** Receives WebRTC video feeds from Module 3 and renders real-time bounding box annotations on a client-side HTML5 canvas, eliminating server-side rendering lag.
* **Diagnostic Matrix:** Displays the live health of all hardware connected via Module 2.
* **Digital Twin / GIS:** Renders surface topography, lease boundaries, and 2D underground centerlines using MapLibre GL.
* **Compliance Reports:** Generates one-click, audit-ready PDF reports matching DGMS statutory formats.

---

## 3. Inter-Module Communication Matrix

| Source Module | Target Module | Protocol / Channel | Payload Format | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Module 3 (Vision Gate)** | **Module 1 (Core Engine)** | REST (HTTPS) | JSON | Real-time entry validation & credential check |
| **Module 3 (Vision Gate)** | **Module 6 (Control HUD)** | WebRTC / WebSocket | H.264 Video + JSON Meta | Live camera feed and inference bounding boxes |
| **Module 2 (Telemetry Hub)** | **Module 1 (Core Engine)** | MQTT / Redis PubSub | JSON / Binary | Environmental telemetry and gas breach alarms |
| **Module 2 (Telemetry Hub)** | **Module 6 (Control HUD)** | WebSocket | JSON | Live diagnostic health & sensor status feeds |
| **Module 4 (Mobile Client)** | **Module 1 (Core Engine)** | REST (HTTPS) | Binary Protobuf Stream | Batched underground inspection logs & sync deltas |
| **Module 5 (OCR / NER)** | **Module 1 (Core Engine)** | REST / Internal RPC | JSON | Extracted certificates, DGMS approvals, and validity dates |

---

## 4. Reliability, Security & Fail-Safe Mechanisms

* **Fail-Closed Pithead Safety:** If edge hardware loses connectivity to Module 1, the gate evaluates against a locally cached offline whitelist. If credentials cannot be verified, the gate remains locked by default until manual supervisor intervention.
* **Cryptographic Non-Repudiation:** All statutory entries and shift diary submissions contain a cryptographic hash chain tied to preceding records, rendering retroactive modifications immediately detectable.
* **Intrinsically Safe Operation:** Underground inspection tools are constrained to offline-first architectures within flameproof/intrinsically safe hardware enclosures to minimize unnecessary radio transmission underground.
