"""Turnstile Solenoid Relay & Industrial LED Indicator Controller

Controls pithead physical interlock barriers:
- Solenoid gate lock relay (normally locked / fail-secure)
- Green passage LED indicator
- Red statutory non-compliance alarm strobe
"""

from datetime import datetime, timezone
import logging
import threading
import time
from typing import Any, Dict, List, Optional

logger = logging.getLogger("edge.hardware.turnstile_relay")


class TurnstileRelayController:
    """Hardware Relay and Optical Indicator Controller."""

    def __init__(
        self,
        relay_pin: Optional[int] = None,
        green_led_pin: Optional[int] = None,
        red_led_pin: Optional[int] = None,
        pulse_duration: float = 3.0,
        simulation_mode: bool = False,
    ) -> None:
        self.relay_pin = relay_pin
        self.green_led_pin = green_led_pin
        self.red_led_pin = red_led_pin
        self.pulse_duration = pulse_duration
        self.simulation_mode = simulation_mode

        self._is_unlocked = False
        self._led_state = "OFF"  # 'OFF', 'GREEN', 'RED_ALARM'
        self._lock = threading.Lock()
        self._active_pulse_timer: Optional[threading.Timer] = None
        self._history: List[Dict[str, Any]] = []

    @property
    def is_unlocked(self) -> bool:
        with self._lock:
            return self._is_unlocked

    @property
    def led_state(self) -> str:
        with self._lock:
            return self._led_state

    @property
    def history(self) -> List[Dict[str, Any]]:
        with self._lock:
            return list(self._history)

    def actuate_gate(self, unlock: bool, duration: Optional[float] = None) -> bool:
        """Actuate physical or simulated turnstile gate barrier.

        Args:
            unlock: True to momentarily disengage solenoid lock, False to retain locked state and trigger alarm.
            duration: Override pulse duration in seconds (defaults to self.pulse_duration).

        Returns:
            Boolean state of the gate actuation (True = unlocked, False = locked).
        """
        pulse_time = duration if duration is not None else self.pulse_duration
        now_iso = datetime.now(timezone.utc).isoformat()

        with self._lock:
            # Cancel any existing auto-lock timer
            if self._active_pulse_timer is not None and self._active_pulse_timer.is_alive():
                self._active_pulse_timer.cancel()

            if unlock:
                self._is_unlocked = True
                self._led_state = "GREEN"
                logger.info(
                    "[TurnstileRelay] ACCESS GRANTED: Solenoid relay ENERGIZED (UNLOCKED). "
                    "Green LED ACTIVE for %.1f seconds.",
                    pulse_time,
                )

                # Schedule automatic lock re-engagement
                self._active_pulse_timer = threading.Timer(pulse_time, self._relock_gate)
                self._active_pulse_timer.daemon = True
                self._active_pulse_timer.start()

                self._history.append({
                    "timestamp": now_iso,
                    "action": "UNLOCK",
                    "duration_seconds": pulse_time,
                    "led_state": "GREEN",
                })
                return True

            else:
                self._is_unlocked = False
                self._led_state = "RED_ALARM"
                logger.warning(
                    "[TurnstileRelay] ACCESS DENIED: Gate remains LOCKED. Red statutory alarm LED FLASHING."
                )

                # Reset red alarm after pulse time
                self._active_pulse_timer = threading.Timer(pulse_time, self._clear_alarm)
                self._active_pulse_timer.daemon = True
                self._active_pulse_timer.start()

                self._history.append({
                    "timestamp": now_iso,
                    "action": "DENIED_LOCK",
                    "duration_seconds": pulse_time,
                    "led_state": "RED_ALARM",
                })
                return False

    def _relock_gate(self) -> None:
        """Internal callback to re-engage solenoid lock and turn off green LED."""
        with self._lock:
            self._is_unlocked = False
            self._led_state = "OFF"
            logger.info("[TurnstileRelay] Solenoid relay DE-ENERGIZED (LOCKED). Green LED OFF.")

    def _clear_alarm(self) -> None:
        """Internal callback to clear red alarm strobe."""
        with self._lock:
            if self._led_state == "RED_ALARM":
                self._led_state = "OFF"
                logger.info("[TurnstileRelay] Red alarm LED cleared.")

    def emergency_lockdown(self) -> None:
        """Immediate statutory lockdown: De-energize all relays and trigger persistent red alarm."""
        with self._lock:
            if self._active_pulse_timer is not None and self._active_pulse_timer.is_alive():
                self._active_pulse_timer.cancel()
            self._is_unlocked = False
            self._led_state = "RED_ALARM"
            logger.critical("[TurnstileRelay] EMERGENCY LOCKDOWN TRIGGERED. Turnstiles permanently locked.")

    def close(self) -> None:
        """Clean up timers and hardware lines."""
        with self._lock:
            if self._active_pulse_timer is not None and self._active_pulse_timer.is_alive():
                self._active_pulse_timer.cancel()
            self._is_unlocked = False
            self._led_state = "OFF"
