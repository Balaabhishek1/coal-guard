# Phase 1: Frontend Core Setup, Design System & Auth Pipeline

**Goal:** Initialize the React 19 + TypeScript + Vite project, configure the Stitch design system / Tailwind tokens, and build the persistent authentication and RBAC session pipeline.

## 1.1. Project & Stitch Infrastructure Setup

- Initialize React 19, TypeScript, Vite, Tailwind CSS, and shadcn/ui.Import Google Stitch design tokens (color palettes, typography, spacing primitives) and Lucide React icons.Set up Axios / TanStack Query (React Query) HTTP client pointed to http://localhost:8000/api/v1.## 1.2. Global Auth Store & JWT Interceptor (Zustand)

- Create useAuthStore in Zustand to manage JWT tokens, current user role (MINER, OVERMAN, MANAGER, DGMS_INSPECTOR), and user profile.Build an Axios request/response interceptor to append Authorization: Bearer <token> to requests and automatically redirect on 401 Unauthorized errors.## 1.3. Screen Implementation & Route Protection

- Login View: Bind Google Stitch Login page to POST /auth/login.RBAC Route Guards: Implement ProtectedRoute wrappers that restrict page navigation based on JWT role permissions.
# Phase 2: Hardware Gateway HUD & Live Diagnostic Matrix

**Goal:** Connect the frontend to Phase 2 backend services to monitor hardware health, continuous gas telemetry ($CH_4$, $CO$), and industrial thresholds.

## 2.1. Diagnostic Hardware Matrix View (/diagnostics)

- Connect Stitch Diagnostic Screen to GET /hardware/matrix.Implement TanStack Query auto-refresh polling (every 5 seconds) to update device statuses (is_online, last_heartbeat, latency_ms).Add UI controls to trigger POST /hardware/register for registering new cameras, turnstiles, and ETD gas sensors.## 2.2. Environmental Telemetry Dashboard (/telemetry)

- Integrate Recharts to render historical gas trends ($CH_4$ % and $CO$ PPM) by fetching data from the TimescaleDB endpoints.Display continuous threshold indicators (e.g., highlighting values in Emerald when safe, Amber when $\ge 0.75\%$, and Rose when $\ge 1.25\%$).
# Phase 3: Real-Time WebSockets, Pithead Gate HUD & Live Canvas Overlays

**Goal:** Bind the live control room HUD to Phase 4 backend WebSockets to display WebRTC video streams, live optical wear-states, and instantaneous alerts.

## 3.1. Unified Control Room WebSocket Hook (useControlRoomWS)

- Build a custom React hook connecting to ws://localhost:8000/api/v1/ws/control-room.Auto-reconnect on connection drops and dispatch incoming Redis messages (GATE_ACCESS_ATTEMPT, GAS_SPIKE_ALERT, HARDWARE_OFFLINE) to Zustand stores.## 3.2. Pithead Gate WebRTC & Canvas HUD (/gate-hud)

- Connect Stitch Gate HUD Screen to native <video> elements receiving WebRTC streams via MediaMTX.Mount an overlay <canvas> above the video feed.Use a custom useCanvasOverlay hook driven by requestAnimationFrame to draw bounding boxes and status cards (hardhat_worn, scsr_worn) received over the WebSocket.## 3.3. Real-Time Alert Banner Component

- Implement a sticky top-bar notification banner that flashes red and plays an audible tone when critical $CH_4$ power trips or unauthorized gate breaches are broadcast over WebSockets.
# Phase 4: Statutory Governance, Remediation Kanban & Audit Ledger

**Goal:** Connect the governance UI to Phase 3 backend logic to manage safety tickets, drive the remediation state machine, and display the cryptographic audit trail.

## 4.1. Violation Remediation Kanban Board (/governance/remediation)

- Connect Stitch Remediation View to GET /governance/violations.Display interactive columns for the state machine: DETECTED $\to$ NOTICE_SERVED $\to$ ACTION_TAKEN $\to$ VERIFIED $\to$ STATUTORY_CLOSEOUT.Add SLA countdown timers on each card that turn red as tickets approach their resolution deadline.Implement drag-and-drop or status update modals triggering PATCH /governance/violations/{id}/status.## 4.2. Immutable Cryptographic Audit Ledger View (/governance/audit-ledger)

- Connect Stitch Audit Ledger Screen to GET /governance/audit-ledger.Build a high-density DataTable showing seq_id, timestamp, actor, action type, and SHA-256 current_hash.Add a prominent "Verify Chain Integrity" button connecting to GET /governance/audit-ledger/verify that displays a green verification shield or identifies broken block links.
# Phase 5: Mobile Sync Dashboard & Field Audit Management

**Goal:** Provide management visibility into field audits synchronized from the mobile app (Phase 5 backend).

## 5.1. Mobile Sync Monitoring Screen (/field-ops/sync-logs)

- Connect Stitch Field Ops Screen to GET /sync/logs.Display a historical log of mobile upload batches (sync_id, device_id, records_processed, status).## 5.2. Digital Form IV Inspection Explorer (/field-ops/form-iv)

- Build a master-detail view to browse underground roof-bolt torque readings, air velocity values, and NFC location tags.Render associated WebP evidence photos uploaded via the chunked upload protocol.
# Phase 6: Document Digitization Studio & Statutory PDF Exporters

**Goal:** Connect the OCR document uploader and PDF report generators (Phase 6 backend) to complete the frontend platform.

## 6.1. Multimodal OCR Digitization Studio (/documents/ocr)

- Connect Stitch Upload Screen to POST /documents/upload.Build a drag-and-drop zone accepting paper certificate scans (PNG/PDF).Implement a polling hook tracking task_id status (PENDING $\to$ PROCESSING $\to$ COMPLETED).Display a split-screen view: the original document preview on the left, and editable extracted entity fields (valid_until, serial_no) on the right with a "Confirm & Verify" button (PATCH /documents/{id}/verify).## 6.2. Statutory PDF Exporters & MSRI Dashboard (/reports)

- Connect Stitch Reports View to POST /reports/generate.Add one-click export cards for:DGMS Shift Diary SummaryMine Safety Risk Index (MSRI) ScorecardSHA-256 Audit Chain ProofHandle binary file streaming (responseType: 'blob') to instantly trigger PDF downloads in the browser.
# Phase-Wise Integration Plan

| Phase | Core Deliverable | Primary Tech / Tools | Backend Alignment |
|---|---|---|---|
| Phase 1 | Auth, RBAC Session & Stitch Tokens | React 19, Zustand, Axios, Stitch UI | Phase 1 Backend |
| Phase 2 | Hardware Diagnostic Grid & Telemetry Charts | TanStack Query, Recharts | Phase 2 Backend |
| Phase 3 | WebRTC Video Player & Canvas Overlay HUD | WebSockets, Canvas API, MediaMTX | Phase 4 Backend |
| Phase 4 | Violation Kanban & Cryptographic Ledger | React Table, Lucide Icons | Phase 3 Backend |
| Phase 5 | Field Sync Log & Form IV Inspection Viewer | Master-Detail UI, Image Viewer | Phase 5 Backend |
| Phase 6 | OCR Digitization Studio & PDF Downloads | Split-Screen UI, File Downloader | Phase 6 Backend |
