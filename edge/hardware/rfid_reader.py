"""Physical Serial & Simulated RFID Badge Reader

Captures worker RFID badge UID taps from a physical serial reader (e.g. 13.56MHz Mifare)
or programmatically injected simulated badge events for headless edge testing.
"""

import logging
import queue
import threading
import time
from typing import Callable, Optional

logger = logging.getLogger("edge.hardware.rfid_reader")


class RfidReader:
    """Worker RFID Badge Reader interface."""

    def __init__(
        self,
        port: Optional[str] = None,
        baud_rate: int = 9600,
        simulation_mode: bool = False,
    ) -> None:
        self.port = port
        self.baud_rate = baud_rate
        self.simulation_mode = simulation_mode

        self._running = False
        self._thread: Optional[threading.Thread] = None
        self._callback: Optional[Callable[[str], None]] = None
        self._queue: queue.Queue[str] = queue.Queue()
        self._serial = None

    def register_callback(self, callback: Callable[[str], None]) -> None:
        """Register a handler function to be invoked on each RFID tap."""
        self._callback = callback

    def start(self) -> "RfidReader":
        """Start listening for badge tap events."""
        if self._running:
            return self

        self._running = True

        if not self.simulation_mode and self.port:
            try:
                import serial  # type: ignore

                self._serial = serial.Serial(self.port, self.baud_rate, timeout=1.0)
                logger.info("[RfidReader] Opened serial connection on port: %s (%d baud)", self.port, self.baud_rate)
            except Exception as exc:
                logger.warning(
                    "[RfidReader] Failed to open serial port '%s': %s. Reverting to simulation mode.",
                    self.port,
                    exc,
                )
                self._serial = None
                self.simulation_mode = True
        else:
            self.simulation_mode = True

        self._thread = threading.Thread(target=self._reader_loop, daemon=True, name="RfidReaderThread")
        self._thread.start()
        logger.info("[RfidReader] RFID listener worker started (simulation_mode=%s).", self.simulation_mode)
        return self

    def _reader_loop(self) -> None:
        """Background thread monitoring serial stream or internal event queue."""
        while self._running:
            # 1. Check for physical serial badge data
            if self._serial is not None and self._serial.is_open:
                try:
                    line = self._serial.readline().decode("utf-8", errors="ignore").strip()
                    if line:
                        logger.info("[RfidReader] Physical badge detected: %s", line)
                        self._dispatch_tag(line)
                except Exception as exc:
                    logger.error("[RfidReader] Serial read exception: %s", exc)
                    time.sleep(0.5)

            # 2. Check for simulated/queued badge taps
            try:
                tag = self._queue.get(timeout=0.1)
                if tag:
                    logger.info("[RfidReader] Processing queued badge tap: %s", tag)
                    self._dispatch_tag(tag)
            except queue.Empty:
                pass

    def _dispatch_tag(self, tag: str) -> None:
        """Forward detected badge ID to registered callback handler."""
        tag = tag.strip()
        if not tag:
            return
        if self._callback is not None:
            try:
                self._callback(tag)
            except Exception as exc:
                logger.error("[RfidReader] Error executing callback for tag '%s': %s", tag, exc)

    def simulate_tag_scan(self, rfid_tag: str) -> None:
        """Inject a simulated RFID tap event into the processing pipeline."""
        logger.info("[RfidReader] Simulated RFID tap queued: %s", rfid_tag)
        self._queue.put(rfid_tag)

    def stop(self) -> None:
        """Stop reader thread and release hardware resources."""
        self._running = False
        if self._thread is not None and self._thread.is_alive():
            self._thread.join(timeout=1.0)
        if self._serial is not None:
            try:
                self._serial.close()
            except Exception:
                pass
            self._serial = None
        logger.info("[RfidReader] RFID reader stopped.")

    def __enter__(self) -> "RfidReader":
        return self.start()

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        self.stop()
