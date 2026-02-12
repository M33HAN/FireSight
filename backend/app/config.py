"""
FireSight — Configuration Settings
"""

from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    APP_NAME: str = "FireSight"
    APP_VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://firesight:firesight@localhost:5432/firesight"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # MinIO / S3 Object Storage
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET: str = "firesight"
    MINIO_SECURE: bool = False

    # YOLO Models
    YOLO_GENERAL_MODEL: str = "yolov8m.pt"
    YOLO_FIRE_SMOKE_MODEL: str = "models/fire_smoke.pt"
    YOLO_PPE_MODEL: str = "models/ppe.pt"
    YOLO_PLANT_MODEL: str = "models/plant.pt"
    YOLO_PLATE_MODEL: str = "models/plate_detect.pt"

    # Detection Settings
    DEFAULT_CONFIDENCE: float = 0.5
    DEFAULT_IOU_THRESHOLD: float = 0.45
    MAX_DETECTIONS_PER_FRAME: int = 100

    # Alert Settings
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "alerts@firesight.ai"
    SLACK_WEBHOOK_URL: str = ""
    TEAMS_WEBHOOK_URL: str = ""
    PAGERDUTY_API_KEY: str = ""

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8000"]

    # Storage
    CLIP_STORAGE_PATH: str = "./storage/clips"
    THUMBNAIL_STORAGE_PATH: str = "./storage/thumbnails"
    HEATMAP_STORAGE_PATH: str = "./storage/heatmaps"
    REPORT_STORAGE_PATH: str = "./storage/reports"

    # Share Settings
    SHARE_BASE_URL: str = "http://localhost:3000/shared"
    SHARE_DEFAULT_EXPIRY_DAYS: int = 7

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
