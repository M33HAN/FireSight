"""
FireSight — Clip Service
Saves incident clips and thumbnails from video streams.
"""

import cv2
import os
import uuid
from datetime import datetime
from typing import Optional
from fastapi import UploadFile

from app.config import settings


async def save_upload(file: UploadFile) -> str:
    """Save an uploaded video file and return the path."""
    os.makedirs(settings.CLIP_STORAGE_PATH, exist_ok=True)
    filename = f"{uuid.uuid4().hex}_{file.filename}"
    path = os.path.join(settings.CLIP_STORAGE_PATH, filename)

    with open(path, "wb") as f:
        content = await file.read()
        f.write(content)

    return path


def save_thumbnail(frame, incident_id: int) -> str:
    """Save a frame as a thumbnail image."""
    os.makedirs(settings.THUMBNAIL_STORAGE_PATH, exist_ok=True)
    filename = f"thumb_{incident_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.jpg"
    path = os.path.join(settings.THUMBNAIL_STORAGE_PATH, filename)
    cv2.imwrite(path, frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
    return path


def save_clip(frames: list, fps: float, incident_id: int) -> str:
    """Save a list of frames as a video clip."""
    os.makedirs(settings.CLIP_STORAGE_PATH, exist_ok=True)
    filename = f"clip_{incident_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.mp4"
    path = os.path.join(settings.CLIP_STORAGE_PATH, filename)

    if not frames:
        return ""

    h, w = frames[0].shape[:2]
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(path, fourcc, fps, (w, h))

    for frame in frames:
        writer.write(frame)

    writer.release()
    return path


def draw_detections(frame, detections: list):
    """Draw bounding boxes and labels on a frame."""
    colors = {
        "human": (247, 195, 79), "vehicle": (132, 199, 129),
        "plant": (255, 180, 77), "fire": (80, 83, 239),
        "smoke": (197, 190, 176), "ppe": (101, 138, 255),
        "intrusion": (38, 167, 255), "fall": (47, 47, 211),
        "accident": (57, 57, 229), "bicycle": (216, 147, 206),
    }

    for det in detections:
        bbox = [int(c) for c in det["bbox"]]
        category = det.get("category", "unknown")
        conf = det.get("confidence", 0)
        color = colors.get(category, (255, 255, 255))

        cv2.rectangle(frame, (bbox[0], bbox[1]), (bbox[2], bbox[3]), color, 2)
        label = f"{category} {conf:.0%}"
        cv2.putText(frame, label, (bbox[0], bbox[1] - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

    return frame
