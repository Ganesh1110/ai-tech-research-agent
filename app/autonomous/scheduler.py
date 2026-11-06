"""Phase 6.2 — APScheduler integration for autonomous discovery cycles.

The scheduler never runs long LLM tasks directly. It creates jobs in the
persistent job queue, which workers pick up and execute independently.
"""

import logging
from datetime import datetime, timezone
from typing import Any, Callable, Optional

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.cron import CronTrigger

from app.autonomous.job_queue import JobQueue
from app.autonomous.coordinator import DiscoveryCoordinator
from app.config import settings

logger = logging.getLogger(__name__)


class AutonomousScheduler:

    """Wraps APScheduler to orchestrate discovery cycles via job queue."""

    def __init__(
        self,

        job_queue: Optional[JobQueue] = None,

        coordinator: Optional[DiscoveryCoordinator] = None,

        interval_seconds: int = 300,

    ):

        self.job_queue = job_queue or JobQueue()

        self.coordinator = coordinator or DiscoveryCoordinator(self.job_queue)

        self.interval_seconds = interval_seconds

        self.scheduler = BackgroundScheduler()

        self._started = False

    def start(self) -> None:

        if self._started:

            logger.warning("Scheduler already started")

            return

        self.scheduler.add_job(
            self._run_discovery_cycle,
            trigger=IntervalTrigger(seconds=self.interval_seconds),
            id="discovery_cycle",
            name="Autonomous discovery cycle",
            replace_existing=True,
            max_instances=1,  # prevent overlapping cycles
            coalesce=True,  # if a cycle is missed, run once not multiple times
        )

        # Weekly Founder Briefing every Monday at 08:00
        self.scheduler.add_job(
            self._run_weekly_briefing_cycle,
            trigger=CronTrigger(day_of_week="mon", hour=8, minute=0, timezone=settings.TIMEZONE),
            id="weekly_startup_briefing",
            name="Weekly Startup Opportunity Briefing",
            replace_existing=True,
            max_instances=1,
            coalesce=True,
        )

        self.scheduler.start()

        self._started = True

        logger.info(

            "Autonomous scheduler started, interval=%ss", self.interval_seconds

        )

    def stop(self) -> None:

        if not self._started:

            return

        self.scheduler.shutdown(wait=False)

        self._started = False

        logger.info("Autonomous scheduler stopped")

    # ---- cycle ---------------------------------------------------------

    def _run_discovery_cycle(self) -> None:

        """Execute one discovery cycle by enqueuing collection jobs."""

        logger.info("Starting discovery cycle")

        cycle = self.coordinator.start_cycle()

        try:

            self.coordinator.enqueue_collection_jobs(cycle.id)

            logger.info(

                "Discovery cycle %s enqueued collection jobs", cycle.id

            )

        except Exception:

            logger.exception("Discovery cycle %s failed to enqueue jobs", cycle.id)

            self.coordinator.finish_cycle(cycle.id, status="failed")

    def _run_weekly_briefing_cycle(self) -> None:
        """Run weekly startup intelligence scan and briefing synthesis."""
        logger.info("Executing scheduled weekly startup opportunity briefing synthesis")
        try:
            from app.database.db import SessionLocal
            from app.services.startup_intelligence import StartupIntelligenceService

            with SessionLocal() as db:
                service = StartupIntelligenceService()
                service.scan_research_for_opportunities(db, limit=10, min_score=65)
                briefing = service.generate_weekly_briefing(db, force_new=True)
                logger.info(f"Weekly briefing successfully synthesized: {briefing.title}")
        except Exception:
            logger.exception("Failed to execute scheduled weekly startup opportunity briefing")

    def is_running(self) -> bool:

        return self._started


__all__ = ["AutonomousScheduler"]
