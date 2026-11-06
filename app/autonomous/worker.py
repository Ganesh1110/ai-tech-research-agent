"""Phase 6.2 — Job worker.

Picks jobs from the queue and executes them using the appropriate
collector or specialist. Runs independently of the scheduler.
"""

import logging
from typing import Any, Callable, Dict, Optional

from app.autonomous.discovery_manager import DiscoveryManager
from app.autonomous.job_queue import JobQueue
from app.autonomous.recommendation import RecommendationEngine
from app.collectors.github import fetch_github_repositories
from app.collectors.arxiv import fetch_arxiv_papers
from app.collectors.rss import fetch_rss_feeds

logger = logging.getLogger(__name__)


class JobWorker:

    """Executes jobs claimed from the job queue."""

    def __init__(self, job_queue: Optional[JobQueue] = None):

        self.job_queue = job_queue or JobQueue()

        self.discovery_manager = DiscoveryManager()

        self.recommendation_engine = RecommendationEngine()

        self._worker_handlers: Dict[str, Callable] = {

            "github_collector": self._handle_github,

            "mcp_collector": self._handle_mcp,

            "ai_models_collector": self._handle_ai_models,

            "datasets_collector": self._handle_datasets,

            "arxiv_collector": self._handle_arxiv,

            "developer_tools_collector": self._handle_developer_tools,

            "react_native_collector": self._handle_react_native,

            "open_source_collector": self._handle_open_source,

            "ai_automation_collector": self._handle_ai_automation,

        }

    # ---- main loop -----------------------------------------------------

    def process_next(self, worker_type: Optional[str] = None) -> bool:

        """Claim and execute the next job. Returns True if a job was processed."""

        job = self.job_queue.claim_next(worker_type=worker_type)

        if not job:

            return False

        try:

            handler = self._worker_handlers.get(job["worker_type"])

            if not handler:

                raise ValueError(f"No handler for worker: {job['worker_type']}")

            result = handler(job)

            self.job_queue.complete(job["id"], result=result)

            return True

        except Exception as exc:  # noqa: BLE001

            logger.exception("Job %s failed", job["id"])

            self.job_queue.fail(job["id"], str(exc))

            return True

    def run_forever(

        self,

        worker_type: Optional[str] = None,

        poll_seconds: float = 2.0,

        max_jobs: Optional[int] = None,

    ) -> int:

        """Process jobs continuously until queue is empty or max_jobs reached."""

        processed = 0

        while True:

            if max_jobs is not None and processed >= max_jobs:

                break

            processed_one = self.process_next(worker_type=worker_type)

            if not processed_one:

                break

            processed += 1

        return processed

    # ---- handlers ------------------------------------------------------

    def _handle_github(self, job: Dict[str, Any]) -> Dict[str, Any]:

        return self._run_collector("github", fetch_github_repositories, job)

    def _handle_mcp(self, job: Dict[str, Any]) -> Dict[str, Any]:

        return self._run_collector("mcp_skills", self._collect_mcp, job)

    def _handle_ai_models(self, job: Dict[str, Any]) -> Dict[str, Any]:

        return self._run_collector("ai_models", self._collect_ai_models, job)

    def _handle_datasets(self, job: Dict[str, Any]) -> Dict[str, Any]:

        return self._run_collector("datasets", self._collect_datasets, job)

    def _handle_arxiv(self, job: Dict[str, Any]) -> Dict[str, Any]:

        return self._run_collector("research_papers", fetch_arxiv_papers, job)

    def _handle_developer_tools(self, job: Dict[str, Any]) -> Dict[str, Any]:

        return self._run_collector("developer_tools", self._collect_developer_tools, job)

    def _handle_react_native(self, job: Dict[str, Any]) -> Dict[str, Any]:

        return self._run_collector("react_native", self._collect_react_native, job)

    def _handle_open_source(self, job: Dict[str, Any]) -> Dict[str, Any]:

        return self._run_collector("open_source", self._collect_open_source, job)

    def _handle_ai_automation(self, job: Dict[str, Any]) -> Dict[str, Any]:

        return self._run_collector("ai_automation", self._collect_ai_automation, job)

    # ---- generic collector runner -------------------------------------

    def _run_collector(

        self,

        category: str,

        collector_fn,

        job: Dict[str, Any],

    ) -> Dict[str, Any]:

        cycle_id = job.get("payload", {}).get("cycle_id")

        try:

            items = collector_fn()

        except Exception as exc:

            logger.exception("Collector %s failed", category)

            return {

                "category": category,

                "collected": 0,

                "new": 0,

                "deduped": 0,

                "error": str(exc),

            }

        collected = len(items)

        new_count = 0

        deduped = 0

        high_potential = 0

        manager = self.discovery_manager

        engine = self.recommendation_engine

        for item in items:

            external_id = item.get("external_id") or item.get("url") or item.get("title", "")

            source = item.get("source", category)

            if manager.is_duplicate(external_id, source):

                deduped += 1

                continue

            scores = manager.score_item(item)

            stored = manager.store_discovered_item(

                cycle_id=cycle_id or 0,

                category=category,

                item_data={

                    "external_id": external_id,

                    "source": source,

                    "title": item.get("title", "Unknown"),

                    "description": item.get("description", ""),

                    "url": item.get("url", ""),

                    "metadata": item.get("metadata", {}),

                },

                scores=scores,

            )

            if stored:

                new_count += 1

                if scores["overall"] >= 85:

                    high_potential += 1

                engine.recommend(

                    discovered_item_id=stored.id,

                    overall_score=scores["overall"],

                    factor_scores={

                        "relevance": scores["relevance"],

                        "novelty": scores["novelty"],

                        "technical_usefulness": scores["technical_usefulness"],

                        "maturity": scores["maturity"],

                        "application_value": scores["application_value"],

                    },

                )

        return {

            "category": category,

            "collected": collected,

            "new": new_count,

            "deduped": deduped,

            "high_potential": high_potential,

        }

    # ---- placeholder collectors (expandable) --------------------------

    def _collect_mcp(self) -> list:

        return self._placeholder_items("mcp_skills", [

            {"title": "MCP Server Registry", "description": "Registry of MCP servers", "url": "https://github.com/modelcontextprotocol/servers"},

        ])

    def _collect_ai_models(self) -> list:

        return self._placeholder_items("ai_models", [

            {"title": "Qwen2.5-14B", "description": "14B parameter LLM", "url": "https://huggingface.co/Qwen/Qwen2.5-14B"},

        ])

    def _collect_datasets(self) -> list:

        return self._placeholder_items("datasets", [])

    def _collect_developer_tools(self) -> list:

        return self._placeholder_items("developer_tools", [])

    def _collect_react_native(self) -> list:

        return self._placeholder_items("react_native", [])

    def _collect_open_source(self) -> list:

        return self._placeholder_items("open_source", [])

    def _collect_ai_automation(self) -> list:

        return self._placeholder_items("ai_automation", [])

    @staticmethod

    def _placeholder_items(category: str, items: list) -> list:

        for it in items:

            it.setdefault("source", category)

            it.setdefault("external_id", it.get("url", it.get("title", "")))

        return items


__all__ = [

    "JobWorker",

]
