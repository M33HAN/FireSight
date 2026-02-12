"""
FireSight — Detection Start/Stop & Video Analysis Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import Camera, DetectionSession, SessionStatus

router = APIRouter()

# In-memory tracking of active detection sessions
active_sessions = {}


@router.post("/start/{camera_id}")
async def start_detection(
    camera_id: int,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Start live AI detection on a camera."""
    result = await db.execute(select(Camera).where(Camera.id == camera_id))
    camera = result.scalar_one_or_none()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")

    if camera_id in active_sessions:
        raise HTTPException(status_code=400, detail="Detection already running for this camera")

    # Create detection session record
    session = DetectionSession(camera_id=camera_id, status=SessionStatus.RUNNING)
    db.add(session)
    await db.flush()
    await db.refresh(session)

    # Enable detection on camera
    camera.detection_enabled = True
    active_sessions[camera_id] = session.id

    # Start detection in background
    background_tasks.add_task(run_detection, camera_id, session.id)

    return {
        "message": f"Detection started on camera {camera.name}",
        "session_id": session.id,
        "camera_id": camera_id,
    }


@router.post("/stop/{camera_id}")
async def stop_detection(camera_id: int, db: AsyncSession = Depends(get_db)):
    """Stop live AI detection on a camera."""
    if camera_id not in active_sessions:
        raise HTTPException(status_code=400, detail="No active detection for this camera")

    session_id = active_sessions.pop(camera_id)

    # Update camera
    result = await db.execute(select(Camera).where(Camera.id == camera_id))
    camera = result.scalar_one_or_none()
    if camera:
        camera.detection_enabled = False

    # Update session
    session_result = await db.execute(
        select(DetectionSession).where(DetectionSession.id == session_id)
    )
    session = session_result.scalar_one_or_none()
    if session:
        session.status = SessionStatus.STOPPED
        from datetime import datetime
        session.ended_at = datetime.utcnow()

    return {"message": f"Detection stopped", "session_id": session_id}


@router.post("/analyse-video")
async def analyse_video(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None,
    db: AsyncSession = Depends(get_db),
):
    """Upload and analyse a video file."""
    if not file.filename.endswith((".mp4", ".avi", ".mov", ".mkv")):
        raise HTTPException(status_code=400, detail="Unsupported video format")

    # Save uploaded file
    from app.services.clip_service import save_upload
    video_path = await save_upload(file)

    # Run analysis in background
    from app.detection.engine import DetectionEngine
    engine = DetectionEngine()
    results = await engine.analyse_video(video_path, db)

    return {
        "message": "Video analysis complete",
        "video_path": video_path,
        "incidents_detected": len(results),
        "results": results,
    }


@router.get("/status")
async def detection_status():
    """Get status of all active detection sessions."""
    return {
        "active_sessions": len(active_sessions),
        "cameras": list(active_sessions.keys()),
    }


async def run_detection(camera_id: int, session_id: int):
    """Background task to run detection on a camera stream."""
    from app.detection.engine import DetectionEngine
    engine = DetectionEngine()
    await engine.run_live(camera_id, session_id)
