"""
FireSight — Crowd Density Estimation
Counts people and estimates crowd density levels with threshold alerting.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime


class CrowdDensityAnalyzer:
    """Analyses crowd density from human detections."""

    DENSITY_LEVELS = {
        "low": (0, 5),
        "moderate": (5, 15),
        "high": (15, 30),
        "very_high": (30, 50),
        "critical": (50, float("inf")),
    }

    def __init__(self, area_sqm: float = 100.0):
        self.area_sqm = area_sqm
        self.threshold = 20
        self.history: List[Dict] = []

    def analyze(self, detections: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze crowd density from current detections."""
        people = [d for d in detections if d.get("category") == "human"]
        people_count = len(people)
        density_per_sqm = people_count / self.area_sqm if self.area_sqm > 0 else 0
        density_level = self._get_density_level(people_count)
        threshold_exceeded = people_count >= self.threshold

        snapshot = {
            "people_count": people_count,
            "density_level": density_level,
            "density_per_sqm": round(density_per_sqm, 4),
            "threshold_exceeded": threshold_exceeded,
            "threshold": self.threshold,
            "area_sqm": self.area_sqm,
            "timestamp": datetime.utcnow().isoformat(),
        }

        self.history.append(snapshot)
        if len(self.history) > 1000:
            self.history = self.history[-500:]

        return snapshot

    def _get_density_level(self, count: int) -> str:
        """Determine density level based on people count."""
        for level, (low, high) in self.DENSITY_LEVELS.items():
            if low <= count < high:
                return level
        return "critical"

    def set_threshold(self, threshold: int):
        """Update the crowd threshold for alerts."""
        self.threshold = max(1, threshold)

    def set_area(self, area_sqm: float):
        """Update the monitored area size."""
        self.area_sqm = max(1.0, area_sqm)

    def get_trend(self, window: int = 10) -> str:
        """Get crowd trend (increasing, decreasing, stable)."""
        if len(self.history) < window:
            return "insufficient_data"

        recent = self.history[-window:]
        counts = [s["people_count"] for s in recent]
        first_half = sum(counts[:window // 2]) / (window // 2)
        second_half = sum(counts[window // 2:]) / (window - window // 2)

        diff = second_half - first_half
        if diff > 2:
            return "increasing"
        elif diff < -2:
            return "decreasing"
        return "stable"

    async def save_snapshot(self, camera_id: int, snapshot: Dict, db):
        """Persist a crowd snapshot to the database."""
        from app.models import CrowdSnapshot
        record = CrowdSnapshot(
            camera_id=camera_id,
            people_count=snapshot["people_count"],
            density_level=snapshot["density_level"],
            density_per_sqm=snapshot["density_per_sqm"],
            threshold_exceeded=snapshot["threshold_exceeded"],
        )
        db.add(record)
        await db.flush()
