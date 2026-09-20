# Walkthrough: Phase 5 (Edge Vision Turnstile Simulation - Module 3)

Phase 5 of the enterprise roadmap establishes the standalone **Edge Vision Application (`edge/`)** running on localized pithead mini-PCs. It acts as an autonomous hardware interlock gate barrier enforcing statutory DGMS safety regulations prior to underground shaft ingress.

---

## 1. System Architecture & Interlock Pipeline

```
       PITHEAD VIDEO CAMERA                               PHYSICAL HARDWARE
  (RTSP / CCTV / Synthetic Buffer)                       (RFID Tap / Gate Relay)
 ┌────────────────────────────────┐                     ┌────────────────────────┐
 │ FrameGrabber (Worker Thread)   │                     │ RfidReader (Serial/Sim)│
 │ • cv2.VideoCapture (no-lag)    │                     │ • Scans badge UID      │
 │ • Thread-safe latest frame     │                     └───────────┬────────────┘
 └──────────────┬─────────────────┘                                 │
                │                                                   │
                │ Latest Frame                                      │ Worker Taps Badge
                ▼                                                   ▼
 ┌────────────────────────────────┐                     ┌────────────────────────┐
 │ PpeDetector (YOLO Inference)   │                     │ EdgeTurnstileService   │
 │ • Hardhat detection (>= 0.75)  │                     │ Main Pipeline:         │
 │ • Vest detection (>= 0.75)     │                     │ 1. Frame grab          │
 │ • SCSR pack detection (>= 0.75)│◄────────────────────┤ 2. PPE Optical check   │
 └──────────────┬─────────────────┘                     │ 3. Credential check    │
                │                                       │ 4. Gate decision       │
                │ Optical Wear States                   │ 5. Actuate relay & LED │
                ▼                                       │ 6. Ingest event to API │
 ┌────────────────────────────────┐                     └───────────┬────────────┘
 │ BackendClient                  │                                 │
 │ • GET /auth/workers/{tag}/elig ├─────────────────────────────────┤
 │   (VTC, PME, Shift check)      │                                 │
 └────────────────────────────────┘                                 │
                                                                    ▼
                                                        ┌────────────────────────┐
                                                        │ TurnstileRelay         │
                                                        │ • UNLOCK + Green LED   │
                                                        │   (3.0s Auto-Relock)   │
                                                        │ • OR LOCK + Red Alarm  │
                                                        └───────────┬────────────┘
                                                                    │
                                                                    ▼
                                                        ┌────────────────────────┐
                                                        │ POST /vision-edge/     │
                                                        │ events/access-attempt  │
                                                        │ • Persist audit log    │
                                                        │ • Trigger auto-ticket  │
                                                        └────────────────────────┘
```

---

## 2. Implemented Components & Directory Structure

```text
coal-guard/
└── edge/
    ├── config.py                  # Pydantic BaseSettings for edge runtime
    ├── main.py                    # Edge turnstile orchestrator & CLI
    ├── requirements.txt           # Edge dependencies (opencv, ultralytics, httpx, etc.)
    ├── hardware/
    │   ├── rfid_reader.py         # Physical serial & simulated RFID badge reader
    │   └── turnstile_relay.py     # Solenoid relay & LED indicator controller with auto-lock
    ├── vision/
    │   ├── frame_grabber.py       # Thread-safe no-lag OpenCV video capture
    │   └── ppe_detector.py        # YOLO statutory PPE detector & bounding box annotator
    ├── services/
    │   └── backend_client.py      # HTTP client for worker eligibility & event logging
    └── tests/
        └── test_edge_pipeline.py  # 16 unit and integration test cases
```

