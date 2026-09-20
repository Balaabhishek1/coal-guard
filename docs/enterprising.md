Phase 1: Full-Stack Containerization (Docker Orchestration)
Goal: Unify the disparate tech stack into a single, reliable environment so that any developer (or server) can boot the entire platform with docker-compose up -d.

1.1. Backend & Worker Dockerfiles: Create optimized, multi-stage Dockerfiles for the FastAPI backend and the Celery workers, ensuring system dependencies for PaddleOCR and PostGIS drivers are correctly compiled.

1.2. Frontend Dockerfile: Create a multi-stage Dockerfile for the React frontend that builds the static Vite assets and serves them via a lightweight Nginx container.

1.3. Unified Docker Compose: Write a root docker-compose.yml that networks 6 containers:

PostgreSQL (with PostGIS/TimescaleDB extensions)

Redis 7 (Broker/Cache)

FastAPI Backend

Celery Worker (OCR & SLA tasks)

Celery Beat (Periodic scheduler)

React/Nginx Frontend.

Phase 2: CI/CD Automation (GitHub Actions)
Goal: Protect the coal-guard-main repository by enforcing automated testing and code quality checks on every push.

2.1. Backend Pipeline: Create a GitHub Action workflow to spin up a headless Postgres service, install Python dependencies, run the pytest suite, and execute flake8/black linting.

2.2. Frontend Pipeline: Create a parallel workflow for the React app to run npm run lint, execute vitest unit tests, and verify that the TypeScript build (npm run build) completes without strict-mode errors.

2.3. Container Registry Push: (Optional but recommended) Automate building and pushing the Docker images to Docker Hub or AWS ECR upon merging code into the main branch.

Phase 3: Flutter Mobile App – Core Setup & Offline Database (Module 4)
Goal: Begin developing the Field Inspector app, establishing the offline-first architecture required for deep underground use where Wi-Fi and cell service are unavailable.

3.1. Flutter Environment & Architecture: Initialize the Flutter project with a scalable state management solution (Riverpod or BLoC) and secure local storage for JWT tokens.

3.2. Local SQLite Engine: Implement the sqflite database schema on the mobile device to mirror the backend's governance and field operation tables.

3.3. Offline Auth & RBAC: Allow Overmen and Sirdars to log in while online, caching their credentials and RBAC permissions locally so they can open the app and bypass the login screen when underground.

Phase 4: Flutter Mobile App – Audits & Sync Engine (Module 4)
Goal: Build the functional field tools for mobile users and the crucial background synchronization logic.

4.1. Digital CMR 2017 Form IV: Build the UI forms for logging roof-bolt torque, air velocity, and gas levels.

4.2. Camera & NFC Integration: Implement the device camera for capturing WebP compressed evidence photos and the NFC reader module to scan physical underground BLE/NFC tags for geolocation.

4.3. Background Sync Engine: Build the queueing system. When the device regains Wi-Fi at the surface, automatically trigger the idempotent upload payload to the backend's POST /api/v1/sync/batch and chunked media endpoints.

Phase 5: Edge Vision Turnstile Simulation (Module 3)
Goal: Since the backend logic for the Pithead Gate is ready, you need the actual edge application that runs on the physical mini-PCs at the mine shaft.

5.1. Edge Python App: Write a localized Python/OpenCV script that captures video feeds from a connected RTSP IP camera.

5.2. Local Inference: Integrate a lightweight YOLO model to detect hardhat, vest, and scsr locally without sending video frames to the cloud.

5.3. Actuation & Backend Communication: Write the logic that evaluates the optical wear-states, actuates a physical relay (e.g., a GPIO pin connected to a turnstile), and fires the POST /api/v1/vision-edge/events/access-attempt payload to your FastAPI server.

Phase 6: Cloud Deployment & Production Release
Goal: Move the platform from local Docker containers to a secure, highly available cloud environment.

6.1. Managed Infrastructure Provisioning: Set up a managed database (e.g., AWS RDS for PostgreSQL), ElastiCache for Redis, and S3 buckets for storing OCR documents and WebP evidence photos.

6.2. App Deployment: Deploy the FastAPI backend and React frontend to a cloud compute service (like AWS ECS, DigitalOcean App Platform, or a managed Kubernetes cluster).

6.3. Networking & Security: Configure a reverse proxy (Traefik or Nginx), issue SSL/TLS certificates via Let's Encrypt for secure HTTPS/WSS communication, and finalize the production domain routing.
