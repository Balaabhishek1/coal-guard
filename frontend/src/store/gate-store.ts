import { create } from "zustand";
import type {
  EdgeAccessEventPayload,
  GateCameraFeed,
  LiveAlert,
} from "@/types/vision-edge";

export const DEFAULT_CAMERA_FEEDS: GateCameraFeed[] = [
  {
    id: "cam-gate-01",
    name: "CAM-PITHEAD-01-OPTICAL",
    location: "Incline Shaft Main Collar",
    status: "ONLINE",
    fps: 30,
    resolution: "1920x1080",
    latencyMs: 18.4,
  },
  {
    id: "cam-gate-02",
    name: "CAM-SEAM01-DESCENT-02",
    location: "Seam-I Man-Riding Incline Entry",
    status: "ONLINE",
    fps: 25,
    resolution: "1920x1080",
    latencyMs: 22.1,
  },
  {
    id: "cam-gate-03",
    name: "CAM-RETURN-AIRWAY-03",
    location: "North Return Gallery Air Lock",
    status: "ONLINE",
    fps: 30,
    resolution: "1280x720",
    latencyMs: 34.8,
  },
  {
    id: "cam-gate-04",
    name: "CAM-LAMP-ROOM-MUSTER-04",
    location: "Lamp Room / Cap Lamp Dispatch",
    status: "DEGRADED",
    fps: 15,
    resolution: "1280x720",
    latencyMs: 82.0,
  },
];

interface GateState {
  activeFeeds: GateCameraFeed[];
  selectedFeedId: string;
  wsConnected: boolean;
  latestAccessEvent: EdgeAccessEventPayload | null;
  recentEvents: EdgeAccessEventPayload[];
  activeAlerts: LiveAlert[];

  // Actions
  setWsConnected: (connected: boolean) => void;
  selectFeed: (feedId: string) => void;
  addAccessEvent: (event: EdgeAccessEventPayload) => void;
  addAlert: (alert: LiveAlert) => void;
  dismissAlert: (alertId: string) => void;
  clearAlerts: () => void;
  simulateAccessAttempt: (
    compliant: boolean,
    missingItem?: "scsr" | "hardhat" | "vest"
  ) => EdgeAccessEventPayload;
}

export const useGateStore = create<GateState>((set, get) => ({
  activeFeeds: DEFAULT_CAMERA_FEEDS,
  selectedFeedId: "cam-gate-01",
  wsConnected: false,
  latestAccessEvent: null,
  recentEvents: [],
  activeAlerts: [],

  setWsConnected: (connected) => set({ wsConnected: connected }),

  selectFeed: (feedId) => set({ selectedFeedId: feedId }),

  addAccessEvent: (event) => {
    set((state) => {
      const updatedEvents = [event, ...state.recentEvents.slice(0, 19)];
      const updates: Partial<GateState> = {
        latestAccessEvent: event,
        recentEvents: updatedEvents,
      };

      // If non-compliant or gate locked, automatically register a live high-priority alert
      if (!event.optical_compliance || !event.gate_actuated) {
        const missingItems: string[] = [];
        if (!event.wear_states.hardhat_worn) missingItems.push("Hardhat");
        if (!event.wear_states.vest_worn) missingItems.push("High-Vis Vest");
        if (!event.wear_states.scsr_worn) missingItems.push("SCSR Respirator");

        const violationAlert: LiveAlert = {
          id: `alert-gate-${Date.now()}`,
          event_type: "GATE_ACCESS_ATTEMPT",
          severity: "CRITICAL",
          title: "UNAUTHORIZED PITHEAD INGRESS BLOCKED",
          message: `Worker ${event.worker_name || event.rfid_tag} denied turnstile entry. Non-compliant PPE: ${
            missingItems.length > 0 ? missingItems.join(", ") : "Credentials Expired"
          }.`,
          statutory_rule: "CMR 2017 Reg. 191(A) Personal Protective Equipment",
          timestamp: new Date().toISOString(),
          acknowledged: false,
        };

        updates.activeAlerts = [violationAlert, ...state.activeAlerts.slice(0, 4)];
      }

      return updates;
    });
  },

  addAlert: (alert) =>
    set((state) => ({
      activeAlerts: [alert, ...state.activeAlerts.slice(0, 4)],
    })),

  dismissAlert: (alertId) =>
    set((state) => ({
      activeAlerts: state.activeAlerts.filter((a) => a.id !== alertId),
    })),

  clearAlerts: () => set({ activeAlerts: [] }),

  simulateAccessAttempt: (compliant, missingItem) => {
    const isCompliant = compliant;
    const workerNames = [
      "Ramesh Kumar (Driller)",
      "Sanjay Murmu (Shotfirer)",
      "Birendra Hansda (Loader)",
      "Alok Chatterjee (Overman)",
      "Deepak Mahato (Mining Sirdar)",
    ];
    const chosenName =
      workerNames[Math.floor(Math.random() * workerNames.length)];
    const chosenRfid = `RFID-MINER-00${Math.floor(10 + Math.random() * 89)}`;

    const wearStates = {
      hardhat_worn: isCompliant || missingItem !== "hardhat",
      vest_worn: isCompliant || missingItem !== "vest",
      scsr_worn: isCompliant || missingItem !== "scsr",
    };

    // Realistic bounding boxes normalized 0..1 coordinates
    const boundingBoxes = [
      {
        class_name: wearStates.hardhat_worn ? "hardhat_worn" : "head_bare",
        confidence: 0.94,
        x: 0.38,
        y: 0.14,
        w: 0.24,
        h: 0.16,
      },
      {
        class_name: wearStates.vest_worn ? "vest_worn" : "vest_missing",
        confidence: 0.91,
        x: 0.34,
        y: 0.30,
        w: 0.32,
        h: 0.34,
      },
      {
        class_name: wearStates.scsr_worn ? "scsr_worn" : "scsr_missing",
        confidence: 0.88,
        x: 0.44,
        y: 0.52,
        w: 0.14,
        h: 0.18,
      },
    ];

    const simulatedEvent: EdgeAccessEventPayload = {
      rfid_tag: chosenRfid,
      location_id: "loc-pithead-gate-01",
      worker_name: chosenName,
      worker_designation: chosenName.split("(")[1]?.replace(")", "") || "General Workforce",
      optical_compliance: isCompliant,
      credential_eligibility: true,
      gate_actuated: isCompliant,
      wear_states: wearStates,
      bounding_boxes: boundingBoxes,
      timestamp: new Date().toISOString(),
      access_log_id: `log-${Date.now()}`,
      violation_ticket_created: !isCompliant,
    };

    get().addAccessEvent(simulatedEvent);
    return simulatedEvent;
  },
}));
