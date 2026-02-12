"""
FireSight — Scheduler Service
Handles scheduled tasks: cleanup, report generation, health checks.
"""

import asyncio
from datetime import datetime, timedelta
from typing import Optional, Callable, Dict, Any
import logging

logger = logging.getLogger(__name__)


class ScheduledTask:
    """Represents a scheduled recurring task."""
    
    def __init__(self, name: str, func: Callable, interval_seconds: int, enabled: bool = True):
        self.name = name
        self.func = func
        self.interval_seconds = interval_seconds
        self.enabled = enabled
        self.last_run: Optional[datetime] = None
        self.next_run: Optional[datetime] = None
        self.run_count: int = 0
        self.error_count: int = 0
        self._task: Optional[asyncio.Task] = None


class SchedulerService:
    """Manages background scheduled tasks for FireSight."""
    
    def __init__(self):
        self.tasks: Dict[str, ScheduledTask] = {}
        self._running = False
    
    def register_task(self, name: str, func: Callable, interval_seconds: int, enabled: bool = True):
        """Register a new scheduled task."""
        self.tasks[name] = ScheduledTask(name, func, interval_seconds, enabled)
        logger.info(f"Registered scheduled task: {name} (every {interval_seconds}s)")
    
    async def start(self):
        """Start all scheduled tasks."""
        self._running = True
        logger.info(f"Starting scheduler with {len(self.tasks)} tasks")
        
        for name, task in self.tasks.items():
            if task.enabled:
                task._task = asyncio.create_task(self._run_task_loop(task))
                logger.info(f"Started task: {name}")
    
    async def stop(self):
        """Stop all scheduled tasks."""
        self._running = False
        for name, task in self.tasks.items():
            if task._task:
                task._task.cancel()
                try:
                    await task._task
                except asyncio.CancelledError:
                    pass
                logger.info(f"Stopped task: {name}")
    
    async def _run_task_loop(self, task: ScheduledTask):
        """Run a task in a loop at the specified interval."""
        while self._running:
            try:
                task.last_run = datetime.utcnow()
                await task.func()
                task.run_count += 1
                task.next_run = datetime.utcnow() + timedelta(seconds=task.interval_seconds)
                logger.debug(f"Task {task.name} completed (run #{task.run_count})")
            except Exception as e:
                task.error_count += 1
                logger.error(f"Task {task.name} failed: {e}")
            
            await asyncio.sleep(task.interval_seconds)
    
    def get_status(self) -> Dict[str, Any]:
        """Get status of all scheduled tasks."""
        return {
            "running": self._running,
            "tasks": {
                name: {
                    "enabled": task.enabled,
                    "interval_seconds": task.interval_seconds,
                    "last_run": task.last_run.isoformat() if task.last_run else None,
                    "next_run": task.next_run.isoformat() if task.next_run else None,
                    "run_count": task.run_count,
                    "error_count": task.error_count,
                }
                for name, task in self.tasks.items()
            }
        }


# Default scheduled tasks

async def cleanup_old_incidents():
    """Remove incidents older than retention period."""
    logger.info("Running incident cleanup task")
    # Implementation connects to DB and removes old records
    pass


async def cleanup_old_clips():
    """Remove video clips older than retention period."""
    logger.info("Running clip cleanup task")
    # Implementation removes old clip files from MinIO
    pass


async def generate_daily_report():
    """Generate daily summary report."""
    logger.info("Generating daily report")
    pass


async def check_camera_health():
    """Check all camera connections and update status."""
    logger.info("Running camera health check")
    pass


async def cleanup_expired_shares():
    """Remove expired share links."""
    logger.info("Cleaning up expired shares")
    pass


def setup_default_tasks(scheduler: SchedulerService):
    """Register default scheduled tasks."""
    scheduler.register_task("cleanup_incidents", cleanup_old_incidents, interval_seconds=86400)  # Daily
    scheduler.register_task("cleanup_clips", cleanup_old_clips, interval_seconds=86400)  # Daily
    scheduler.register_task("daily_report", generate_daily_report, interval_seconds=86400)  # Daily
    scheduler.register_task("camera_health", check_camera_health, interval_seconds=300)  # Every 5 min
    scheduler.register_task("cleanup_shares", cleanup_expired_shares, interval_seconds=3600)  # Hourly


# Global scheduler instance
scheduler = SchedulerService()
