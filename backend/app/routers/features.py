"""
FireSight — Advanced Feature Endpoints
Heatmaps, timelapse, sharing, health monitoring.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import Camera, SharedClip, Incident
from app.schemas import ShareCreate, ShareResponse

router = APIRouter()


@router.post("/timelapse/{camera_id}")
async def generate_timelapse(camera_id: int, db: AsyncSession = Depends(get_db)):
    """Generate a construction timelapse with AI event markers."""
    from app.services.timelapse_service import create_timelapse
    result = await create_timelapse(camera_id, db)
    return {"message": "Timelapse generated", "path": result}


@router.get("/heatmap/{camera_id}")
async def generate_heatmap(camera_id: int, db: AsyncSession = Depends(get_db)):
    """Generate activity heatmap for a camera."""
    from app.services.heatmap_service import create_heatmap
    heatmap_data = await create_heatmap(camera_id, db)
    return heatmap_data


@router.post("/share/{incident_id}", response_model=ShareResponse)
async def create_share_link(
    incident_id: int,
    share: ShareCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a shareable link for an incident clip."""
    from app.services.share_service import create_share
    return await create_share(incident_id, share, db)


@router.get("/shared/{token}")
async def view_shared_clip(token: str, db: AsyncSession = Depends(get_db)):
    """View a shared incident clip by token."""
    result = await db.execute(
        select(SharedClip).where(SharedClip.share_token == token)
    )
    clip = result.scalar_one_or_none()
    if not clip:
        raise HTTPException(status_code=404, detail="Shared clip not found")

    # Check expiry
    from datetime import datetime
    if clip.expiry and clip.expiry < datetime.utcnow():
        raise HTTPException(status_code=410, detail="Share link has expired")

    # Increment view count
    clip.view_count += 1
    await db.flush()

    return {
        "incident_id": clip.incident_id,
        "clip_path": clip.clip_path,
        "thumbnail_path": clip.thumbnail_path,
        "view_count": clip.view_count,
        "password_protected": bool(clip.password_hash),
    }


@router.get("/health/cameras")
async def all_camera_health(db: AsyncSession = Depends(get_db)):
    """Get health status for all cameras."""
    from app.services.health_service import check_all_cameras
    return await check_all_cameras(db)


@router.get("/health/cameras/{camera_id}")
async def single_camera_health(camera_id: int, db: AsyncSession = Depends(get_db)):
    """Get health status for a single camera."""
    from app.services.health_service import check_camera
    return await check_camera(camera_id, db)
