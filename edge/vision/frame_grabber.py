"""Threaded Frame Grabber for RTSP/CCTV Camera Streams

Continuously reads video frames in a dedicated daemon thread to prevent
OpenCV buffer latency accumulation and guarantee sub-millisecond frame retrieval.
"""

from datetime import datetime
import logging
import threading
import time
from typing import Optional, Tuple
import cv2
import numpy as np

logger = logging.getLogger("edge.vision.frame_grabber")


class FrameGrabber:
    """Threaded RTSP / IP Camera video frame consumer."""

    def __init__(
        self,
        stream_url: str = "0",
        simulation_mode: bool = False,
        width: int = 640,
        height: int = 480,
    ) -> None:
        self.stream_url = stream_url
        self.simulation_mode = simulation_mode
        self.width = width
        self.height = height

        self._cap: Optional[cv2.VideoCapture] = None
        self._latest_frame: Optional[np.ndarray] = None
        self._lock = threading.Lock()
        self._running = False
        self._thread: Optional[threading.Thread] = None
        self._frame_count = 0

    def start(self) -> "FrameGrabber":
        """Start the background frame capture thread."""
        if self._running:
            return self

        self._running = True

        if not self.simulation_mode:
            # Parse numeric camera index if applicable
            source = int(self.stream_url) if self.stream_url.isdigit() else self.stream_url
            try:
                self._cap = cv2.VideoCapture(source)
                if not self._cap.isOpened():
                    logger.warning(
                        "[FrameGrabber] Unable to open stream: %s. Falling back to synthetic simulation mode.",
                        self.stream_url,
                    )
                    self._cap = None
                    self.simulation_mode = True
                else:
                    self._cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.width)
                    self._cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.height)
                    logger.info("[FrameGrabber] Video capture initialized on source: %s", self.stream_url)
            except Exception as exc:
                logger.warning(
                    "[FrameGrabber] Exception opening video source (%s): %s. Reverting to simulation mode.",
                    self.stream_url,
                    exc,
                )
                self._cap = None
                self.simulation_mode = True

        self._thread = threading.Thread(target=self._capture_loop, daemon=True, name="FrameGrabberThread")
        self._thread.start()
        logger.info("[FrameGrabber] Capture worker thread started.")
        return self

    def _capture_loop(self) -> None:
        """Continuously pull latest frame from video device or generate synthetic frame."""
        while self._running:
            if not self.simulation_mode and self._cap is not None and self._cap.isOpened():
                ret, frame = self._cap.read()
                if ret and frame is not None:
                    with self._lock:
                        self._latest_frame = frame
                        self._frame_count += 1
                else:
                    # Brief sleep to avoid busy-wait on dropped stream
                    time.sleep(0.01)
            else:
                # Generate synthetic test frame for simulation mode
                frame = self._generate_synthetic_frame()
                with self._lock:
                    self._latest_frame = frame
                    self._frame_count += 1
                time.sleep(0.033)  # ~30 FPS

    def _generate_synthetic_frame(self) -> np.ndarray:
        """Create a synthetic CCTV video frame with timestamp overlay for testing."""
        # 640x480 dark colliery pithead background
        frame = np.zeros((self.height, self.width, 3), dtype=np.uint8)
        frame[:] = (20, 22, 32)  # Dark obsidian

        # Pithead Gate guide grid
        cv2.rectangle(frame, (180, 60), (460, 440), (45, 50, 65), 2)

        # Worker silhouette representation (head, body)
        cv2.circle(frame, (320, 150), 45, (80, 85, 100), -1)  # Head
        pts = np.array([[270, 200], [370, 200], [400, 420], [240, 420]], np.int32)
        cv2.fillPoly(frame, [pts], (90, 95, 115))  # Torso / Vest

        # Hardhat representation (top of head)
        cv2.ellipse(frame, (320, 130), (50, 25), 0, 180, 360, (0, 200, 255), -1)

        # High-vis vest stripes
        cv2.rectangle(frame, (280, 230), (360, 250), (0, 220, 180), -1)
        cv2.rectangle(frame, (280, 280), (360, 300), (0, 220, 180), -1)

        # SCSR pack on belt
        cv2.rectangle(frame, (340, 340), (390, 400), (30, 140, 255), -1)

        # Camera HUD overlay
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
        cv2.putText(
            frame,
            f"PITHEAD GATE CCTV 01 | {now_str}",
            (20, 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            (0, 255, 180),
            1,
            cv2.LINE_AA,
        )
        cv2.putText(
            frame,
            f"FPS: 30.0 | FRAME: {self._frame_count}",
            (20, self.height - 20),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.45,
            (160, 165, 180),
            1,
            cv2.LINE_AA,
        )
        return frame

    def get_latest_frame(self) -> Tuple[bool, Optional[np.ndarray]]:
        """Retrieve the most recent video frame safely without queue latency.

        Returns:
            Tuple of (success: bool, frame: Optional[np.ndarray]).
        """
        with self._lock:
            if self._latest_frame is None:
                return False, None
            return True, self._latest_frame.copy()

    def stop(self) -> None:
        """Stop frame grabber and release camera hardware."""
        self._running = False
        if self._thread is not None and self._thread.is_alive():
            self._thread.join(timeout=1.0)
        if self._cap is not None:
            self._cap.release()
            self._cap = None
        logger.info("[FrameGrabber] Frame grabber stopped successfully.")

    def __enter__(self) -> "FrameGrabber":
        return self.start()

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        self.stop()
