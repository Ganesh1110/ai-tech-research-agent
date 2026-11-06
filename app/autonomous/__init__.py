"""Phase 6 — Autonomous research engine package."""

from app.autonomous.job_queue import (

    JobQueue,

    JOB_STATUS_PENDING,

    JOB_STATUS_RUNNING,

    JOB_STATUS_COMPLETED,

    JOB_STATUS_FAILED,

)

from app.autonomous.scheduler import AutonomousScheduler

from app.autonomous.coordinator import (

    DiscoveryCoordinator,

    DISCOVERY_CATEGORIES,

    CATEGORY_WORKER_MAP,

)

from app.autonomous.discovery_manager import (

    DiscoveryManager,

    WEIGHT_RELEVANCE,

    WEIGHT_NOVELTY,

    WEIGHT_TECHNICAL_USEFULNESS,

    WEIGHT_MATURITY,

    WEIGHT_APPLICATION_VALUE,

)

from app.autonomous.recommendation import RecommendationEngine

from app.autonomous.worker import JobWorker

__all__ = [

    "JobQueue",

    "JOB_STATUS_PENDING",

    "JOB_STATUS_RUNNING",

    "JOB_STATUS_COMPLETED",

    "JOB_STATUS_FAILED",

    "AutonomousScheduler",

    "DiscoveryCoordinator",

    "DISCOVERY_CATEGORIES",

    "CATEGORY_WORKER_MAP",

    "DiscoveryManager",

    "WEIGHT_RELEVANCE",

    "WEIGHT_NOVELTY",

    "WEIGHT_TECHNICAL_USEFULNESS",

    "WEIGHT_MATURITY",

    "WEIGHT_APPLICATION_VALUE",

    "RecommendationEngine",

    "JobWorker",

]
