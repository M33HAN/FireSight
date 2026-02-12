"""
FireSight — Heatmap Service
Generates activity heatmaps from incident detection data.
"""

import numpy as np
import cv2
import os
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models import Incident
from app.config import settings


async def create_heatmap(camera_id: int, db: AsyncSession) -> Dict[str, Any]:
    """Generate an activity heatmap for a camera based on detection locations."""
    result = await db.execute(
        select(Incident).where(Incident.camera_id == camera_id).order_by(Incident.detected_at.desc()).limit(1000)
    )
    incidents = result.scalars().all()

    if not incidents:
        return {"camera_id": camera_id, "message": "No incidents to generate heatmap", "data": []}

    # Create heatmap matrix (normalize to standard resolution)
    width, height = 1920, 1080
    heatmap = np.zeros((height, width), dtype=np.float32)

    for inc in incidents:
        bbox = inc.bbox_data
        if bbox and isinstance(bbox, dict):
            cx = int((bbox.get("x1", 0) + bbox.get("x2", 0)) / 2)
            cy = int((bbox.get("y1", 0) + bbox.get("y2", 0)) / 2)
            cx = min(max(cx, 0), width - 1)
            cy = min(max(cy, 0), height - 1)
            cv2.circle(heatmap, (cx, cy), 40, 1.0, -1)

    # Normalize and apply Gaussian blur
    if heatmap.max() > 0:
        heatmap = heatmap / heatmap.max()
    heatmap = cv2.GaussianBlur(heatmap, (99, 99), 0)

    # Save as image
    heatmap_colored = cv2.applyColorMap((heatmap * 255).astype(np.uint8), cv2.COLORMAP_JET)
    os.makedirs(settings.HEATMAP_STORAGE_PATH, exist_ok=True)
    filename = f"heatmap_cam{camera_id}.jpg"
    path = os.path.join(settings.HEATMAP_STORAGE_PATH, filename)
    cv2.imwrite(path, heatmap_colored)

    # Convert to grid data for frontend overlay
    grid_size = 20
    grid_h, grid_w = height // grid_size, width // grid_size
    grid_data = []
    for gy in range(grid_h):
        for gx in range(grid_w):
            region = heatmap[gy * grid_size:(gy + 1) * grid_size, gx * grid_size:(gx + 1) * grid_size]
            intensity = float(np.mean(region))
            if intensity > 0.01:
                grid_data.append({"x": gx, "y": gy, "intensity": round(intensity, 3)})

    return {
        "camera_id": camera_id,
        "total_incidents": len(incidents),
        "heatmap_path": path,
        "grid_data": grid_data,
        "grid_size": grid_size,
        "resolution": {"width": width, "height": height},
    }
