"""
FireSight — Video Utilities
Helper functions for video stream handling, frame extraction, and encoding.
"""

import cv2
import numpy as np
import asyncio
import logging
from typing import Optional, Tuple, Generator, AsyncGenerator
from pathlib import Path

logger = logging.getLogger(__name__)


def open_video_stream(source: str, timeout: int = 10) -> Optional[cv2.VideoCapture]:
    """Open a video stream from RTSP URL, file path, or device index."""
    try:
        if source.isdigit():
            cap = cv2.VideoCapture(int(source))
        else:
            cap = cv2.VideoCapture(source, cv2.CAP_FFMPEG)
        
        if not cap.isOpened():
            logger.error(f"Failed to open video source: {source}")
            return None
        
        # Set buffer size to reduce latency for RTSP streams
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        
        return cap
    except Exception as e:
        logger.error(f"Error opening video source {source}: {e}")
        return None


def get_stream_info(cap: cv2.VideoCapture) -> dict:
    """Get video stream metadata."""
    return {
        "width": int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)),
        "height": int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)),
        "fps": cap.get(cv2.CAP_PROP_FPS),
        "frame_count": int(cap.get(cv2.CAP_PROP_FRAME_COUNT)),
        "codec": int(cap.get(cv2.CAP_PROP_FOURCC)),
    }


def read_frame(cap: cv2.VideoCapture) -> Optional[np.ndarray]:
    """Read a single frame from video capture."""
    ret, frame = cap.read()
    if not ret:
        return None
    return frame


def frame_generator(cap: cv2.VideoCapture, skip_frames: int = 0) -> Generator[np.ndarray, None, None]:
    """Generate frames from a video capture, optionally skipping frames."""
    frame_count = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frame_count += 1
        if skip_frames > 0 and frame_count % (skip_frames + 1) != 0:
            continue
        yield frame


async def async_frame_generator(source: str, target_fps: float = 15.0) -> AsyncGenerator[np.ndarray, None]:
    """Async generator that yields frames at a target FPS."""
    cap = open_video_stream(source)
    if cap is None:
        return
    
    delay = 1.0 / target_fps
    try:
        while True:
            frame = read_frame(cap)
            if frame is None:
                break
            yield frame
            await asyncio.sleep(delay)
    finally:
        cap.release()


def resize_frame(frame: np.ndarray, width: int = 640, height: Optional[int] = None) -> np.ndarray:
    """Resize a frame maintaining aspect ratio."""
    h, w = frame.shape[:2]
    if height is None:
        ratio = width / w
        height = int(h * ratio)
    return cv2.resize(frame, (width, height), interpolation=cv2.INTER_LINEAR)


def encode_frame_jpeg(frame: np.ndarray, quality: int = 85) -> bytes:
    """Encode a frame as JPEG bytes."""
    params = [cv2.IMWRITE_JPEG_QUALITY, quality]
    _, buffer = cv2.imencode('.jpg', frame, params)
    return buffer.tobytes()


def encode_frame_png(frame: np.ndarray) -> bytes:
    """Encode a frame as PNG bytes."""
    _, buffer = cv2.imencode('.png', frame)
    return buffer.tobytes()


def draw_detections(frame: np.ndarray, detections: list, 
                    color_map: Optional[dict] = None) -> np.ndarray:
    """Draw bounding boxes and labels on a frame."""
    default_colors = {
        "human": (0, 255, 0),
        "vehicle": (255, 165, 0),
        "fire": (0, 0, 255),
        "smoke": (128, 128, 128),
        "bicycle": (255, 255, 0),
        "plant": (0, 200, 0),
        "ppe": (255, 0, 255),
        "accident": (0, 0, 255),
        "intrusion": (255, 0, 0),
        "fall": (0, 128, 255),
    }
    colors = color_map or default_colors
    annotated = frame.copy()
    
    for det in detections:
        category = det.get("category", "unknown")
        confidence = det.get("confidence", 0)
        bbox = det.get("bbox", {})
        
        x1 = int(bbox.get("x1", 0))
        y1 = int(bbox.get("y1", 0))
        x2 = int(bbox.get("x2", 0))
        y2 = int(bbox.get("y2", 0))
        
        color = colors.get(category, (255, 255, 255))
        
        # Draw bounding box
        cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)
        
        # Draw label background
        label = f"{category} {confidence:.0%}"
        (label_w, label_h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
        cv2.rectangle(annotated, (x1, y1 - label_h - 10), (x1 + label_w + 10, y1), color, -1)
        
        # Draw label text
        cv2.putText(annotated, label, (x1 + 5, y1 - 5),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1)
    
    return annotated


def draw_zones(frame: np.ndarray, zones: list, alpha: float = 0.3) -> np.ndarray:
    """Draw detection zones as transparent overlays."""
    overlay = frame.copy()
    
    for zone in zones:
        points = np.array(zone.get("points", []), dtype=np.int32)
        color = tuple(zone.get("color", [0, 255, 0]))
        
        if len(points) >= 3:
            cv2.fillPoly(overlay, [points], color)
            cv2.polylines(frame, [points], True, color, 2)
    
    return cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0)


def extract_thumbnail(frame: np.ndarray, bbox: dict, padding: int = 20) -> np.ndarray:
    """Extract a thumbnail crop from a frame given a bounding box."""
    h, w = frame.shape[:2]
    x1 = max(0, int(bbox.get("x1", 0)) - padding)
    y1 = max(0, int(bbox.get("y1", 0)) - padding)
    x2 = min(w, int(bbox.get("x2", 0)) + padding)
    y2 = min(h, int(bbox.get("y2", 0)) + padding)
    return frame[y1:y2, x1:x2]


def create_mosaic(frames: list, grid_cols: int = 2, cell_size: Tuple[int, int] = (640, 480)) -> np.ndarray:
    """Create a mosaic/grid view from multiple camera frames."""
    n = len(frames)
    if n == 0:
        return np.zeros((cell_size[1], cell_size[0], 3), dtype=np.uint8)
    
    grid_rows = (n + grid_cols - 1) // grid_cols
    mosaic = np.zeros((grid_rows * cell_size[1], grid_cols * cell_size[0], 3), dtype=np.uint8)
    
    for i, frame in enumerate(frames):
        row = i // grid_cols
        col = i % grid_cols
        resized = cv2.resize(frame, cell_size)
        y_start = row * cell_size[1]
        x_start = col * cell_size[0]
        mosaic[y_start:y_start + cell_size[1], x_start:x_start + cell_size[0]] = resized
    
    return mosaic


def save_frame(frame: np.ndarray, path: str, quality: int = 95) -> bool:
    """Save a frame to disk."""
    try:
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        if path.endswith('.jpg') or path.endswith('.jpeg'):
            cv2.imwrite(path, frame, [cv2.IMWRITE_JPEG_QUALITY, quality])
        else:
            cv2.imwrite(path, frame)
        return True
    except Exception as e:
        logger.error(f"Failed to save frame to {path}: {e}")
        return False


def generate_mjpeg_stream(cap: cv2.VideoCapture, quality: int = 70) -> Generator[bytes, None, None]:
    """Generate MJPEG stream bytes for HTTP streaming."""
    while True:
        frame = read_frame(cap)
        if frame is None:
            break
        jpeg = encode_frame_jpeg(frame, quality)
        yield (
            b"--frame\r\n"
            b"Content-Type: image/jpeg\r\n"
            b"Content-Length: " + str(len(jpeg)).encode() + b"\r\n"
            b"\r\n" + jpeg + b"\r\n"
        )
