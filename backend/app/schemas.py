"""
FireSight — Pydantic Request/Response Schemas
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models import Severity, IncidentStatus, DetectionCategory, AlertType


# --- Camera Schemas ---

class CameraCreate(BaseModel):
    name: str
    location: str = ""
    stream_url: str
    detection_categories: List[str] = []
    zones: List[Dict[str, Any]] = []
    site_id: Optional[int] = None


class CameraUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    stream_url: Optional[str] = None
    is_active: Optional[bool] = None
    detection_enabled: Optional[bool] = None
    detection_categories: Optional[List[str]] = None
    zones: Optional[List[Dict[str, Any]]] = None


class CameraResponse(BaseModel):
    id: int
    name: str
    location: str
    stream_url: str
    is_active: bool
    detection_enabled: bool
    detection_categories: List[str]
    zones: List[Dict[str, Any]]
    site_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


# --- Incident Schemas ---

class IncidentResponse(BaseModel):
    id: int
    camera_id: int
    category: str
    severity: Severity
    status: IncidentStatus
    confidence: float
    description: str
    bbox_data: Dict[str, Any]
    thumbnail_path: str
    clip_path: str
    detected_at: datetime
    reviewed_by: Optional[str]
    notes: str

    class Config:
        from_attributes = True


class IncidentUpdate(BaseModel):
    status: Optional[IncidentStatus] = None
    reviewed_by: Optional[str] = None
    notes: Optional[str] = None


class DashboardStats(BaseModel):
    total_incidents: int
    incidents_today: int
    active_cameras: int
    detection_sessions: int
    category_breakdown: Dict[str, int]
    severity_breakdown: Dict[str, int]
    hourly_data: List[Dict[str, Any]]


# --- Detection Schemas ---

class DetectionResult(BaseModel):
    category: str
    confidence: float
    bbox: List[float]
    track_id: Optional[str] = None
    severity: Severity = Severity.LOW


class DetectionFrame(BaseModel):
    frame_number: int
    timestamp: float
    detections: List[DetectionResult]
    frame_base64: Optional[str] = None


# --- Alert Schemas ---

class AlertRuleCreate(BaseModel):
    name: str
    category: str
    min_severity: Severity = Severity.HIGH
    alert_type: AlertType
    destination: str
    cooldown_seconds: int = 300


# --- Report Schemas ---

class ReportSummary(BaseModel):
    total_incidents: int
    period_start: datetime
    period_end: datetime
    by_category: Dict[str, int]
    by_severity: Dict[str, int]
    by_camera: Dict[str, int]
    top_incidents: List[IncidentResponse]


# --- Share Schemas ---

class ShareCreate(BaseModel):
    expiry_days: int = 7
    password: Optional[str] = None


class ShareResponse(BaseModel):
    share_token: str
    share_url: str
    expiry: Optional[datetime]
    password_protected: bool


# --- Settings Schemas ---

class CameraAISettings(BaseModel):
    confidence_thresholds: Dict[str, float] = {}
    enabled_categories: List[str] = []
    detection_interval: int = 1
    max_detections: int = 100
