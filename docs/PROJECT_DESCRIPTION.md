# PROJECT_DESCRIPTION.md

## 1. Project Title & Overview
**Project Name:** Smart Governance, Safety & Compliance Monitoring System for Coal Mines
**Target Sector:** Indian Coal Mining Sector (Opencast and Underground Operations)
**Primary Objective:** To develop an integrated, centralized AI-enabled governance and compliance monitoring platform that replaces fragmented, paper-based, and manual regulatory tracking systems with real-time, edge-verified digital workflows.

## 2. Background & Problem Statement
The Indian coal mining sector operates across massive scales, involving multiple subsidiaries, mine sites, contractors, and regulatory bodies (e.g., DGMS, CPCB, MoEFCC). Currently, governance activities such as statutory compliance monitoring, safety inspections, worker attendance, contractor management, and environmental monitoring are managed through fragmented systems, spreadsheets, and delayed manual reporting.

**Key Challenges:**
*   **Data Inconsistency & Delays:** Paper-based Form IV shift diaries and manual registers lead to delayed administrative decision-making and compliance gaps.
*   **Underground Constraints:** Sub-surface workings face severe environmental challenges including zero satellite GPS visibility, optical darkness, and hazardous atmospheres (methane/carbon monoxide), making standard digital tools useless.
*   **Access Control Lapses:** Shift handovers are chaotic. Unverified, unauthorized, or improperly equipped personnel entering underground shafts pose extreme life-safety risks.
*   **Hardware Fragmentation:** Existing hardware (CCTV, gas sensors, turnstiles) operates in silos without a unified intelligence overlay.

## 3. The Proposed Solution
The solution is a comprehensive, enterprise-grade e-governance platform. It does **not** rely on manufacturing custom hardware; instead, it acts as an intelligent orchestration layer that integrates with existing colliery infrastructure. 

The platform guarantees transparency, operational accountability, and data-driven decision-making through six interconnected digital ecosystems encompassing cloud administration, edge AI, mobile field auditing, and physical hardware telemetry.

## 4. Core System Paradigms & Constraints

### 4.1. Domain-Specific Operations (Surface vs. Underground)
The system strictly differentiates between surface and underground operational logic:
*   **Surface (Opencast):** Utilizes standard satellite GPS for location tagging, focuses on heavy machinery (HEMM) tracking, and ambient environmental monitoring (PM10, PM2.5).
*   **Underground (Sub-Surface):** Completely drops GPS dependency. Utilizes topological localization via RFID/BLE checkpoints (e.g., `Seam-II -> 14-Dip -> Pillar 42`). Enforces strict Coal Mines Regulations (CMR 2017) regarding strata control, cap-lamp mustering, and gassy seam thresholds (CH4, CO, Air Velocity).

### 4.2. Pithead Smart Gateway (Vision Edge Verification)
To enforce safety compliance before miners enter the underground shaft, the system utilizes a high-throughput, edge-deployed computer vision checkpoint at the shaft collar.
*   **No Pose Estimation:** To ensure sub-500ms processing during rapid shift changes, the system discards skeletal pose estimation. 
*   **Direct Wear-State Classification:** The vision model detects explicit compliance states (`hardhat_worn`, `head_bare`, `vest_worn`, `scsr_worn`).
*   **Physical Scaffolding:** Verification accuracy is guaranteed through environmental controls: bright yellow footstep decals on the floor (fixing focal distance), 5000K overhead floodlighting (eliminating shadows), and a single-file choke corridor.
*   **Hardware Interlock:** The access turnstile only unlocks if the vision model confirms 100% PPE compliance AND the local credential cache validates the miner's RFID badge (checking shift eligibility, medical fitness, and vocational training validity).

### 4.3. Third-Party Hardware & Telemetry Integration
The platform will not build physical sensors. It establishes a "Diagnostic Gateway" to poll and ingest data from existing infrastructure:
*   **Turnstiles & Cap-Lamp Readers:** Integrated via Modbus TCP, GPIO relays, or Wiegand-to-Ethernet converters.
*   **Gas Sensors (ETDs):** Ingested via OPC-UA or MQTT to monitor environmental safety thresholds.
*   **CCTV Feeds:** Processed via local RTSP streams, routed through MediaMTX for low-latency WebRTC dashboard viewing.

### 4.4. Offline-First & Tamper-Evident Engineering
*   **Zero-Connectivity Resilience:** Field inspector mobile applications must function flawlessly underground. All audits are stored locally (SQLite) and synchronized using highly compressed binary payloads (Protocol Buffers) when returning to surface Wi-Fi.
*   **Blockchain-Inspired Audit Trails:** To prevent the backdating or modification of statutory records, all administrative approvals, safety notices, and compliance checks are secured using a linear SHA-256 cryptographic hash chain in the central database.

## 5. Expected Outcomes
*   Establish a scalable, indigenous e-governance framework for Indian coal mines.
*   Achieve paperless, tamper-proof statutory record-keeping.
*   Prevent non-compliant personnel from accessing hazardous underground zones.
*   Provide unified, real-time command center visibility across all subsidiaries and mine sites.
*   Improve governance efficiency and transparency in coal mining operations.
*   Reduce delays and errors in compliance management and reporting.
*   Enable data-driven monitoring and faster administrative decision-making.
*   Strengthen accountability and real-time tracking of field activities.
*   Support digital transformation and paperless governance in the mining sector.
*   Create a scalable indigenous e-governance framework for Indian coal mines.