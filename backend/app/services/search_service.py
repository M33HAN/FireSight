"""
FireSight — Natural Language Search Service
Parses natural language queries to search incidents.
Example: "show me forklifts near gate yesterday"
"""

import re
from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.models import Incident


# Category keyword mappings
CATEGORY_KEYWORDS = {
    "human": ["person", "people", "human", "man", "woman", "worker", "pedestrian"],
    "vehicle": ["vehicle", "car", "truck", "bus", "van", "motorcycle"],
    "plant": ["plant", "machinery", "forklift", "crane", "excavator", "bulldozer", "telehandler"],
    "bicycle": ["bicycle", "bike", "cyclist", "scooter"],
    "ppe": ["ppe", "helmet", "hard hat", "hi-vis", "vest", "goggles", "gloves", "safety"],
    "fire": ["fire", "flame", "burning"],
    "smoke": ["smoke", "smoking"],
    "accident": ["accident", "collision", "crash"],
    "intrusion": ["intrusion", "trespass", "unauthorised", "unauthorized", "breach"],
    "fall": ["fall", "fallen", "fell", "down", "collapse"],
}

# Time keyword mappings
TIME_KEYWORDS = {
    "today": lambda: datetime.utcnow().replace(hour=0, minute=0, second=0),
    "yesterday": lambda: (datetime.utcnow() - timedelta(days=1)).replace(hour=0, minute=0, second=0),
    "this week": lambda: datetime.utcnow() - timedelta(days=7),
    "last hour": lambda: datetime.utcnow() - timedelta(hours=1),
    "last 24 hours": lambda: datetime.utcnow() - timedelta(hours=24),
}


async def search_incidents(query: str, db: AsyncSession) -> List[Dict[str, Any]]:
    """Parse natural language query and search incidents."""
    query_lower = query.lower().strip()

    # Extract category
    category = _extract_category(query_lower)

    # Extract time range
    start_date = _extract_time(query_lower)

    # Build database query
    db_query = select(Incident).order_by(Incident.detected_at.desc())

    if category:
        db_query = db_query.where(Incident.category == category)
    if start_date:
        db_query = db_query.where(Incident.detected_at >= start_date)

    db_query = db_query.limit(50)

    result = await db.execute(db_query)
    incidents = result.scalars().all()

    return [
        {
            "id": inc.id,
            "camera_id": inc.camera_id,
            "category": inc.category,
            "severity": str(inc.severity),
            "status": str(inc.status),
            "confidence": inc.confidence,
            "detected_at": inc.detected_at.isoformat() if inc.detected_at else None,
            "description": inc.description,
        }
        for inc in incidents
    ]


def _extract_category(query: str) -> str:
    """Extract detection category from natural language query."""
    for category, keywords in CATEGORY_KEYWORDS.items():
        for keyword in keywords:
            if keyword in query:
                return category
    return None


def _extract_time(query: str) -> datetime:
    """Extract time reference from natural language query."""
    for keyword, time_fn in TIME_KEYWORDS.items():
        if keyword in query:
            return time_fn()
    return None
