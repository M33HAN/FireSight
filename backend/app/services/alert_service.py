"""
FireSight — Alert Service
Sends alerts via email, Slack, Teams, PagerDuty, and webhooks.
"""

import httpx
from typing import Dict, Any, Optional
from datetime import datetime, timedelta

from app.config import settings


# Cooldown tracking to prevent alert spam
_last_alert: Dict[str, datetime] = {}


async def send_alert(incident: Dict[str, Any], alert_type: str, destination: str, cooldown: int = 300):
    """Send an alert for a detected incident."""
    cooldown_key = f"{alert_type}_{destination}_{incident.get('category')}"
    now = datetime.utcnow()

    if cooldown_key in _last_alert:
        if (now - _last_alert[cooldown_key]).total_seconds() < cooldown:
            return False

    _last_alert[cooldown_key] = now

    handlers = {
        "email": _send_email_alert,
        "slack": _send_slack_alert,
        "teams": _send_teams_alert,
        "pagerduty": _send_pagerduty_alert,
        "webhook": _send_webhook_alert,
    }

    handler = handlers.get(alert_type)
    if handler:
        await handler(incident, destination)
        return True
    return False


async def _send_email_alert(incident: Dict, destination: str):
    """Send branded HTML email alert."""
    if not settings.SMTP_HOST:
        print(f"  Email alert skipped (SMTP not configured): {destination}")
        return

    subject = f"[FireSight] {incident['severity'].upper()}: {incident['category']} detected"
    html_body = _build_email_html(incident)

    try:
        import aiosmtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart

        msg = MIMEMultipart("alternative")
        msg["From"] = settings.SMTP_FROM_EMAIL
        msg["To"] = destination
        msg["Subject"] = subject
        msg.attach(MIMEText(html_body, "html"))

        await aiosmtplib.send(
            msg, hostname=settings.SMTP_HOST, port=settings.SMTP_PORT,
            username=settings.SMTP_USER, password=settings.SMTP_PASSWORD,
            use_tls=True,
        )
    except Exception as e:
        print(f"  Email alert error: {e}")


async def _send_slack_alert(incident: Dict, webhook_url: str):
    """Send Slack webhook alert."""
    payload = {
        "text": f":rotating_light: *FireSight Alert*",
        "blocks": [{
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": (
                    f"*{incident['severity'].upper()}*: {incident['category']} detected\n"
                    f"Camera: {incident.get('camera_id', 'N/A')}\n"
                    f"Confidence: {incident.get('confidence', 0):.1%}\n"
                    f"Time: {incident.get('detected_at', datetime.utcnow().isoformat())}"
                ),
            },
        }],
    }
    async with httpx.AsyncClient() as client:
        await client.post(webhook_url, json=payload, timeout=10)


async def _send_teams_alert(incident: Dict, webhook_url: str):
    """Send Microsoft Teams webhook alert."""
    payload = {
        "@type": "MessageCard",
        "themeColor": "FF6B00",
        "summary": f"FireSight: {incident['category']} detected",
        "sections": [{
            "activityTitle": f"FireSight Alert - {incident['severity'].upper()}",
            "facts": [
                {"name": "Category", "value": incident["category"]},
                {"name": "Severity", "value": incident["severity"]},
                {"name": "Confidence", "value": f"{incident.get('confidence', 0):.1%}"},
            ],
        }],
    }
    async with httpx.AsyncClient() as client:
        await client.post(webhook_url, json=payload, timeout=10)


async def _send_pagerduty_alert(incident: Dict, routing_key: str):
    """Send PagerDuty event."""
    payload = {
        "routing_key": routing_key,
        "event_action": "trigger",
        "payload": {
            "summary": f"FireSight: {incident['category']} - {incident['severity']}",
            "severity": "critical" if incident["severity"] == "critical" else "warning",
            "source": "FireSight AI",
        },
    }
    async with httpx.AsyncClient() as client:
        await client.post("https://events.pagerduty.com/v2/enqueue", json=payload, timeout=10)


async def _send_webhook_alert(incident: Dict, url: str):
    """Send generic POST webhook."""
    payload = {
        "source": "firesight",
        "event": "incident_detected",
        "data": incident,
        "timestamp": datetime.utcnow().isoformat(),
    }
    async with httpx.AsyncClient() as client:
        await client.post(url, json=payload, timeout=10)


def _build_email_html(incident: Dict) -> str:
    """Build branded FireSight HTML email."""
    return f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1A1A2E;color:#fff;padding:30px;border-radius:12px;">
        <h1 style="color:#FF6B00;">FireSight Alert</h1>
        <div style="background:#16213E;padding:20px;border-radius:8px;margin:20px 0;">
            <h2 style="color:#FF6B00;margin-top:0;">{incident['severity'].upper()}: {incident['category'].title()}</h2>
            <p>Confidence: {incident.get('confidence', 0):.1%}</p>
            <p>Camera: {incident.get('camera_id', 'N/A')}</p>
            <p>Time: {incident.get('detected_at', 'N/A')}</p>
        </div>
        <p style="color:#999;font-size:12px;">FireSight AI Video Analytics by Firewire Networks Ltd</p>
    </div>
    """
