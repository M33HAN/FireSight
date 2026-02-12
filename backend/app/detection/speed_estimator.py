"""
FireSight — Vehicle Speed Estimation
Estimates vehicle speeds using tracked bounding box positions and camera calibration.
"""

import math
from typing import Dict, List, Any, Optional
from datetime import datetime


class SpeedEstimator:
    """Estimates vehicle speed from tracked positions with camera calibration."""

    def __init__(self, pixels_per_meter: float = 10.0, fps: float = 30.0):
        self.pixels_per_meter = pixels_per_meter
        self.fps = fps
        self.track_positions: Dict[str, List[Dict]] = {}
        self.speed_limit_kmh: Optional[float] = None

    def update(self, track_id: str, bbox: List[float], frame_time: float) -> Optional[Dict[str, Any]]:
        """Update track position and calculate speed if enough data."""
        center_x = (bbox[0] + bbox[2]) / 2
        center_y = (bbox[1] + bbox[3]) / 2

        if track_id not in self.track_positions:
            self.track_positions[track_id] = []

        self.track_positions[track_id].append({
            "x": center_x, "y": center_y, "time": frame_time,
        })

        # Keep only last 30 positions
        if len(self.track_positions[track_id]) > 30:
            self.track_positions[track_id] = self.track_positions[track_id][-30:]

        positions = self.track_positions[track_id]
        if len(positions) < 5:
            return None

        # Calculate speed from last N positions
        return self._calculate_speed(track_id, positions)

    def _calculate_speed(self, track_id: str, positions: List[Dict]) -> Dict[str, Any]:
        """Calculate speed from tracked positions."""
        recent = positions[-10:]
        if len(recent) < 2:
            return None

        total_distance_px = 0
        for i in range(1, len(recent)):
            dx = recent[i]["x"] - recent[i - 1]["x"]
            dy = recent[i]["y"] - recent[i - 1]["y"]
            total_distance_px += math.sqrt(dx * dx + dy * dy)

        time_elapsed = recent[-1]["time"] - recent[0]["time"]
        if time_elapsed <= 0:
            return None

        distance_m = total_distance_px / self.pixels_per_meter
        speed_ms = distance_m / time_elapsed
        speed_kmh = speed_ms * 3.6
        speed_mph = speed_kmh * 0.621371

        is_violation = False
        if self.speed_limit_kmh and speed_kmh > self.speed_limit_kmh:
            is_violation = True

        return {
            "track_id": track_id,
            "speed_kmh": round(speed_kmh, 1),
            "speed_mph": round(speed_mph, 1),
            "speed_limit": self.speed_limit_kmh,
            "is_violation": is_violation,
            "timestamp": datetime.utcnow().isoformat(),
        }

    def set_calibration(self, pixels_per_meter: float):
        """Update camera calibration."""
        self.pixels_per_meter = max(0.1, pixels_per_meter)

    def set_speed_limit(self, limit_kmh: float):
        """Set speed limit for violation detection."""
        self.speed_limit_kmh = limit_kmh

    def cleanup_stale(self, max_age_seconds: float = 10.0, current_time: float = 0):
        """Remove tracks that haven't been updated recently."""
        stale = []
        for tid, positions in self.track_positions.items():
            if positions and (current_time - positions[-1]["time"]) > max_age_seconds:
                stale.append(tid)
        for tid in stale:
            del self.track_positions[tid]

    async def save_speed_log(self, camera_id: int, speed_data: Dict, db):
        """Persist speed measurement to database."""
        from app.models import SpeedLog
        log = SpeedLog(
            camera_id=camera_id,
            track_id=speed_data["track_id"],
            speed_kmh=speed_data["speed_kmh"],
            speed_mph=speed_data["speed_mph"],
            speed_limit=speed_data.get("speed_limit"),
            is_violation=speed_data["is_violation"],
        )
        db.add(log)
        await db.flush()