### A. Configuration & Vision Pipeline
- **[`edge/config.py`](file:///c:/Users/sksam/Desktop/coal-guard/edge/config.py)**:
  - `BACKEND_API_URL`: Surface backend endpoint (`http://localhost:8000/api/v1`).
  - `CONFIDENCE_THRESHOLD`: $0.75$ minimum threshold for statutory safety compliance.
  - `RELAY_PULSE_DURATION`: $3.0\text{s}$ solenoid hold duration.
  - `LOCATION_ID`: Gate UUID (`a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11`).
- **[`edge/vision/frame_grabber.py`](file:///c:/Users/sksam/Desktop/coal-guard/edge/vision/frame_grabber.py)**:
  - Continuously grabs frames in a background daemon thread to eliminate OpenCV buffer delay.
  - Implements synthetic pithead frame generation with simulated miner silhouette, HUD timestamps, and gate markers when physical cameras are offline.
- **[`edge/vision/ppe_detector.py`](file:///c:/Users/sksam/Desktop/coal-guard/edge/vision/ppe_detector.py)**:
  - Evaluates `hardhat`, `vest`, and `scsr` compliance classes.
  - Computes `optical_compliance = True` strictly if all three items are confirmed with confidence $\ge 0.75$.
  - Includes `annotate_frame` to render green/red bounding boxes and statutory status banners.

### B. Hardware Interfaces
- **[`edge/hardware/rfid_reader.py`](file:///c:/Users/sksam/Desktop/coal-guard/edge/hardware/rfid_reader.py)**:
  - Asynchronous badge scanner reading Mifare/NFC serial streams or internal event queues.
- **[`edge/hardware/turnstile_relay.py`](file:///c:/Users/sksam/Desktop/coal-guard/edge/hardware/turnstile_relay.py)**:
  - Manages solenoid lock and passage LEDs.
  - Automatically re-engages lock after $3.0\text{s}$ pulse timer.
  - Triggers red strobe alarm on access denial or non-compliance.

### C. Backend Client & Edge Orchestration
- **[`edge/services/backend_client.py`](file:///c:/Users/sksam/Desktop/coal-guard/edge/services/backend_client.py)**:
  - `check_worker_eligibility(rfid_tag)`: Resolves VTC/PME validity via `GET /auth/workers/{rfid_tag}/eligibility`.
  - `send_access_event(payload)`: Transmits post-turnstile actuation metadata to `POST /vision-edge/events/access-attempt`.
  - Fail-secure: Denies passage if backend communication fails.
- **[`edge/main.py`](file:///c:/Users/sksam/Desktop/coal-guard/edge/main.py)**:
  - Master interlock loop: Badge tap $\to$ Frame grab $\to$ PPE inference $\to$ Credential check $\to$ Relay actuation $\to$ Backend logging.
  - Provides interactive `--simulated` CLI and direct scenario triggers (`--compliant`, `--missing-hardhat`, `--missing-vest`, `--missing-scsr`).

---

## 3. Verification & Validation Results

### Automated Test Suite (Pytest)
Executed 16 comprehensive unit and integration tests covering configuration, vision capture, inference, hardware controllers, and end-to-end access arbitration:

```text
============================= test session starts =============================
platform win32 -- Python 3.13.14, pytest-9.1.1, pluggy-1.6.0
collected 16 items

edge/tests/test_edge_pipeline.py::TestEdgeConfiguration::test_default_settings PASSED
edge/tests/test_edge_pipeline.py::TestFrameGrabber::test_synthetic_frame_generation PASSED
edge/tests/test_edge_pipeline.py::TestPpeDetector::test_fully_compliant_worker PASSED
edge/tests/test_edge_pipeline.py::TestPpeDetector::test_missing_hardhat_violation PASSED
edge/tests/test_edge_pipeline.py::TestPpeDetector::test_missing_vest_violation PASSED
edge/tests/test_edge_pipeline.py::TestPpeDetector::test_missing_scsr_violation PASSED
edge/tests/test_edge_pipeline.py::TestPpeDetector::test_annotate_frame PASSED
edge/tests/test_edge_pipeline.py::TestTurnstileRelayController::test_unlock_actuation_and_automatic_relock PASSED
edge/tests/test_edge_pipeline.py::TestTurnstileRelayController::test_denied_access_alarm PASSED
edge/tests/test_edge_pipeline.py::TestTurnstileRelayController::test_emergency_lockdown PASSED
edge/tests/test_edge_pipeline.py::TestRfidReader::test_simulated_badge_tap_callback PASSED
edge/tests/test_edge_pipeline.py::TestBackendClientContract::test_check_worker_eligibility_mock PASSED
edge/tests/test_edge_pipeline.py::TestBackendClientContract::test_send_access_event_mock PASSED
edge/tests/test_edge_pipeline.py::TestEndToEndEdgePipeline::test_compliant_access_grants_passage PASSED
edge/tests/test_edge_pipeline.py::TestEndToEndEdgePipeline::test_optical_violation_denies_passage PASSED
edge/tests/test_edge_pipeline.py::TestEndToEndEdgePipeline::test_credential_ineligibility_denies_passage PASSED

============================= 16 passed in 1.63s ==============================
```

### Live CLI Scenarios Executed
1. **Compliant Access Attempt (`--compliant`)**:
   - Optical check: Hardhat=True, Vest=True, SCSR=True $\to$ `optical_compliance: True`
   - Credential check: `credential_eligibility: True`
   - Gate decision: `gate_actuated: True`
   - Hardware: Solenoid relay ENERGIZED (UNLOCKED), Green LED ACTIVE for 3.0 seconds, auto-locked.
   - Backend Ingest: `violation_ticket_created: False`

2. **Optical Violation Attempt (`--missing-hardhat`)**:
   - Optical check: Hardhat=False, Vest=True, SCSR=True $\to$ `optical_compliance: False`
   - Gate decision: `gate_actuated: False`
   - Hardware: Gate remains LOCKED, Red statutory alarm LED FLASHING.
   - Backend Ingest: `violation_ticket_created: True`

3. **Expired Credential Attempt (`RFID-MINER-EXPIRED`)**:
   - Optical check: `optical_compliance: True`
   - Credential check: `credential_eligibility: False` (VTC expired under CMR 2017)
   - Gate decision: `gate_actuated: False`
   - Hardware: Gate remains LOCKED, Red statutory alarm LED FLASHING.
   - Backend Ingest: `violation_ticket_created: True`
