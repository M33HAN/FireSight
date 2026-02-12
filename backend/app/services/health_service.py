"""
FireSight — Camera Health Monitoring Service
Checks camera connectivity, FPS, resolution, image quality, blur, and tampering.
"""

import cv2
import numpy as np
from typing import Dict, List, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models import Camera


async def check_all_cameras(db: AsyncSession) -> List[Dict[str, Any]]:
    """Check health status of all cameras."""
    result = await db.execute(select(Camera).where(Camera.is_active == True))
    cameras = result.scalars().all()
    health_reports = []
    for camera in cameras:
        report = await check_camera(camera.id, db)
        health_reports.append(report)
    return health_reports


async def check_camera(camera_id: int, db: AsyncSession) -> Dict[str, Any]:
    """Check health status of a single camera."""
    result = await db.execute(select(Camera).where(Camera.id == camera_id))
    camera = result.scalar_one_or_none()
    if not camera:
        return {"camera_id": camera_id, "status": "not_found"}

    report = {
        "camera_id": camera.id,
        "name": camera.name,
        "stream_url": camera.stream_url,
        "status": "unknown",
        "connected": False,
        "fps": 0,
        "resolution": "N/A",
        "image_quality": "N/A",
        "blur_score": 0,
        "tampering_detected": False,
    }

    try:
        cap = cv2.VideoCapture(camera.stream_url)
        if cap.isOpened():
            report["connected"] = True
            report["status"] = "online"
            report["fps"] = round(cap.get(cv2.CAP_PROP_FPS), 1)
            w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            report["resolution"] = f"{w}x{h}"

            ret, frame = cap.read()
            if ret and frame is not None:
                report["blur_score"] = _calculate_blur(frame)
                report["image_quality"] = _assess_quality(frame)
                report["tampering_detected"] = _check_tampering(frame)

            cap.release()
        else:
            report["status"] = "offline"
    except Exception as e:
        report["status"] = "error"
        report["error"] = str(e)

    return report


def _calculate_blur(frame: np.ndarray) -> float:
    """Calculate blur score using Laplacian variance."""
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    return round(cv2.Laplacian(gray, cv2.CV_64F).var(), 2)


def _assess_quality(frame: np.ndarray) -> str:
    """Assess image quality based on blur and brightness."""
    blur = _calculate_blur(frame)
    brightness = np.mean(frame)
    if blur < 50:
        return "poor"
    elif blur < 200:
        return "fair"
    elif brightness < 30 or brightness > 240:
        return "fair"
    else:
        return "good"


def _check_tampering(frame: np.ndarray) -> bool:
    """Basic tampering detection (fully black/white frame)."""
    mean = np.mean(frame)
    std = np.std(frame)
    if mean < 5 or mean > 250:
        return True
    if std < 3:
        return True
    return False
