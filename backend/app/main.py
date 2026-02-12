"""
FireSight — FastAPI Application Entry Point
AI Video Analytics Platform by Firewire Networks Ltd
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import engine, Base
from app.routers import cameras, incidents, detection, reports, websocket, features, settings as settings_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle manager."""
    # Startup: create database tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("🔥 FireSight AI Video Analytics Platform started")
    print(f"   Version: {settings.APP_VERSION}")
    print(f"   Environment: {settings.ENVIRONMENT}")
    yield
    # Shutdown
    print("🔥 FireSight shutting down...")


app = FastAPI(
    title="FireSight API",
    description="AI Video Analytics Platform by Firewire Networks Ltd",
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(cameras.router, prefix="/api/cameras", tags=["cameras"])
app.include_router(incidents.router, prefix="/api/incidents", tags=["incidents"])
app.include_router(detection.router, prefix="/api/detection", tags=["detection"])
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])
app.include_router(websocket.router, prefix="/ws", tags=["websocket"])
app.include_router(features.router, prefix="/api/features", tags=["features"])
app.include_router(settings_router.router, prefix="/api/settings", tags=["settings"])


@app.get("/")
async def root():
    return {
        "name": "FireSight",
        "tagline": "AI Video Analytics",
        "version": settings.APP_VERSION,
        "company": "Firewire Networks Ltd",
        "status": "running",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "firesight-api"}
