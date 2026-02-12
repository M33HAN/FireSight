"""
FireSight — Event Rules Engine
Detects complex events: falls, accidents, intrusions based on tracked objects.
"""

from typing import List, Dict, Any
import numpy as np


class EventRulesEngine:
    """Evaluates tracked detections against event rules."""

    def __init__(self):
        self.track_history = {}
        self.zones = []

    def evaluate(self, detections: List[Dict], frame=None) -> List[Dict]:
        """Evaluate all event rules on current detections."""
        events = []

        # Update track history
        for det in detections:
            tid = det.get("track_id")
            if tid:
                if tid not in self.track_history:
                    self.track_history[tid] = []
                self.track_history[tid].append(det)

        # Check for falls
        fall_events = self._check_falls(detections)
        events.extend(fall_events)

        # Check for accidents (proximity-based)
        accident_events = self._check_accidents(detections)
        events.extend(accident_events)

        # Check for intrusions
        intrusion_events = self._check_intrusions(detections)
        events.extend(intrusion_events)

        return events

    def _check_falls(self, detections: List[Dict]) -> List[Dict]:
        """Detect falls based on bounding box aspect ratio changes."""
        events = []
        for det in detections:
            if det.get("category") != "human":
                continue

            tid = det.get("track_id")
            if not tid or tid not in self.track_history:
                continue

            history = self.track_history[tid]
            if len(history) < 5:
                continue

            # Check aspect ratio change (person going from vertical to horizontal)
            current_bbox = det["bbox"]
            w = current_bbox[2] - current_bbox[0]
            h = current_bbox[3] - current_bbox[1]
            current_ratio = w / max(h, 1)

            prev_bbox = history[-5]["bbox"]
            pw = prev_bbox[2] - prev_bbox[0]
            ph = prev_bbox[3] - prev_bbox[1]
            prev_ratio = pw / max(ph, 1)

            # If ratio changed significantly (vertical to horizontal)
            if prev_ratio < 0.7 and current_ratio > 1.3:
                events.append({
                    "category": "fall",
                    "confidence": 0.75,
                    "bbox": current_bbox,
                    "track_id": tid,
                    "severity": "critical",
                    "description": f"Possible fall detected for track {tid}",
                })

        return events

    def _check_accidents(self, detections: List[Dict]) -> List[Dict]:
        """Detect accidents based on vehicle/plant proximity and sudden stops."""
        events = []
        vehicles = [d for d in detections if d.get("category") in ("vehicle", "plant")]

        for i in range(len(vehicles)):
            for j in range(i + 1, len(vehicles)):
                bbox_a = vehicles[i]["bbox"]
                bbox_b = vehicles[j]["bbox"]

                # Check overlap
                overlap = self._bbox_overlap(bbox_a, bbox_b)
                if overlap > 0.3:
                    events.append({
                        "category": "accident",
                        "confidence": 0.7,
                        "bbox": self._merge_bboxes(bbox_a, bbox_b),
                        "track_id": None,
                        "severity": "critical",
                        "description": "Possible collision detected",
                    })

        return events

    def _check_intrusions(self, detections: List[Dict]) -> List[Dict]:
        """Detect intrusions into restricted zones."""
        events = []
        for det in detections:
            if det.get("category") != "human":
                continue

            bbox_center = [
                (det["bbox"][0] + det["bbox"][2]) / 2,
                (det["bbox"][1] + det["bbox"][3]) / 2,
            ]

            for zone in self.zones:
                if zone.get("type") == "restricted":
                    if self._point_in_polygon(bbox_center, zone.get("points", [])):
                        events.append({
                            "category": "intrusion",
                            "confidence": 0.9,
                            "bbox": det["bbox"],
                            "track_id": det.get("track_id"),
                            "severity": "high",
                            "description": f"Intrusion in zone: {zone.get('name', 'restricted')}",
                        })

        return events

    @staticmethod
    def _bbox_overlap(a, b):
        x1 = max(a[0], b[0])
        y1 = max(a[1], b[1])
        x2 = min(a[2], b[2])
        y2 = min(a[3], b[3])
        inter = max(0, x2 - x1) * max(0, y2 - y1)
        area_a = (a[2] - a[0]) * (a[3] - a[1])
        area_b = (b[2] - b[0]) * (b[3] - b[1])
        min_area = min(area_a, area_b)
        return inter / max(min_area, 1)

    @staticmethod
    def _merge_bboxes(a, b):
        return [min(a[0], b[0]), min(a[1], b[1]), max(a[2], b[2]), max(a[3], b[3])]

    @staticmethod
    def _point_in_polygon(point, polygon):
        if len(polygon) < 3:
            return False
        n = len(polygon)
        inside = False
        x, y = point
        j = n - 1
        for i in range(n):
            xi, yi = polygon[i]
            xj, yj = polygon[j]
            if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / (yj - yi) + xi):
                inside = not inside
            j = i
        return inside

    def set_zones(self, zones: List[Dict]):
        """Set restricted/monitoring zones."""
        self.zones = zones
