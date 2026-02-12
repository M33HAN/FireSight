"""
FireSight — Incident Management Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import List, Optional
from datetime import datetime, timedelta

from app.database import get_db
from app.models import Incident, Camera, IncidentStatus, Severity
from app.schemas import IncidentResponse, IncidentUpdate, DashboardStats

router = APIRouter()


@router.get("/", response_model=List[IncidentResponse])
async def list_incidents(
    camera_id: Optional[int] = None,
    category: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    limit: int = Query(default=50, le=500),
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    """List incidents with optional filters."""
    query = select(Incident).order_by(Incident.detected_at.desc())

    if camera_id:
        query = query.where(Incident.camera_id == camera_id)
    if category:
        query = query.where(Incident.category == category)
    if severity:
        query = query.where(Incident.severity == severity)
    if status:
        query = query.where(Incident.status == status)
    if start_date:
        query = query.where(Incident.detected_at >= start_date)
    if end_date:
        query = query.where(Incident.detected_at <= end_date)

    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/dashboard", response_model=DashboardStats)
async def dashboard_stats(db: AsyncSession = Depends(get_db)):
    """Get dashboard statistics."""
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    # Total incidents
    total = await db.execute(select(func.count(Incident.id)))
    total_incidents = total.scalar() or 0

    # Incidents today
    today_count = await db.execute(
        select(func.count(Incident.id)).where(Incident.detected_at >= today)
    )
    incidents_today = today_count.scalar() or 0

    # Active cameras
    active = await db.execute(
        select(func.count(Camera.id)).where(Camera.is_active == True)
    )
    active_cameras = active.scalar() or 0

    # Category breakdown
    cat_result = await db.execute(
        select(Incident.category, func.count(Incident.id))
        .group_by(Incident.category)
    )
    category_breakdown = dict(cat_result.all())

    # Severity breakdown
    sev_result = await db.execute(
        select(Incident.severity, func.count(Incident.id))
        .group_by(Incident.severity)
    )
    severity_breakdown = {str(k): v for k, v in sev_result.all()}

    return DashboardStats(
        total_incidents=total_incidents,
        incidents_today=incidents_today,
        active_cameras=active_cameras,
        detection_sessions=0,
        category_breakdown=category_breakdown,
        severity_breakdown=severity_breakdown,
        hourly_data=[],
    )


@router.get("/search")
async def search_incidents(
    q: str = Query(..., description="Natural language search query"),
    db: AsyncSession = Depends(get_db),
):
    """Natural language search for incidents."""
    from app.services.search_service import search_incidents as do_search
    return await do_search(q, db)


@router.get("/{incident_id}", response_model=IncidentResponse)
async def get_incident(incident_id: int, db: AsyncSession = Depends(get_db)):
    """Get a single incident by ID."""
    result = await db.execute(select(Incident).where(Incident.id == incident_id))
    incident = result.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident


@router.patch("/{incident_id}", response_model=IncidentResponse)
async def update_incident(
    incident_id: int,
    update: IncidentUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update incident status/notes."""
    result = await db.execute(select(Incident).where(Incident.id == incident_id))
    incident = result.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    update_data = update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(incident, field, value)

    await db.flush()
    await db.refresh(incident)
    return incident
