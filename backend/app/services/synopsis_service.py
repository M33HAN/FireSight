"""
FireSight — Video Synopsis Service
Condenses hours of footage into short event-only summaries.
"""

import cv2
from typing import List, Dict, Any
from app.config import settings


async def create_synopsis(video_path: str, incidents: List[Dict]) -> str:
    """Create a video synopsis containing only frames with detected events."""
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Cannot open video: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    import os
    os.makedirs(settings.CLIP_STORAGE_PATH, exist_ok=True)
    output_path = video_path.replace(".mp4", "_synopsis.mp4")
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    # Extract event frames with context (2 seconds before/after)
    event_frames = set()
    context_frames = int(fps * 2)
    for inc in incidents:
        frame_num = inc.get("frame", 0)
        for f in range(max(0, frame_num - context_frames), frame_num + context_frames):
            event_frames.add(f)

    frame_idx = 0
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        if frame_idx in event_frames:
            writer.write(frame)
        frame_idx += 1

    cap.release()
    writer.release()
    return output_path
