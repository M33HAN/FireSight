"""
FireSight — Dwell Time Analytics
Tracks how long objects stay in defined zones and alerts on thresholds.
"""

from typing import Dict, List, Any, Optional
from datetime import datetime


class DwellTimeTracker:
    """Tracks dwell time of objects within defined zones."""

    def __init__(self):
        self.active_dwells: Dict[str, Dict] = {}  # track_id -> dwell info
        self.zones: List[Dict] = []
        self.default_threshold_seconds = 300  # 5 minutes

    def set_zones(self, zones: List[Dict]):
        """Set monitoring zones with dwell time thresholds."""
        self.zones = zones

    def update(self, track_id: str, bbox: List[float], timestamp: float) -> Optional[Dict[str, Any]]:
        """Update dwell tracking for a tracked object."""
        center = [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2]

        for zone in self.zones:
            zone_name = zone.get("name", "unnamed")
            threshold = zone.get("dwell_threshold", self.default_threshold_seconds)
            points = zone.get("points", [])

            in_zone = self._point_in_polygon(center, points) if len(points) >= 3 else False
            key = f"{track_id}_{zone_name}"

            if in_zone:
                if key not in self.active_dwells:
                    self.active_dwells[key] = {
                        "track_id": track_id,
                        "zone_name": zone_name,
                        "entered_at": timestamp,
                        "last_seen": timestamp,
                        "threshold": threshold,
                        "alerted": False,
                    }
                else:
                    self.active_dwells[key]["last_seen"] = timestamp

                dwell = self.active_dwells[key]
                dwell_seconds = timestamp - dwell["entered_at"]
                exceeded = dwell_seconds >= threshold

                if exceeded and not dwell["alerted"]:
                    dwell["alerted"] = True
                    return {
                        "track_id": track_id,
                        "zone_name": zone_name,
                        "dwell_seconds": round(dwell_seconds, 1),
                        "threshold": threshold,
                        "threshold_exceeded": True,
                        "entered_at": datetime.fromtimestamp(dwell["entered_at"]).isoformat(),
                        "timestamp": datetime.fromtimestamp(timestamp).isoformat(),
                    }
            else:
                if key in self.active_dwells:
                    departed = self.active_dwells.pop(key)
                    dwell_seconds = timestamp - departed["entered_at"]
                    return {
                        "track_id": track_id,
                        "zone_name": zone_name,
                        "dwell_seconds": round(dwell_seconds, 1),
                        "threshold": departed["threshold"],
                        "threshold_exceeded": dwell_seconds >= departed["threshold"],
                        "entered_at": datetime.fromtimestamp(departed["entered_at"]).isoformat(),
                        "departed_at": datetime.fromtimestamp(timestamp).isoformat(),
                    }

        return None

    def get_active_dwells(self) -> List[Dict]:
        """Get all currently active dwell sessions."""
        results = []
        now = datetime.utcnow().timestamp()
        for key, dwell in self.active_dwells.items():
            elapsed = now - dwell["entered_at"]
            results.append({
                "track_id": dwell["track_id"],
                "zone_name": dwell["zone_name"],
                "dwell_seconds": round(elapsed, 1),
                "threshold": dwell["threshold"],
                "threshold_exceeded": elapsed >= dwell["threshold"],
            })
        return results

    def cleanup_stale(self, max_idle_seconds: float = 30.0, current_time: float = 0):
        """Remove tracks that haven't been seen recently."""
        stale = []
        for key, dwell in self.active_dwells.items():
            if (current_time - dwell["last_seen"]) > max_idle_seconds:
                stale.append(key)
        for key in stale:
            del self.active_dwells[key]

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

    async def save_dwell_log(self, camera_id: int, dwell_data: Dict, db):
        """Persist dwell log to database."""
        from app.models import DwellLog
        log = DwellLog(
            camera_id=camera_id,
            zone_name=dwell_data["zone_name"],
            track_id=dwell_data["track_id"],
            entered_at=dwell_data.get("entered_at"),
            departed_at=dwell_data.get("departed_at"),
            dwell_seconds=dwell_data["dwell_seconds"],
            threshold_exceeded=dwell_data["threshold_exceeded"],
        )
        db.add(log)
        await db.flush()
