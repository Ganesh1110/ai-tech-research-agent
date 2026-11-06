"""Phase 6.2 — Discovery coordinator.

Decomposes a discovery cycle into per-category collection jobs and
enqueues them in the job queue.
"""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.database.db import SessionLocal
from app.database.models import DiscoveryCycle
from app.autonomous.job_queue import JobQueue

logger = logging.getLogger(__name__)

# All discovery categories the agent monitors

DISCOVERY_CATEGORIES: List[str] = [

    "github",

    "mcp_skills",

    "ai_models",

    "datasets",

    "research_papers",

    "developer_tools",

    "react_native",

    "open_source",

    "ai_automation",

]

# Map category -> worker type for the job queue

CATEGORY_WORKER_MAP: Dict[str, str] = {

    "github": "github_collector",

    "mcp_skills": "mcp_collector",

    "ai_models": "ai_models_collector",

    "datasets": "datasets_collector",

    "research_papers": "arxiv_collector",

    "developer_tools": "developer_tools_collector",

    "react_native": "react_native_collector",

    "open_source": "open_source_collector",

    "ai_automation": "ai_automation_collector",

}


class DiscoveryCoordinator:

    """Coordinates discovery cycles and job enqueuing."""

    def __init__(self, job_queue: JobQueue):

        self.job_queue = job_queue

    # ---- cycle lifecycle ----------------------------------------------

    def start_cycle(self) -> DiscoveryCycle:

        """Record the start of a new discovery cycle."""

        with SessionLocal() as db:

            cycle = DiscoveryCycle(status="running")

            db.add(cycle)

            db.commit()

            db.refresh(cycle)

            return cycle

    def finish_cycle(

        self,

        cycle_id: int,

        status: str = "completed",

        items_collected: int = 0,

        items_new: int = 0,

        items_deduped: int = 0,

        high_potential_count: int = 0,

        failed_collectors: Optional[List[str]] = None,

    ) -> None:

        """Mark a cycle as finished with summary stats."""

        now = datetime.now(timezone.utc)

        with SessionLocal() as db:

            cycle = db.get(DiscoveryCycle, cycle_id)

            if not cycle:

                return

            cycle.finished_at = now

            cycle.status = status

            cycle.items_collected = items_collected

            cycle.items_new = items_new

            cycle.items_deduped = items_deduped

            cycle.high_potential_count = high_potential_count

            cycle.failed_collectors = failed_collectors or []

            duration = (now - cycle.started_at).total_seconds()

            cycle.duration_seconds = duration

            db.commit()

    # ---- job enqueuing ------------------------------------------------

    def enqueue_collection_jobs(self, cycle_id: int) -> int:

        """Enqueue one collection job per discovery category."""

        enqueued = 0

        for category in DISCOVERY_CATEGORIES:

            worker_type = CATEGORY_WORKER_MAP[category]

            payload: Dict[str, Any] = {

                "cycle_id": cycle_id,

                "category": category,

            }

            self.job_queue.enqueue(

                job_type="collect_category",

                worker_type=worker_type,

                payload=payload,

            )

            enqueued += 1

            logger.info(

                "Enqueued collection job: category=%s worker=%s cycle=%s",

                category,

                worker_type,

                cycle_id,

            )

        return enqueued

    # ---- stats --------------------------------------------------------

    def get_cycle_history(self, limit: int = 20) -> List[Dict[str, Any]]:

        with SessionLocal() as db:

            from sqlalchemy import select

            from sqlalchemy import desc

            stmt = select(DiscoveryCycle).order_by(desc(DiscoveryCycle.started_at)).limit(limit)

            rows = db.execute(stmt).scalars().all()

            return [

                {

                    "id": r.id,

                    "started_at": r.started_at.isoformat() if r.started_at else None,

                    "finished_at": r.finished_at.isoformat() if r.finished_at else None,

                    "duration_seconds": r.duration_seconds,

                    "items_collected": r.items_collected,

                    "items_new": r.items_new,

                    "items_deduped": r.items_deduped,

                    "high_potential_count": r.high_potential_count,

                    "failed_collectors": r.failed_collectors,

                    "status": r.status,

                }

                for r in rows

            ]


__all__ = [

    "DiscoveryCoordinator",

    "DISCOVERY_CATEGORIES",

    "CATEGORY_WORKER_MAP",

]
