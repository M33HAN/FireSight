"""
FireSight — YOLO Detection Engine
Core AI engine for running YOLOv8/v11 detection on video frames.
Supports general objects, fire/smoke, PPE, and plant/machinery detection.
"""

import cv2
import numpy as np
from ultralytics import YOLO
from typing import List, Dict, Any, Optional
from datetime import datetime
import asyncio
import os

from app.config import settings
from app.detection.categories import CATEGORY_MAP, get_severity
from app.detection.tracker import IoUTracker
from app.detection.event_rules import EventRulesEngine


class DetectionEngine:
    """Main YOLO detection engine for FireSight."""

    def __init__(self):
        self.models = {}
        self.tracker = IoUTracker()
        self.event_rules = EventRulesEngine()
        self._load_models()

    def _load_models(self):
        """Load all YOLO models."""
        # General model (COCO - people, vehicles, bicycles)
        if os.path.exists(settings.YOLO_GENERAL_MODEL):
            self.models["general"] = YOLO(settings.YOLO_GENERAL_MODEL)
            print(f"  Loaded general model: {settings.YOLO_GENERAL_MODEL}")

        # Fire & smoke model
        if os.path.exists(settings.YOLO_FIRE_SMOKE_MODEL):
            self.models["fire_smoke"] = YOLO(settings.YOLO_FIRE_SMOKE_MODEL)
            print(f"  Loaded fire/smoke model: {settings.YOLO_FIRE_SMOKE_MODEL}")

        # PPE model
        if os.path.exists(settings.YOLO_PPE_MODEL):
            self.models["ppe"] = YOLO(settings.YOLO_PPE_MODEL)
            print(f"  Loaded PPE model: {settings.YOLO_PPE_MODEL}")

        # Plant/machinery model
        if os.path.exists(settings.YOLO_PLANT_MODEL):
            self.models["plant"] = YOLO(settings.YOLO_PLANT_MODEL)
            print(f"  Loaded plant model: {settings.YOLO_PLANT_MODEL}")

    def detect_frame(self, frame: np.ndarray, categories: List[str] = None, confidence: float = None) -> List[Dict[str, Any]]:
        """Run detection on a single frame across all relevant models."""
        if confidence is None:
            confidence = settings.DEFAULT_CONFIDENCE

        detections = []

        # General model (humans, vehicles, bicycles)
        if "general" in self.models:
            results = self.models["general"](frame, conf=confidence, verbose=False)
            for r in results:
                for box in r.boxes:
                    cls_id = int(box.cls[0])
                    cls_name = r.names[cls_id]
                    category = CATEGORY_MAP.get(cls_name)

                    if category and (categories is None or category in categories):
                        detections.append({
                            "category": category,
                            "confidence": float(box.conf[0]),
                            "bbox": box.xyxy[0].tolist(),
                            "class_name": cls_name,
                            "severity": get_severity(category),
                        })

        # Fire & smoke model
        if "fire_smoke" in self.models and (categories is None or "fire" in categories or "smoke" in categories):
            results = self.models["fire_smoke"](frame, conf=confidence * 0.8, verbose=False)
            for r in results:
                for box in r.boxes:
                    cls_id = int(box.cls[0])
                    cls_name = r.names[cls_id].lower()
                    category = "fire" if "fire" in cls_name else "smoke"
                    detections.append({
                        "category": category,
                        "confidence": float(box.conf[0]),
                        "bbox": box.xyxy[0].tolist(),
                        "class_name": cls_name,
                        "severity": get_severity(category),
                    })

        # PPE model
        if "ppe" in self.models and (categories is None or "ppe" in categories):
            results = self.models["ppe"](frame, conf=confidence, verbose=False)
            for r in results:
                for box in r.boxes:
                    cls_id = int(box.cls[0])
                    cls_name = r.names[cls_id]
                    detections.append({
                        "category": "ppe",
                        "confidence": float(box.conf[0]),
                        "bbox": box.xyxy[0].tolist(),
                        "class_name": cls_name,
                        "severity": "high",
                    })

        # Plant/machinery model
        if "plant" in self.models and (categories is None or "plant" in categories):
            results = self.models["plant"](frame, conf=confidence, verbose=False)
            for r in results:
                for box in r.boxes:
                    cls_id = int(box.cls[0])
                    cls_name = r.names[cls_id]
                    detections.append({
                        "category": "plant",
                        "confidence": float(box.conf[0]),
                        "bbox": box.xyxy[0].tolist(),
                        "class_name": cls_name,
                        "severity": "medium",
                    })

        # Apply tracking
        tracked = self.tracker.update(detections)

        # Apply event rules (fall, accident, intrusion detection)
        events = self.event_rules.evaluate(tracked, frame)
        tracked.extend(events)

        return tracked[:settings.MAX_DETECTIONS_PER_FRAME]

    async def analyse_video(self, video_path: str, db=None) -> List[Dict]:
        """Analyse a full video file and return all detections."""
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Cannot open video: {video_path}")

        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        all_incidents = []
        frame_count = 0

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            frame_count += 1
            # Process every Nth frame based on FPS
            if frame_count % max(1, int(fps)) != 0:
                continue

            detections = self.detect_frame(frame)

            for det in detections:
                incident = {
                    "frame": frame_count,
                    "timestamp": frame_count / fps,
                    **det,
                }
                all_incidents.append(incident)

        cap.release()
        return all_incidents

    async def run_live(self, camera_id: int, session_id: int):
        """Run live detection on a camera stream (background task)."""
        from app.database import async_session
        from app.models import Camera, DetectionSession

        async with async_session() as db:
            from sqlalchemy import select
            result = await db.execute(select(Camera).where(Camera.id == camera_id))
            camera = result.scalar_one_or_none()
            if not camera:
                return

            cap = cv2.VideoCapture(camera.stream_url)
            if not cap.isOpened():
                return

            try:
                while camera.detection_enabled:
                    ret, frame = cap.read()
                    if not ret:
                        await asyncio.sleep(1)
                        continue

                    detections = self.detect_frame(frame, camera.detection_categories)

                    # Broadcast via WebSocket
                    from app.routers.websocket import broadcast_detection
                    await broadcast_detection(camera_id, {
                        "type": "detection",
                        "camera_id": camera_id,
                        "detections": detections,
                        "timestamp": datetime.utcnow().isoformat(),
                    })

                    await asyncio.sleep(0.033)  # ~30fps

            finally:
                cap.release()
