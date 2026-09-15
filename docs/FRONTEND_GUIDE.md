# FRONTEND_GUIDE.md

## 1. UI/UX Philosophy & Design Language

The command center dashboard must look like a professional, enterprise-grade industrial control system. It is designed for colliery managers, safety officers, and DGMS auditors who monitor critical life-safety metrics for hours at a time.

* **Dark Mode Native:** The default theme must be a deep industrial dark mode (Slate or Zinc color palettes) to reduce eye strain in dimly lit control rooms.
* **High Data Density:** Prioritize data visibility over excessive whitespace. Use compact tables, dense metric cards, and collapsible sidebars.
* **Zero Emojis:** Do not use emojis anywhere in the UI or codebase. All iconography must use the `lucide-react` library for a crisp, uniform, and professional vector appearance.
* **Semantic Status Colors:**
  * `emerald-500`: Compliant / Online / Safe
  * `amber-500`: Warning / Pending / Degraded (e.g., gas levels rising, camera packet loss)
  * `rose-500`: Critical Violation / Hardware Offline / SLA Breached
  * `blue-500`: Informational / Statutory actions

---

## 2. Tech Stack Core

* **Framework:** React 19 + TypeScript (Strict Mode enabled)
* **Build Tool:** Vite (for rapid HMR and optimized micro-bundles)
* **Component Library:** Tailwind CSS combined with `shadcn/ui` (accessible Radix UI primitives providing complete design control)
* **State Management:**
  * *Server State:* TanStack Query (`@tanstack/react-query`) for REST polling and caching.
  * *Client State:* Zustand for lightweight, boilerplate-free global state (e.g., sidebar toggles, active camera selection).
* **Real-time Layer:** Native WebSockets API (for live alert banners) and WebRTC (for sub-second video streaming).
* **Visualizations:** MapLibre GL JS (for 2D/2.5D GIS mapping) and Recharts (for telemetry time-series charts).
* **Iconography:** `lucide-react`.

---

## 3. Standardized Project Structure

Maintain a feature-based architecture to keep the codebase modular and scalable:

```text
src/
├── assets/          # Static assets, branding (SVGs)
├── components/      # Shared UI primitives (shadcn/ui buttons, cards, dialogs)
├── features/        # Feature-specific modules (The core of the app)
│   ├── cctv-gate/   # WebRTC player, Canvas HUD overlays
│   ├── compliance/  # SLA boards, Remediation tables
│   ├── gis-map/     # MapLibre GL containers, GeoJSON layers
│   └── telemetry/   # Hardware diagnostic grids, Recharts wrappers
├── hooks/           # Custom React hooks (e.g., useWebSocket, useWebRTC)
├── layouts/         # Page wrappers (Sidebar, Topbar, Main Content Area)
├── pages/           # Route entry points mapping to features
├── store/           # Zustand stores
├── types/           # Global TypeScript interfaces
└── utils/           # Helper functions (date formatting, API clients)
```

---

## 4. Key Interfaces & Iconography Guidelines

When building navigation, headers, and dashboard widgets, use the designated `lucide-react` icons and layout specifications:

### 4.1. Live Pithead Checkpoint (Gate HUD)
* **Icons:** `<ShieldCheck />` or `<Cctv />`
* **Layout:** Responsive 2x2 or 3x3 video grid.
* **Implementation Detail:** Use a native `<video>` tag receiving a WebRTC stream via MediaMTX. Absolutely position an HTML5 `<canvas>` directly over the video element. The backend WebSocket streams bounding box coordinates (e.g., `[{ class: 'hardhat_worn', x: 10, y: 20, w: 50, h: 50 }]`). A custom `requestAnimationFrame` loop in React renders clean, anti-aliased corner brackets and compliance tags on the canvas.

### 4.2. Diagnostic & Hardware Matrix
* **Icons:** `<ServerCrash />` or `<Activity />`
* **Layout:** High-density data grid (`shadcn/ui` DataTables).
* **Implementation Detail:** Lists all Edge PCs, Turnstiles, and Gas Sensors (ETDs). Use live ping indicators (`<Activity className="text-emerald-500 animate-pulse" />`) to show active heartbeats. Automatically sort offline or degraded hardware to the top of the matrix.

### 4.3. Spatial GIS & Digital Twin
* **Icons:** `<Map />` or `<Layers />`
* **Layout:** Full-screen viewport mapping with floating glassmorphism control panels.
* **Implementation Detail:** Mount MapLibre GL instance. Overlay GeoJSON layers for surface lease boundaries, haul roads, and 2D underground centerlines. Render custom map markers for underground RFID checkpoints. Add a floating control panel (`backdrop-blur-md bg-slate-900/80`) to toggle layers (e.g., *"Show Blast Radius"*, *"Show Methane Sensors"*).

### 4.4. Statutory Compliance & Reports
* **Icons:** `<FileText />` or `<Scale />`
* **Layout:** Kanban-style boards for the Remediation State Machine and dense tables for audit logs.
* **Implementation Detail:** Utilize `shadcn/ui` DataTables with pagination, multi-column sorting, and status filtering. Include a dedicated statutory export panel with `<Download />` buttons to generate one-click, DGMS-formatted PDF shift reports.

---

## 5. Coding Standards & Performance Rules

* **Strict Typing:** `any` is strictly prohibited. All API responses, WebSocket messages, and state models must map to strongly typed TypeScript interfaces.
* **Avoid Re-renders in Video Feeds:** The WebRTC video component and its overlapping Canvas must be memoized using `React.memo`. Do not pass rapidly changing generic state into the video component; isolate the WebSocket coordinate state specifically to the Canvas rendering hook.
* **Error Boundaries:** Wrap every major feature block (e.g., the GIS map, the CCTV grid) in a React Error Boundary. If the MapLibre instance crashes, it must display a graceful fallback UI (`<AlertTriangle /> "GIS Module Offline"`) without crashing the remaining control room dashboard.
* **Skeleton Loaders:** Do not use generic spinning circles for initial data loads. Use `shadcn/ui` Skeleton components that mimic the exact shape of the data table or metric card to prevent Cumulative Layout Shift (CLS).
