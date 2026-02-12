"""
FireSight — Fire & Smoke Detection Module
Custom YOLO model for detecting fire and smoke events.
"""

import cv2
import numpy as np
from typing import List, Dict, Any, Optional
from ultralytics import YOLO

from app.config import settings


class FireSmokeDetector:
    """Specialized fire and smoke detection using custom YOLO model."""

    def __init__(self):
        self.model: Optional[YOLO] = None
        self.confidence_fire = 0.4
        self.confidence_smoke = 0.4
        self.consecutive_frames = {}
        self.alert_threshold = 3  # Consecutive frames before alerting

    def load_model(self, model_path: str = None):
        """Load the fire/smoke YOLO model."""
        path = model_path or settings.YOLO_FIRE_SMOKE_MODEL
        try:
            self.model = YOLO(path)
            print(f"  Fire/smoke model loaded: {path}")
        except Exception as e:
            print(f"  Warning: Could not load fire/smoke model: {e}")

    def detect(self, frame: np.ndarray) -> List[Dict[str, Any]]:
        """Run fire and smoke detection on a frame."""
        if self.model is None:
            return []

        detections = []
        results = self.model(frame, conf=min(self.confidence_fire, self.confidence_smoke), verbose=False)

        for r in results:
            for box in r.boxes:
                cls_id = int(box.cls[0])
                cls_name = r.names[cls_id].lower()
                conf = float(box.conf[0])
                bbox = box.xyxy[0].tolist()

                if "fire" in cls_name or "flame" in cls_name:
                    if conf >= self.confidence_fire:
                        detections.append({
                            "category": "fire",
                            "confidence": conf,
                            "bbox": bbox,
                            "class_name": cls_name,
                            "severity": "critical",
                            "description": f"Fire detected (confidence: {conf:.1%})",
                        })

                elif "smoke" in cls_name:
                    if conf >= self.confidence_smoke:
                        detections.append({
                            "category": "smoke",
                            "confidence": conf,
                            "bbox": bbox,
                            "class_name": cls_name,
                            "severity": "high",
                            "description": f"Smoke detected (confidence: {conf:.1%})",
                        })

        # Track consecutive detections for reducing false positives
        self._update_consecutive(detections)

        return detections

    def _update_consecutive(self, detections: List[Dict]):
        """Track consecutive frame detections for confirmation."""
        current_categories = {d["category"] for d in detections}

        for cat in ["fire", "smoke"]:
            if cat in current_categories:
                self.consecutive_frames[cat] = self.consecutive_frames.get(cat, 0) + 1
            else:
                self.consecutive_frames[cat] = 0

    def is_confirmed(self, category: str) -> bool:
        """Check if detection is confirmed across consecutive frames."""
        return self.consecutive_frames.get(category, 0) >= self.alert_threshold

    def estimate_fire_size(self, bbox: List[float], frame_shape: tuple) -> str:
        """Estimate fire size based on bounding box relative to frame."""
        frame_area = frame_shape[0] * frame_shape[1]
        bbox_area = (bbox[2] - bbox[0]) * (bbox[3] - bbox[1])
        ratio = bbox_area / frame_area

        if ratio > 0.3:
            return "large"
        elif ratio > 0.1:
            return "medium"
        else:
            return "small"
