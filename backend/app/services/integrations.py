"""
FireSight — Integrations Service
Third-party integrations: Slack, Teams, generic webhooks, SMTP email.
"""

import httpx
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, Dict, Any, List
from app.config import settings

logger = logging.getLogger(__name__)


class SlackIntegration:
    """Send alerts and notifications to Slack channels."""
    
    def __init__(self, webhook_url: str):
        self.webhook_url = webhook_url
    
    async def send_alert(self, category: str, severity: str, camera_name: str,
                         confidence: float, thumbnail_url: Optional[str] = None) -> bool:
        """Send an incident alert to Slack."""
        severity_emoji = {"critical": ":rotating_light:", "high": ":warning:", "medium": ":large_orange_diamond:", "low": ":information_source:"}.get(severity, ":bell:")
        
        payload = {
            "blocks": [
                {
                    "type": "header",
                    "text": {"type": "plain_text", "text": f"{severity_emoji} FireSight Alert: {category}"}
                },
                {
                    "type": "section",
                    "fields": [
                        {"type": "mrkdwn", "text": f"*Camera:*\n{camera_name}"},
                        {"type": "mrkdwn", "text": f"*Severity:*\n{severity.upper()}"},
                        {"type": "mrkdwn", "text": f"*Confidence:*\n{confidence:.1%}"},
                        {"type": "mrkdwn", "text": f"*Category:*\n{category}"},
                    ]
                }
            ]
        }
        
        if thumbnail_url:
            payload["blocks"].append({
                "type": "image",
                "image_url": thumbnail_url,
                "alt_text": f"Detection thumbnail for {category}"
            })
        
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(self.webhook_url, json=payload, timeout=10)
                resp.raise_for_status()
                return True
        except Exception as e:
            logger.error(f"Slack notification failed: {e}")
            return False


class TeamsIntegration:
    """Send alerts and notifications to Microsoft Teams."""
    
    def __init__(self, webhook_url: str):
        self.webhook_url = webhook_url
    
    async def send_alert(self, category: str, severity: str, camera_name: str,
                         confidence: float, thumbnail_url: Optional[str] = None) -> bool:
        """Send an incident alert to Teams."""
        color = {"critical": "FF0000", "high": "FF8C00", "medium": "FFD700", "low": "0078D4"}.get(severity, "808080")
        
        payload = {
            "@type": "MessageCard",
            "@context": "http://schema.org/extensions",
            "themeColor": color,
            "summary": f"FireSight Alert: {category}",
            "sections": [{
                "activityTitle": f"FireSight Alert: {category}",
                "facts": [
                    {"name": "Camera", "value": camera_name},
                    {"name": "Severity", "value": severity.upper()},
                    {"name": "Confidence", "value": f"{confidence:.1%}"},
                    {"name": "Category", "value": category},
                ],
                "markdown": True
            }]
        }
        
        if thumbnail_url:
            payload["sections"][0]["images"] = [{"image": thumbnail_url}]
        
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(self.webhook_url, json=payload, timeout=10)
                resp.raise_for_status()
                return True
        except Exception as e:
            logger.error(f"Teams notification failed: {e}")
            return False


class WebhookIntegration:
    """Send alerts via generic webhook (POST JSON)."""
    
    def __init__(self, webhook_url: str, headers: Optional[Dict[str, str]] = None):
        self.webhook_url = webhook_url
        self.headers = headers or {}
    
    async def send_alert(self, payload: Dict[str, Any]) -> bool:
        """Send a generic webhook payload."""
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    self.webhook_url,
                    json=payload,
                    headers=self.headers,
                    timeout=10
                )
                resp.raise_for_status()
                return True
        except Exception as e:
            logger.error(f"Webhook notification failed: {e}")
            return False


class EmailIntegration:
    """Send alert emails via SMTP."""
    
    def __init__(self, smtp_host: str, smtp_port: int, username: str,
                 password: str, from_email: str, use_tls: bool = True):
        self.smtp_host = smtp_host
        self.smtp_port = smtp_port
        self.username = username
        self.password = password
        self.from_email = from_email
        self.use_tls = use_tls
    
    async def send_alert(self, to_emails: List[str], category: str,
                         severity: str, camera_name: str, confidence: float) -> bool:
        """Send an alert email."""
        subject = f"[FireSight {severity.upper()}] {category} detected on {camera_name}"
        
        html = f"""
        <html>
        <body style="font-family: Arial, sans-serif;">
            <div style="background: #1a1a2e; color: white; padding: 20px; border-radius: 8px;">
                <h2 style="color: #f97316;">FireSight Alert</h2>
                <table style="color: white; width: 100%;">
                    <tr><td><strong>Category:</strong></td><td>{category}</td></tr>
                    <tr><td><strong>Severity:</strong></td><td>{severity.upper()}</td></tr>
                    <tr><td><strong>Camera:</strong></td><td>{camera_name}</td></tr>
                    <tr><td><strong>Confidence:</strong></td><td>{confidence:.1%}</td></tr>
                </table>
                <p style="color: #888; margin-top: 20px; font-size: 12px;">
                    This is an automated alert from FireSight by Firewire Networks Ltd.
                </p>
            </div>
        </body>
        </html>
        """
        
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = self.from_email
            msg["To"] = ", ".join(to_emails)
            msg.attach(MIMEText(html, "html"))
            
            if self.use_tls:
                server = smtplib.SMTP(self.smtp_host, self.smtp_port)
                server.starttls()
            else:
                server = smtplib.SMTP(self.smtp_host, self.smtp_port)
            
            server.login(self.username, self.password)
            server.sendmail(self.from_email, to_emails, msg.as_string())
            server.quit()
            return True
        except Exception as e:
            logger.error(f"Email notification failed: {e}")
            return False


class IntegrationManager:
    """Manages all integration channels."""
    
    def __init__(self):
        self.channels: Dict[str, Any] = {}
    
    def add_slack(self, name: str, webhook_url: str):
        self.channels[name] = SlackIntegration(webhook_url)
    
    def add_teams(self, name: str, webhook_url: str):
        self.channels[name] = TeamsIntegration(webhook_url)
    
    def add_webhook(self, name: str, webhook_url: str, headers: Optional[Dict] = None):
        self.channels[name] = WebhookIntegration(webhook_url, headers)
    
    def add_email(self, name: str, smtp_host: str, smtp_port: int,
                  username: str, password: str, from_email: str):
        self.channels[name] = EmailIntegration(smtp_host, smtp_port, username, password, from_email)
    
    def remove_channel(self, name: str):
        self.channels.pop(name, None)
    
    async def broadcast_alert(self, category: str, severity: str,
                              camera_name: str, confidence: float,
                              thumbnail_url: Optional[str] = None) -> Dict[str, bool]:
        """Send alert to all configured channels."""
        results = {}
        for name, channel in self.channels.items():
            if isinstance(channel, (SlackIntegration, TeamsIntegration)):
                results[name] = await channel.send_alert(category, severity, camera_name, confidence, thumbnail_url)
            elif isinstance(channel, WebhookIntegration):
                payload = {
                    "source": "firesight",
                    "category": category,
                    "severity": severity,
                    "camera": camera_name,
                    "confidence": confidence,
                    "thumbnail_url": thumbnail_url,
                }
                results[name] = await channel.send_alert(payload)
        return results
    
    def list_channels(self) -> Dict[str, str]:
        return {name: type(ch).__name__ for name, ch in self.channels.items()}


# Global integration manager
integration_manager = IntegrationManager()
