"""
FireSight — Incident Timeline Service
Builds visual path/journey timelines for tracked objects across incidents.
"""

from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import Incident


async def get_object_timeline(track_id: str, camera_id: int, db: AsyncSession) -> List[Dict[str, Any]]:
    """Get the timeline of a tracked object's journey across frames."""
    result = await db.execute(
        select(Incident)
        .where(Incident.camera_id == camera_id)
        .order_by(Incident.detected_at.asc())
        .limit(200)
    )
    incidents = result.scalars().all()

    timeline = []
    for inc in incidents:
        bbox = inc.bbox_data or {}
        timeline.append({
            "incident_id": inc.id,
            "category": inc.category,
            "severity": str(inc.severity),
            "confidence": inc.confidence,
            "bbox": bbox,
            "timestamp": inc.detected_at.isoformat() if inc.detected_at else None,
            "thumbnail": inc.thumbnail_path,
        })

    return timeline


async def get_incident_journey(incident_id: int, db: AsyncSession) -> Dict[str, Any]:
    """Get the full journey context around a specific incident."""
    result = await db.execute(select(Incident).where(Incident.id == incident_id))
    incident = result.scalar_one_or_none()
    if not incident:
        return {"error": "Incident not found"}

    # Get nearby incidents from same camera within 5 minutes
    from datetime import timedelta
    time_window = timedelta(minutes=5)
    nearby = await db.execute(
        select(Incident)
        .where(Incident.camera_id == incident.camera_id)
        .where(Incident.detected_at.between(
            incident.detected_at - time_window,
            incident.detected_at + time_window,
        ))
        .order_by(Incident.detected_at.asc())
    )

    return {
        "incident": {
            "id": incident.id,
            "category": incident.category,
            "severity": str(incident.severity),
            "detected_at": incident.detected_at.isoformat(),
        },
        "context": [
            {
                "id": i.id, "category": i.category,
                "detected_at": i.detected_at.isoformat() if i.detected_at else None,
            }
            for i in nearby.scalars().all()
        ],
    }
