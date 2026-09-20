"""Coal Guard - Edge Vision Pithead Turnstile Gateway Service

Executes on pithead mini-PCs to enforce DGMS statutory compliance at mine ingress:
1. Continuous RTSP CCTV video frame grabbing
2. Local YOLO optical PPE detection (Hardhat, Vest, SCSR)
3. Statutory credential arbitration (VTC, PME, Shift limits)
4. Hardware turnstile solenoid relay and LED actuation
5. Real-time post-turnstile event ingestion to surface backend
"""

import argparse
import logging
import sys
import time
from typing import Optional
import uuid

try:
    from edge.config import settings
    from edge.hardware.rfid_reader import RfidReader
    from edge.hardware.turnstile_relay import TurnstileRelayController
    from edge.services.backend_client import BackendClient
    from edge.vision.frame_grabber import FrameGrabber
    from edge.vision.ppe_detector import PpeDetectionResult, PpeDetector
except ImportError:
    from config import settings
    from hardware.rfid_reader import RfidReader
    from hardware.turnstile_relay import TurnstileRelayController
    from services.backend_client import BackendClient
    from vision.frame_grabber import FrameGrabber
    from vision.ppe_detector import PpeDetectionResult, PpeDetector

# Configure industrial standard logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("edge.main")


class EdgeTurnstileService:
    """Core Edge Turnstile Orchestrator."""

    def __init__(
        self,
        backend_url: Optional[str] = None,
        location_id: Optional[str] = None,
        stream_url: Optional[str] = None,
        simulation_mode: bool = False,
        ppe_scenario: str = "COMPLIANT",
    ) -> None:
        self.backend_url = backend_url or settings.backend_api_url
        self.location_id = location_id or settings.location_id
        self.stream_url = stream_url or settings.rtsp_stream_url
        self.simulation_mode = simulation_mode or settings.simulation_mode
        self.ppe_scenario = ppe_scenario

        # Initialize core components
        logger.info(
            "[EdgeTurnstileService] Initializing Edge Gateway (Location: %s, Simulation: %s)",
            self.location_id,
            self.simulation_mode,
        )

        self.frame_grabber = FrameGrabber(
            stream_url=self.stream_url,
            simulation_mode=self.simulation_mode,
        )
        self.ppe_detector = PpeDetector(
            model_path=settings.yolo_model_path,
            confidence_threshold=settings.confidence_threshold,
            simulation_mode=self.simulation_mode,
        )
        self.ppe_detector.set_simulated_scenario(self.ppe_scenario)

        self.turnstile_relay = TurnstileRelayController(
            pulse_duration=settings.relay_pulse_duration,
            simulation_mode=self.simulation_mode,
        )
        self.rfid_reader = RfidReader(
            port=settings.serial_port,
            baud_rate=settings.baud_rate,
            simulation_mode=self.simulation_mode,
        )
        self.backend_client = BackendClient(
            base_url=self.backend_url,
            simulation_mode=self.simulation_mode,
        )

        # Wire RFID callback to access attempt pipeline
        self.rfid_reader.register_callback(self.handle_badge_scan)

    def start(self) -> None:
        """Start all hardware readers and background vision threads."""
        logger.info("[EdgeTurnstileService] Starting FrameGrabber...")
        self.frame_grabber.start()

        logger.info("[EdgeTurnstileService] Starting RFID Reader...")
        self.rfid_reader.start()

        logger.info("[EdgeTurnstileService] Turnstile Gateway fully operational and armed.")

    def handle_badge_scan(self, rfid_tag: str) -> dict:
        """Core interlock verification pipeline executed when a worker taps RFID badge.

        Steps:
        1. Capture latest frame from camera buffer
        2. Perform optical PPE inference (Hardhat, Vest, SCSR)
        3. Query backend for worker statutory credentials (VTC, PME)
        4. Make gate access decision: optical_compliance AND credential_eligibility
        5. Actuate hardware relay & LEDs
        6. Transmit access event to backend
        """
        logger.info("-" * 65)
        logger.info("[ACCESS PIPELINE] Worker badge tap detected: %s", rfid_tag)

        # 1. Grab latest video frame
        success, frame = self.frame_grabber.get_latest_frame()
        if not success or frame is None:
            logger.warning("[ACCESS PIPELINE] Failed to capture camera frame. Using synthetic fallback.")
            frame = self.frame_grabber._generate_synthetic_frame()

        # 2. Run Optical PPE Detector
        detection_result: PpeDetectionResult = self.ppe_detector.analyze(frame)
        optical_ok = detection_result.optical_compliance
        wear_states = detection_result.wear_states

        logger.info(
            "[OPTICAL CHECK] Compliance: %s | Wear States: Hardhat=%s, Vest=%s, SCSR=%s",
            optical_ok,
            wear_states.get("hardhat_worn"),
            wear_states.get("vest_worn"),
            wear_states.get("scsr_worn"),
        )
        if not optical_ok:
            logger.warning("[OPTICAL CHECK] %s", detection_result.evaluation_summary)

        # 3. Query Backend for Worker Credential Eligibility
        cred_response = self.backend_client.check_worker_eligibility(rfid_tag)
        credential_ok = bool(cred_response.get("eligible", False))
        worker_name = cred_response.get("worker_name", "Unknown")
        cred_reason = cred_response.get("reason", "N/A")

        logger.info(
            "[CREDENTIAL CHECK] Worker: %s | Eligible: %s | Reason: %s",
            worker_name,
            credential_ok,
            cred_reason,
        )

        # 4. Determine Gate Actuation
        gate_actuated = optical_ok and credential_ok
        decision_str = "GRANTED (INTERLOCK DISENGAGED)" if gate_actuated else "DENIED (INTERLOCK HELD)"
        logger.info("[INTERLOCK DECISION] Access %s for %s (%s)", decision_str, worker_name, rfid_tag)

        # 5. Actuate Turnstile Relay
        self.turnstile_relay.actuate_gate(gate_actuated)

        # 6. Push Event to Backend Ingress API
        payload = {
            "rfid_tag": rfid_tag,
            "location_id": str(self.location_id),
            "optical_compliance": optical_ok,
            "credential_eligibility": credential_ok,
            "gate_actuated": gate_actuated,
            "wear_states": wear_states,
            "snapshot_crop_url": None,
        }
        event_response = self.backend_client.send_access_event(payload)
        logger.info("-" * 65)

        return {
            "rfid_tag": rfid_tag,
            "worker_name": worker_name,
            "optical_compliance": optical_ok,
            "credential_eligibility": credential_ok,
            "gate_actuated": gate_actuated,
            "wear_states": wear_states,
            "backend_event_status": event_response.get("status", "logged"),
            "access_log_id": event_response.get("access_log_id"),
            "violation_ticket_created": event_response.get("violation_ticket_created", False),
        }

    def stop(self) -> None:
        """Safely shut down all peripherals and network clients."""
        logger.info("[EdgeTurnstileService] Shutting down Edge Turnstile Gateway...")
        self.rfid_reader.stop()
        self.frame_grabber.stop()
        self.turnstile_relay.close()
        self.backend_client.close()
        logger.info("[EdgeTurnstileService] Gateway stopped cleanly.")


