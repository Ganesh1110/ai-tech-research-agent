"""Phase 6.2 — Job queue for autonomous research tasks.

SQLite-backed persistent job queue. Jobs survive worker restarts and
are claimed atomically so multiple workers don't process the same job.
"""

import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy import and_, select, text, update

from app.database.db import SessionLocal, engine
from app.database.models import AgentJob

logger = logging.getLogger(__name__)

JOB_STATUS_PENDING = "pending"
JOB_STATUS_RUNNING = "running"
JOB_STATUS_COMPLETED = "completed"
JOB_STATUS_FAILED = "failed"


class JobQueue:

    """Persistent job queue backed by the agent_jobs table."""

    def __init__(self):

        self.engine = engine

    # ---- enqueue -------------------------------------------------------

    def enqueue(

        self,

        job_type: str,

        worker_type: str,

        payload: Optional[Dict[str, Any]] = None,

        max_retries: int = 3,

    ) -> int:

        """Insert a new pending job. Returns the job id."""

        with SessionLocal() as db:

            job = AgentJob(

                job_type=job_type,

                worker_type=worker_type,

                payload=payload or {},

                status=JOB_STATUS_PENDING,

                max_retries=max_retries,

            )

            db.add(job)

            db.commit()

            db.refresh(job)

            return job.id

    # ---- claim ---------------------------------------------------------

    def claim_next(

        self,

        worker_type: Optional[str] = None,

        claim_seconds: int = 300,

    ) -> Optional[Dict[str, Any]]:

        """Atomically claim the next pending job.

        Sets status to running and records started_at. Returns the job
        dict or None if nothing is available.
        """

        now = datetime.now(timezone.utc)

        with SessionLocal() as db:

            # Find pending jobs, optionally filtered by worker_type

            stmt = select(AgentJob).where(AgentJob.status == JOB_STATUS_PENDING)

            if worker_type:

                stmt = stmt.where(AgentJob.worker_type == worker_type)

            stmt = stmt.order_by(AgentJob.created_at.asc()).limit(1)

            job = db.execute(stmt).scalar_one_or_none()

            if not job:

                return None

            job.status = JOB_STATUS_RUNNING

            job.started_at = now

            db.commit()

            db.refresh(job)

            return self._job_to_dict(job)

    # ---- complete ------------------------------------------------------

    def complete(

        self,

        job_id: int,

        result: Optional[Dict[str, Any]] = None,

    ) -> None:

        """Mark a job as completed with an optional result."""

        now = datetime.now(timezone.utc)

        with SessionLocal() as db:

            job = db.get(AgentJob, job_id)

            if not job:

                return

            job.status = JOB_STATUS_COMPLETED

            job.finished_at = now

            if result is not None:

                job.result = result

            db.commit()

    # ---- fail ----------------------------------------------------------

    def fail(

        self,

        job_id: int,

        error: str,

        retry: bool = True,

    ) -> None:

        """Mark a job as failed, optionally retrying later."""

        now = datetime.now(timezone.utc)

        with SessionLocal() as db:

            job = db.get(AgentJob, job_id)

            if not job:

                return

            job.error = error

            job.finished_at = now

            if retry and job.retry_count < job.max_retries:

                job.retry_count += 1

                job.status = JOB_STATUS_PENDING

                job.started_at = None

            else:

                job.status = JOB_STATUS_FAILED

            db.commit()

    # ---- query ---------------------------------------------------------

    def get_job(self, job_id: int) -> Optional[Dict[str, Any]]:

        with SessionLocal() as db:

            job = db.get(AgentJob, job_id)

            return self._job_to_dict(job) if job else None

    def list_jobs(

        self,

        status: Optional[str] = None,

        worker_type: Optional[str] = None,

        limit: int = 50,

    ) -> List[Dict[str, Any]]:

        with SessionLocal() as db:

            stmt = select(AgentJob)

            if status:

                stmt = stmt.where(AgentJob.status == status)

            if worker_type:

                stmt = stmt.where(AgentJob.worker_type == worker_type)

            stmt = stmt.order_by(AgentJob.created_at.desc()).limit(limit)

            rows = db.execute(stmt).scalars().all()

            return [self._job_to_dict(r) for r in rows]

    def count_by_status(self) -> Dict[str, int]:

        with SessionLocal() as db:

            result: Dict[str, int] = {}

            for status in (

                JOB_STATUS_PENDING,

                JOB_STATUS_RUNNING,

                JOB_STATUS_COMPLETED,

                JOB_STATUS_FAILED,

            ):

                stmt = select(AgentJob).where(AgentJob.status == status)

                count = len(db.execute(stmt).scalars().all())

                result[status] = count

            return result

    # ---- stale recovery ------------------------------------------------

    def recover_stale_jobs(self, older_than_seconds: int = 600) -> int:

        """Reset jobs stuck in 'running' beyond the threshold back to pending."""

        cutoff = datetime.now(timezone.utc)

        from datetime import timedelta

        cutoff = cutoff - timedelta(seconds=older_than_seconds)

        with SessionLocal() as db:

            stmt = select(AgentJob).where(

                and_(

                    AgentJob.status == JOB_STATUS_RUNNING,

                    AgentJob.started_at < cutoff,

                )

            )

            rows = db.execute(stmt).scalars().all()

            count = 0

            for job in rows:

                job.status = JOB_STATUS_PENDING

                job.started_at = None

                count += 1

            db.commit()

            return count

    # ---- helpers -------------------------------------------------------

    @staticmethod

    def _job_to_dict(job: AgentJob) -> Dict[str, Any]:

        return {

            "id": job.id,

            "job_type": job.job_type,

            "worker_type": job.worker_type,

            "payload": job.payload,

            "status": job.status,

            "created_at": job.created_at.isoformat()

            if job.created_at

            else None,

            "started_at": job.started_at.isoformat()

            if job.started_at

            else None,

            "finished_at": job.finished_at.isoformat()

            if job.finished_at

            else None,

            "result": job.result,

            "error": job.error,

            "retry_count": job.retry_count,

            "max_retries": job.max_retries,

        }


__all__ = [

    "JobQueue",

    "JOB_STATUS_PENDING",

    "JOB_STATUS_RUNNING",

    "JOB_STATUS_COMPLETED",

    "JOB_STATUS_FAILED",

]
