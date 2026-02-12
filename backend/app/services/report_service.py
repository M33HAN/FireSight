"""
FireSight — Report Service
Generates PDF and CSV reports with branded formatting.
"""

import io
import csv
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models import Incident


async def generate_summary(db: AsyncSession, start_date=None, end_date=None, camera_id=None, category=None):
    """Generate report summary statistics."""
    query = select(Incident)
    if start_date:
        query = query.where(Incident.detected_at >= start_date)
    if end_date:
        query = query.where(Incident.detected_at <= end_date)
    if camera_id:
        query = query.where(Incident.camera_id == camera_id)
    if category:
        query = query.where(Incident.category == category)

    result = await db.execute(query)
    incidents = result.scalars().all()

    by_category = {}
    by_severity = {}
    by_camera = {}
    for inc in incidents:
        by_category[inc.category] = by_category.get(inc.category, 0) + 1
        by_severity[str(inc.severity)] = by_severity.get(str(inc.severity), 0) + 1
        cam_key = str(inc.camera_id)
        by_camera[cam_key] = by_camera.get(cam_key, 0) + 1

    return {
        "total_incidents": len(incidents),
        "period_start": start_date or "all",
        "period_end": end_date or "all",
        "by_category": by_category,
        "by_severity": by_severity,
        "by_camera": by_camera,
    }


async def generate_csv(db: AsyncSession, start_date=None, end_date=None, camera_id=None, category=None) -> str:
    """Generate CSV report of incidents."""
    query = select(Incident).order_by(Incident.detected_at.desc())
    if start_date:
        query = query.where(Incident.detected_at >= start_date)
    if end_date:
        query = query.where(Incident.detected_at <= end_date)
    if camera_id:
        query = query.where(Incident.camera_id == camera_id)
    if category:
        query = query.where(Incident.category == category)

    result = await db.execute(query)
    incidents = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Camera", "Category", "Severity", "Status", "Confidence", "Detected At", "Description"])

    for inc in incidents:
        writer.writerow([
            inc.id, inc.camera_id, inc.category, str(inc.severity),
            str(inc.status), f"{inc.confidence:.2f}", str(inc.detected_at), inc.description,
        ])

    return output.getvalue()


async def generate_pdf(db: AsyncSession, start_date=None, end_date=None, camera_id=None, category=None) -> bytes:
    """Generate branded PDF report."""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = []

    # Title
    title_style = styles["Title"]
    elements.append(Paragraph("FireSight Incident Report", title_style))
    elements.append(Paragraph("AI Video Analytics by Firewire Networks Ltd", styles["Normal"]))
    elements.append(Spacer(1, 20))

    # Get data
    summary = await generate_summary(db, start_date, end_date, camera_id, category)
    elements.append(Paragraph(f"Total Incidents: {summary['total_incidents']}", styles["Normal"]))
    elements.append(Spacer(1, 12))

    # Category breakdown table
    if summary["by_category"]:
        data = [["Category", "Count"]]
        for cat, count in summary["by_category"].items():
            data.append([cat.title(), str(count)])

        table = Table(data)
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#FF6B00")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 1, colors.grey),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
        ]))
        elements.append(table)

    elements.append(Spacer(1, 20))
    elements.append(Paragraph(
        f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}",
        styles["Normal"],
    ))

    doc.build(elements)
    return buffer.getvalue()
