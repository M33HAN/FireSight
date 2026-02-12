"""
FireSight — Share Service
Creates shareable incident clip links with optional password and expiry.
"""

import uuid
import hashlib
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models import SharedClip, Incident
from app.schemas import ShareCreate, ShareResponse
from app.config import settings


async def create_share(incident_id: int, share: ShareCreate, db: AsyncSession) -> ShareResponse:
    """Create a shareable link for an incident."""
    result = await db.execute(select(Incident).where(Incident.id == incident_id))
    incident = result.scalar_one_or_none()
    if not incident:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Incident not found")

    token = uuid.uuid4().hex[:16]
    expiry = datetime.utcnow() + timedelta(days=share.expiry_days) if share.expiry_days else None
    password_hash = hashlib.sha256(share.password.encode()).hexdigest() if share.password else None

    shared = SharedClip(
        share_token=token,
        incident_id=incident_id,
        clip_path=incident.clip_path,
        thumbnail_path=incident.thumbnail_path,
        expiry=expiry,
        password_hash=password_hash,
    )
    db.add(shared)
    await db.flush()

    return ShareResponse(
        share_token=token,
        share_url=f"{settings.SHARE_BASE_URL}/{token}",
        expiry=expiry,
        password_protected=bool(password_hash),
    )


async def verify_password(token: str, password: str, db: AsyncSession) -> bool:
    """Verify password for a shared clip."""
    result = await db.execute(select(SharedClip).where(SharedClip.share_token == token))
    clip = result.scalar_one_or_none()
    if not clip or not clip.password_hash:
        return False
    return hashlib.sha256(password.encode()).hexdigest() == clip.password_hash
