"""
FireSight — Camera AI Settings Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import Camera
from app.schemas import CameraAISettings

router = APIRouter()

# In-memory AI settings per camera (will move to DB/Redis)
camera_settings = {}


@router.get("/cameras/{camera_id}/settings", response_model=CameraAISettings)
async def get_camera_ai_settings(camera_id: int, db: AsyncSession = Depends(get_db)):
    """Get AI detection settings for a camera."""
    result = await db.execute(select(Camera).where(Camera.id == camera_id))
    camera = result.scalar_one_or_none()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")

    if camera_id in camera_settings:
        return camera_settings[camera_id]

    # Return defaults
    return CameraAISettings(
        confidence_thresholds={
            "human": 0.5, "vehicle": 0.5, "plant": 0.5,
            "bicycle": 0.5, "ppe": 0.6, "fire": 0.4,
            "smoke": 0.4, "accident": 0.5, "intrusion": 0.5, "fall": 0.5,
        },
        enabled_categories=camera.detection_categories or [],
        detection_interval=1,
        max_detections=100,
    )


@router.put("/cameras/{camera_id}/settings", response_model=CameraAISettings)
async def update_camera_ai_settings(
    camera_id: int,
    settings: CameraAISettings,
    db: AsyncSession = Depends(get_db),
):
    """Update AI detection settings for a camera."""
    result = await db.execute(select(Camera).where(Camera.id == camera_id))
    camera = result.scalar_one_or_none()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")

    camera_settings[camera_id] = settings
    return settings
