"""
FireSight — Camera CRUD Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.database import get_db
from app.models import Camera
from app.schemas import CameraCreate, CameraUpdate, CameraResponse

router = APIRouter()


@router.get("/", response_model=List[CameraResponse])
async def list_cameras(db: AsyncSession = Depends(get_db)):
    """List all cameras."""
    result = await db.execute(select(Camera).order_by(Camera.id))
    cameras = result.scalars().all()
    return cameras


@router.post("/", response_model=CameraResponse)
async def create_camera(camera: CameraCreate, db: AsyncSession = Depends(get_db)):
    """Add a new camera."""
    db_camera = Camera(**camera.model_dump())
    db.add(db_camera)
    await db.flush()
    await db.refresh(db_camera)
    return db_camera


@router.get("/{camera_id}", response_model=CameraResponse)
async def get_camera(camera_id: int, db: AsyncSession = Depends(get_db)):
    """Get a single camera by ID."""
    result = await db.execute(select(Camera).where(Camera.id == camera_id))
    camera = result.scalar_one_or_none()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    return camera


@router.put("/{camera_id}", response_model=CameraResponse)
async def update_camera(camera_id: int, update: CameraUpdate, db: AsyncSession = Depends(get_db)):
    """Update a camera."""
    result = await db.execute(select(Camera).where(Camera.id == camera_id))
    camera = result.scalar_one_or_none()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")

    update_data = update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(camera, field, value)

    await db.flush()
    await db.refresh(camera)
    return camera


@router.delete("/{camera_id}")
async def delete_camera(camera_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a camera."""
    result = await db.execute(select(Camera).where(Camera.id == camera_id))
    camera = result.scalar_one_or_none()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")

    await db.delete(camera)
    return {"message": f"Camera {camera_id} deleted"}


@router.post("/{camera_id}/toggle")
async def toggle_detection(camera_id: int, db: AsyncSession = Depends(get_db)):
    """Toggle AI detection on/off for a camera."""
    result = await db.execute(select(Camera).where(Camera.id == camera_id))
    camera = result.scalar_one_or_none()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")

    camera.detection_enabled = not camera.detection_enabled
    await db.flush()
    return {
        "camera_id": camera_id,
        "detection_enabled": camera.detection_enabled,
    }
