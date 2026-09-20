"""Edge Computer Vision & Optical Inference Pipeline"""

from .frame_grabber import FrameGrabber
from .ppe_detector import PpeDetector, PpeDetectionResult

__all__ = ["FrameGrabber", "PpeDetector", "PpeDetectionResult"]
