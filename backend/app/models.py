"""
FireSight — SQLAlchemy ORM Models
Database tables for cameras, incidents, alerts, sessions, and more.
"""

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, JSON, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


# --- Enums ---

class Severity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class IncidentStatus(str, enum.Enum):
    NEW = "new"
    REVIEWING = "reviewing"
    CONFIRMED = "confirmed"
    RESOLVED = "resolved"
    FALSE_ALARM = "false_alarm"


class DetectionCategory(str, enum.Enum):
    HUMAN = "human"
    VEHICLE = "vehicle"
    PLANT = "plant"
    BICYCLE = "bicycle"
    PPE = "ppe"
    FIRE = "fire"
    SMOKE = "smoke"
    ACCIDENT = "accident"
    INTRUSION = "intrusion"
    FALL = "fall"


class AlertType(str, enum.Enum):
    EMAIL = "email"
    SLACK = "slack"
    TEAMS = "teams"
    PAGERDUTY = "pagerduty"
    WEBHOOK = "webhook"


class SessionStatus(str, enum.Enum):
    RUNNING = "running"
    STOPPED = "stopped"
    ERROR = "error"


# --- Models ---

class Camera(Base):
    __tablename__ = "cameras"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    location = Column(String(255), default="")
    stream_url = Column(String(1024), nullable=False)
    is_active = Column(Boolean, default=True)
    detection_enabled = Column(Boolean, default=False)
    detection_categories = Column(JSON, default=list)
    zones = Column(JSON, default=list)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    incidents = relationship("Incident", back_populates="camera")
    detection_sessions = relationship("DetectionSession", back_populates="camera")


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    camera_id = Column(Integer, ForeignKey("cameras.id"), nullable=False)
    category = Column(String(50), nullable=False)
    severity = Column(SQLEnum(Severity), default=Severity.LOW)
    status = Column(SQLEnum(IncidentStatus), default=IncidentStatus.NEW)
    confidence = Column(Float, default=0.0)
    description = Column(Text, default="")
    bbox_data = Column(JSON, default=dict)
    thumbnail_path = Column(String(1024), default="")
    clip_path = Column(String(1024), default="")
    detected_at = Column(DateTime(timezone=True), server_default=func.now())
    reviewed_by = Column(String(255), nullable=True)
    notes = Column(Text, default="")

    camera = relationship("Camera", back_populates="incidents")


class AlertRule(Base):
    __tablename__ = "alert_rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    category = Column(String(50), nullable=False)
    min_severity = Column(SQLEnum(Severity), default=Severity.HIGH)
    alert_type = Column(SQLEnum(AlertType), nullable=False)
    destination = Column(String(1024), nullable=False)
    cooldown_seconds = Column(Integer, default=300)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class DetectionSession(Base):
    __tablename__ = "detection_sessions"

    id = Column(Integer, primary_key=True, index=True)
    camera_id = Column(Integer, ForeignKey("cameras.id"), nullable=False)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    ended_at = Column(DateTime(timezone=True), nullable=True)
    frames_processed = Column(Integer, default=0)
    incidents_detected = Column(Integer, default=0)
    status = Column(SQLEnum(SessionStatus), default=SessionStatus.RUNNING)

    camera = relationship("Camera", back_populates="detection_sessions")


class Site(Base):
    __tablename__ = "sites"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    address = Column(String(1024), default="")
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    timezone = Column(String(100), default="Europe/London")
    contact_name = Column(String(255), default="")
    contact_email = Column(String(255), default="")
    contact_phone = Column(String(50), default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Integration(Base):
    __tablename__ = "integrations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    type = Column(SQLEnum(AlertType), nullable=False)
    destination = Column(String(1024), nullable=False)
    is_active = Column(Boolean, default=True)
    categories = Column(JSON, default=list)
    min_severity = Column(SQLEnum(Severity), default=Severity.HIGH)
    cooldown_seconds = Column(Integer, default=300)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SharedClip(Base):
    __tablename__ = "shared_clips"

    id = Column(Integer, primary_key=True, index=True)
    share_token = Column(String(255), unique=True, index=True, nullable=False)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=False)
    clip_path = Column(String(1024), default="")
    thumbnail_path = Column(String(1024), default="")
    expiry = Column(DateTime(timezone=True), nullable=True)
    password_hash = Column(String(255), nullable=True)
    view_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class DetectionSchedule(Base):
    __tablename__ = "detection_schedules"

    id = Column(Integer, primary_key=True, index=True)
    camera_id = Column(Integer, ForeignKey("cameras.id"), nullable=False)
    days_of_week = Column(JSON, default=list)
    start_time = Column(String(10), nullable=False)
    end_time = Column(String(10), nullable=False)
    categories = Column(JSON, default=list)
    enhanced_sensitivity = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)


class SpeedLog(Base):
    __tablename__ = "speed_logs"

    id = Column(Integer, primary_key=True, index=True)
    camera_id = Column(Integer, ForeignKey("cameras.id"), nullable=False)
    track_id = Column(String(100), nullable=False)
    speed_kmh = Column(Float, nullable=False)
    speed_mph = Column(Float, nullable=False)
    speed_limit = Column(Float, nullable=True)
    is_violation = Column(Boolean, default=False)
    detected_at = Column(DateTime(timezone=True), server_default=func.now())


class DwellLog(Base):
    __tablename__ = "dwell_logs"

    id = Column(Integer, primary_key=True, index=True)
    camera_id = Column(Integer, ForeignKey("cameras.id"), nullable=False)
    zone_name = Column(String(255), nullable=False)
    track_id = Column(String(100), nullable=False)
    entered_at = Column(DateTime(timezone=True), nullable=False)
    departed_at = Column(DateTime(timezone=True), nullable=True)
    dwell_seconds = Column(Float, default=0.0)
    threshold_exceeded = Column(Boolean, default=False)


class CrowdSnapshot(Base):
    __tablename__ = "crowd_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    camera_id = Column(Integer, ForeignKey("cameras.id"), nullable=False)
    people_count = Column(Integer, default=0)
    density_level = Column(String(50), default="low")
    density_per_sqm = Column(Float, default=0.0)
    threshold_exceeded = Column(Boolean, default=False)
    captured_at = Column(DateTime(timezone=True), server_default=func.now())
