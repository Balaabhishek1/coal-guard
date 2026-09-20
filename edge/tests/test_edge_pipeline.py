"""Comprehensive Automated Test Suite for Coal Guard Edge Vision Pipeline

Tests:
1. PpeDetector statutory compliance rules (Hardhat, Vest, SCSR under CMR 2017)
2. FrameGrabber non-blocking frame retrieval and synthetic generator
3. TurnstileRelayController solenoid timing and LED indicators
4. RfidReader badge event queueing and callback dispatch
5. BackendClient REST communication contract
6. End-to-end EdgeTurnstileService interlock decision arbitration
"""

import time
from unittest.mock import MagicMock, patch
import numpy as np
import pytest

from edge.config import EdgeSettings
from edge.hardware.rfid_reader import RfidReader
from edge.hardware.turnstile_relay import TurnstileRelayController
from edge.main import EdgeTurnstileService
from edge.services.backend_client import BackendClient
from edge.vision.frame_grabber import FrameGrabber
from edge.vision.ppe_detector import PpeDetector


class TestEdgeConfiguration:
    """Validate edge configuration defaults and validation."""

    def test_default_settings(self):
        settings = EdgeSettings()
        assert settings.backend_api_url == "http://localhost:8000/api/v1"
        assert settings.confidence_threshold == 0.75
        assert settings.relay_pulse_duration == 3.0
        assert settings.location_id == "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"


class TestFrameGrabber:
    """Validate asynchronous frame acquisition."""

    def test_synthetic_frame_generation(self):
        grabber = FrameGrabber(simulation_mode=True, width=640, height=480)
        grabber.start()

        # Allow grabber loop to produce frame
        time.sleep(0.1)
        success, frame = grabber.get_latest_frame()

        assert success is True
        assert frame is not None
        assert isinstance(frame, np.ndarray)
        assert frame.shape == (480, 640, 3)

        grabber.stop()


class TestPpeDetector:
    """Validate optical PPE compliance logic against DGMS CMR 2017 standards."""

    @pytest.fixture
    def detector(self):
        return PpeDetector(simulation_mode=True, confidence_threshold=0.75)

    @pytest.fixture
    def test_frame(self):
        return np.zeros((480, 640, 3), dtype=np.uint8)

    def test_fully_compliant_worker(self, detector, test_frame):
        detector.set_simulated_scenario("COMPLIANT")
        result = detector.analyze(test_frame)

        assert result.optical_compliance is True
        assert result.wear_states["hardhat_worn"] is True
        assert result.wear_states["vest_worn"] is True
        assert result.wear_states["scsr_worn"] is True
        assert "All statutory PPE items verified" in result.evaluation_summary

    def test_missing_hardhat_violation(self, detector, test_frame):
        detector.set_simulated_scenario("MISSING_HARDHAT")
        result = detector.analyze(test_frame)

        assert result.optical_compliance is False
        assert result.wear_states["hardhat_worn"] is False
        assert result.wear_states["vest_worn"] is True
        assert result.wear_states["scsr_worn"] is True
        assert "HARDHAT" in result.evaluation_summary

    def test_missing_vest_violation(self, detector, test_frame):
        detector.set_simulated_scenario("MISSING_VEST")
        result = detector.analyze(test_frame)

        assert result.optical_compliance is False
        assert result.wear_states["hardhat_worn"] is True
        assert result.wear_states["vest_worn"] is False
        assert result.wear_states["scsr_worn"] is True
        assert "VEST" in result.evaluation_summary

    def test_missing_scsr_violation(self, detector, test_frame):
        detector.set_simulated_scenario("MISSING_SCSR")
        result = detector.analyze(test_frame)

        assert result.optical_compliance is False
        assert result.wear_states["hardhat_worn"] is True
        assert result.wear_states["vest_worn"] is True
        assert result.wear_states["scsr_worn"] is False
        assert "SCSR" in result.evaluation_summary

    def test_annotate_frame(self, detector, test_frame):
        detector.set_simulated_scenario("COMPLIANT")
        result = detector.analyze(test_frame)
        annotated = detector.annotate_frame(test_frame, result)

        assert annotated.shape == test_frame.shape
        assert isinstance(annotated, np.ndarray)


class TestTurnstileRelayController:
    """Validate hardware relay timing, solenoid status, and LED indicators."""

    def test_unlock_actuation_and_automatic_relock(self):
        controller = TurnstileRelayController(pulse_duration=0.2, simulation_mode=True)

        assert controller.is_unlocked is False
        assert controller.led_state == "OFF"

        # Trigger unlock
        actuated = controller.actuate_gate(unlock=True)
        assert actuated is True
        assert controller.is_unlocked is True
        assert controller.led_state == "GREEN"

        # Wait for auto-lock timer
        time.sleep(0.3)
        assert controller.is_unlocked is False
        assert controller.led_state == "OFF"

        controller.close()

    def test_denied_access_alarm(self):
        controller = TurnstileRelayController(pulse_duration=0.2, simulation_mode=True)

        # Trigger denial
        actuated = controller.actuate_gate(unlock=False)
        assert actuated is False
        assert controller.is_unlocked is False
        assert controller.led_state == "RED_ALARM"

        # Wait for alarm timeout
        time.sleep(0.3)
        assert controller.led_state == "OFF"

        controller.close()

    def test_emergency_lockdown(self):
        controller = TurnstileRelayController(simulation_mode=True)
        controller.actuate_gate(unlock=True, duration=5.0)
        assert controller.is_unlocked is True

        controller.emergency_lockdown()
        assert controller.is_unlocked is False
        assert controller.led_state == "RED_ALARM"

        controller.close()


