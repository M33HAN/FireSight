"""
FireSight — WebSocket Live Detection Feed
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List
import json

router = APIRouter()

# Track active WebSocket connections per camera
connections: Dict[int, List[WebSocket]] = {}


@router.websocket("/live/{camera_id}")
async def live_detection_feed(websocket: WebSocket, camera_id: int):
    """
    WebSocket endpoint for live detection feed.
    Streams real-time detection results and annotated frames.
    """
    await websocket.accept()

    # Add to connections
    if camera_id not in connections:
        connections[camera_id] = []
    connections[camera_id].append(websocket)

    try:
        while True:
            # Receive any control messages from client
            data = await websocket.receive_text()
            message = json.loads(data)

            if message.get("type") == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        # Remove from connections
        if camera_id in connections:
            connections[camera_id].remove(websocket)
            if not connections[camera_id]:
                del connections[camera_id]


async def broadcast_detection(camera_id: int, detection_data: dict):
    """Broadcast detection results to all connected clients for a camera."""
    if camera_id not in connections:
        return

    disconnected = []
    for ws in connections[camera_id]:
        try:
            await ws.send_json(detection_data)
        except Exception:
            disconnected.append(ws)

    # Clean up disconnected clients
    for ws in disconnected:
        connections[camera_id].remove(ws)
