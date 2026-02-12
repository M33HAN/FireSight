"""
FireSight — Report Generation Endpoints (PDF/CSV)
"""

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import datetime

from app.database import get_db

router = APIRouter()


@router.get("/summary")
async def report_summary(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    camera_id: Optional[int] = None,
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Get report summary with statistics."""
    from app.services.report_service import generate_summary
    return await generate_summary(db, start_date, end_date, camera_id, category)


@router.get("/export/csv")
async def export_csv(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    camera_id: Optional[int] = None,
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Export incidents as CSV."""
    from app.services.report_service import generate_csv
    csv_data = await generate_csv(db, start_date, end_date, camera_id, category)
    return StreamingResponse(
        iter([csv_data]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=firesight_report.csv"},
    )


@router.get("/export/pdf")
async def export_pdf(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    camera_id: Optional[int] = None,
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Export incidents as branded PDF report."""
    from app.services.report_service import generate_pdf
    pdf_bytes = await generate_pdf(db, start_date, end_date, camera_id, category)
    return StreamingResponse(
        iter([pdf_bytes]),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=firesight_report.pdf"},
    )