class TestRfidReader:
    """Validate RFID badge event processing and callback dispatch."""

    def test_simulated_badge_tap_callback(self):
        reader = RfidReader(simulation_mode=True)
        received_tags = []

        reader.register_callback(lambda tag: received_tags.append(tag))
        reader.start()

        reader.simulate_tag_scan("RFID-MINER-0091")
        time.sleep(0.2)

        assert len(received_tags) == 1
        assert received_tags[0] == "RFID-MINER-0091"

        reader.stop()


class TestBackendClientContract:
    """Validate REST payload structures and network error handling."""

    def test_check_worker_eligibility_mock(self):
        client = BackendClient(base_url="http://localhost:8000/api/v1")

        with patch.object(client, "_get_sync_client") as mock_get_client:
            mock_client = MagicMock()
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "eligible": True,
                "worker_name": "Ramesh Kumar",
                "reason": "All statutory credentials valid",
                "vtc_valid": True,
                "pme_valid": True,
                "rfid_tag": "RFID-MINER-0091",
            }
            mock_client.get.return_value = mock_response
            mock_get_client.return_value = mock_client

            result = client.check_worker_eligibility("RFID-MINER-0091")
            assert result["eligible"] is True
            assert result["worker_name"] == "Ramesh Kumar"

    def test_send_access_event_mock(self):
        client = BackendClient(base_url="http://localhost:8000/api/v1")

        with patch.object(client, "_get_sync_client") as mock_get_client:
            mock_client = MagicMock()
            mock_response = MagicMock()
            mock_response.status_code = 201
            mock_response.json.return_value = {
                "status": "logged",
                "access_log_id": "c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a33",
                "violation_ticket_created": False,
                "violation_id": None,
                "timestamp": "2026-09-20T10:00:00Z",
            }
            mock_client.post.return_value = mock_response
            mock_get_client.return_value = mock_client

            payload = {
                "rfid_tag": "RFID-MINER-0091",
                "location_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
                "optical_compliance": True,
                "credential_eligibility": True,
                "gate_actuated": True,
                "wear_states": {"hardhat_worn": True, "vest_worn": True, "scsr_worn": True},
                "snapshot_crop_url": None,
            }
            res = client.send_access_event(payload)
            assert res["status"] == "logged"
            assert res["violation_ticket_created"] is False


class TestEndToEndEdgePipeline:
    """Validate full pipeline arbitration: Camera -> YOLO -> Eligibility -> Turnstile Actuation -> Backend Ingest."""

    def test_compliant_access_grants_passage(self):
        service = EdgeTurnstileService(simulation_mode=True, ppe_scenario="COMPLIANT")
        service.start()

        # Mock backend responses
        service.backend_client.check_worker_eligibility = MagicMock(return_value={
            "eligible": True,
            "worker_name": "Suresh Patel",
            "reason": "All statutory credentials valid",
        })
        service.backend_client.send_access_event = MagicMock(return_value={
            "status": "logged",
            "access_log_id": "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
            "violation_ticket_created": False,
        })

        result = service.handle_badge_scan("RFID-MINER-0044")

        assert result["optical_compliance"] is True
        assert result["credential_eligibility"] is True
        assert result["gate_actuated"] is True
        assert service.turnstile_relay.is_unlocked is True
        assert service.turnstile_relay.led_state == "GREEN"

        service.stop()

    def test_optical_violation_denies_passage(self):
        service = EdgeTurnstileService(simulation_mode=True, ppe_scenario="MISSING_HARDHAT")
        service.start()

        service.backend_client.check_worker_eligibility = MagicMock(return_value={
            "eligible": True,
            "worker_name": "Deepak Verma",
            "reason": "All statutory credentials valid",
        })
        service.backend_client.send_access_event = MagicMock(return_value={
            "status": "logged",
            "access_log_id": "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a23",
            "violation_ticket_created": True,
        })

        result = service.handle_badge_scan("RFID-MINER-0055")

        assert result["optical_compliance"] is False
        assert result["credential_eligibility"] is True
        assert result["gate_actuated"] is False
        assert service.turnstile_relay.is_unlocked is False
        assert service.turnstile_relay.led_state == "RED_ALARM"

        service.stop()

    def test_credential_ineligibility_denies_passage(self):
        service = EdgeTurnstileService(simulation_mode=True, ppe_scenario="COMPLIANT")
        service.start()

        service.backend_client.check_worker_eligibility = MagicMock(return_value={
            "eligible": False,
            "worker_name": "Amit Sharma",
            "reason": "VTC Certificate Expired under CMR 2017",
        })
        service.backend_client.send_access_event = MagicMock(return_value={
            "status": "logged",
            "access_log_id": "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a24",
            "violation_ticket_created": True,
        })

        result = service.handle_badge_scan("RFID-MINER-0066")

        assert result["optical_compliance"] is True
        assert result["credential_eligibility"] is False
        assert result["gate_actuated"] is False
        assert service.turnstile_relay.is_unlocked is False
        assert service.turnstile_relay.led_state == "RED_ALARM"

        service.stop()
