"""Edge Vision Gateway Configuration

Loads environment and CLI settings for pithead mini-PC deployments.
"""

from typing import Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class EdgeSettings(BaseSettings):
    """Configuration settings for Edge Vision Turnstile application."""

    # Backend API URL (Surface Cloud / Local On-Premise Gateway)
    backend_api_url: str = Field(
        default="http://localhost:8000/api/v1",
        alias="BACKEND_API_URL",
        description="Coal Guard FastAPI backend URL",
    )

    # Pithead / Shaft Gate Location UUID
    location_id: str = Field(
        default="a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        alias="LOCATION_ID",
        description="MineLocation UUID for this physical pithead gate",
    )

    # Camera Stream URL or Device Index (e.g., 'rtsp://admin:pass@192.168.1.100:554/h264' or '0')
    rtsp_stream_url: str = Field(
        default="0",
        alias="RTSP_STREAM_URL",
        description="RTSP video stream URL or local USB camera index",
    )

    # YOLO Model weights path (.onnx or .pt)
    yolo_model_path: str = Field(
        default="models/ppe_yolo.onnx",
        alias="YOLO_MODEL_PATH",
        description="Path to fine-tuned YOLO PPE model weights",
    )

    # Statutory Optical Compliance Confidence Threshold
    confidence_threshold: float = Field(
        default=0.75,
        alias="CONFIDENCE_THRESHOLD",
        description="Minimum confidence score required for PPE detection under CMR 2017",
    )

    # Turnstile Relay Pulse Duration in seconds
    relay_pulse_duration: float = Field(
        default=3.0,
        alias="RELAY_PULSE_DURATION",
        description="Duration in seconds to hold turnstile gate unlocked",
    )

    # Serial RFID Reader Port (e.g., 'COM3' or '/dev/ttyUSB0')
    serial_port: Optional[str] = Field(
        default=None,
        alias="SERIAL_PORT",
        description="Serial port for physical RFID reader hardware",
    )

    # Serial Baud Rate
    baud_rate: int = Field(
        default=9600,
        alias="BAUD_RATE",
        description="Baud rate for serial RFID reader",
    )

    # Simulation Mode
    simulation_mode: bool = Field(
        default=False,
        alias="SIMULATION_MODE",
        description="Run in mock mode without physical camera or relay hardware",
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


# Singleton settings instance
settings = EdgeSettings()