def main() -> None:
    """CLI Entry Point."""
    parser = argparse.ArgumentParser(
        description="Coal Guard Edge Vision Pithead Turnstile Gateway Service",
    )
    parser.add_argument(
        "--simulated",
        action="store_true",
        help="Run in simulation mode without physical camera or hardware relays",
    )
    parser.add_argument(
        "--rfid",
        type=str,
        default=None,
        help="Simulate an immediate RFID badge scan with the specified tag",
    )
    parser.add_argument(
        "--compliant",
        action="store_true",
        help="Simulate fully compliant worker (Hardhat, Vest, SCSR)",
    )
    parser.add_argument(
        "--missing-hardhat",
        action="store_true",
        help="Simulate worker missing hardhat",
    )
    parser.add_argument(
        "--missing-vest",
        action="store_true",
        help="Simulate worker missing reflective vest",
    )
    parser.add_argument(
        "--missing-scsr",
        action="store_true",
        help="Simulate worker missing SCSR breathing pack",
    )
    parser.add_argument(
        "--interactive",
        action="store_true",
        help="Start interactive CLI loop to simulate worker scans interactively",
    )
    parser.add_argument(
        "--backend-url",
        type=str,
        default=None,
        help=f"Backend API URL (default: {settings.backend_api_url})",
    )
    parser.add_argument(
        "--location-id",
        type=str,
        default=None,
        help=f"Pithead Gate Location UUID (default: {settings.location_id})",
    )
    parser.add_argument(
        "--stream",
        type=str,
        default=None,
        help="RTSP camera stream URL or video device index",
    )

    args = parser.parse_args()

    # Determine PPE scenario preset
    scenario = "COMPLIANT"
    if args.missing_hardhat:
        scenario = "MISSING_HARDHAT"
    elif args.missing_vest:
        scenario = "MISSING_VEST"
    elif args.missing_scsr:
        scenario = "MISSING_SCSR"

    service = EdgeTurnstileService(
        backend_url=args.backend_url,
        location_id=args.location_id,
        stream_url=args.stream,
        simulation_mode=args.simulated or args.rfid is not None or args.interactive,
        ppe_scenario=scenario,
    )

    service.start()

    # Brief delay for threads to initialize
    time.sleep(0.5)

    try:
        # Case 1: Direct single badge trigger
        if args.rfid:
            logger.info("[CLI] Executing single badge tap for: %s", args.rfid)
            result = service.handle_badge_scan(args.rfid)
            print("\n" + "=" * 50)
            print("ACCESS ATTEMPT RESULT:")
            for k, v in result.items():
                print(f"  {k}: {v}")
            print("=" * 50 + "\n")
            return

        # Case 2: Interactive simulation prompt
        if args.interactive:
            print("\n" + "=" * 65)
            print("COAL GUARD EDGE VISION SIMULATOR")
            print("Commands:")
            print("  tap <rfid_tag>       : Simulate worker badge tap")
            print("  scenario <COMPLIANT|MISSING_HARDHAT|MISSING_VEST|MISSING_SCSR>")
            print("  status               : Show relay and camera status")
            print("  quit / exit          : Terminate edge service")
            print("=" * 65 + "\n")

            while True:
                try:
                    cmd_line = input("edge-sim> ").strip()
                except (EOFError, KeyboardInterrupt):
                    break

                if not cmd_line:
                    continue

                parts = cmd_line.split()
                cmd = parts[0].lower()

                if cmd in ("quit", "exit"):
                    break
                elif cmd == "tap" and len(parts) > 1:
                    tag = parts[1]
                    res = service.handle_badge_scan(tag)
                    print(f"Outcome: Gate Actuated = {res['gate_actuated']} (Optical: {res['optical_compliance']}, Credential: {res['credential_eligibility']})")
                elif cmd == "scenario" and len(parts) > 1:
                    sc = parts[1].upper()
                    service.ppe_detector.set_simulated_scenario(sc)
                    print(f"PPE Detector scenario updated to: {sc}")
                elif cmd == "status":
                    print(f"Relay State: {'UNLOCKED' if service.turnstile_relay.is_unlocked else 'LOCKED'} | LED: {service.turnstile_relay.led_state}")
                else:
                    print("Unknown command. Type 'tap <tag>' or 'scenario <NAME>' or 'quit'.")
            return

        # Case 3: Continuous daemon loop
        logger.info("[CLI] Edge Turnstile Gateway running in background. Press Ctrl+C to terminate.")
        while True:
            time.sleep(1.0)

    except KeyboardInterrupt:
        logger.info("[CLI] Interrupted by user.")
    finally:
        service.stop()


if __name__ == "__main__":
    main()
