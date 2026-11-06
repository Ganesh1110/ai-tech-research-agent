"""Metrics collection for agent and workflow execution.

Tracks latency, tool usage, failures, and source quality across
autonomous agent runs and research workflows.
"""

import time
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional, TYPE_CHECKING

if TYPE_CHECKING:

    from app.agent.schemas import SourceRecord

@dataclass
class ToolCallMetric:
    """Metrics for a single tool call."""

    tool: str
    success: bool
    latency_seconds: float
    arguments: Dict[str, Any] = field(default_factory=dict)
    error: Optional[str] = None


@dataclass
class StepMetric:
    """Metrics for a single agent step."""

    step_number: int
    status: str
    thought: Optional[str] = None
    tool_calls: List[ToolCallMetric] = field(default_factory=list)
    latency_seconds: float = 0.0
    observation: Optional[str] = None


@dataclass
class SourceQualityMetric:
    """Aggregated source quality metrics."""

    total_sources: int = 0
    sources_with_url: int = 0
    sources_with_title: int = 0
    sources_with_score: int = 0
    avg_relevance_score: Optional[float] = None
    sources_by_category: Dict[str, int] = field(default_factory=dict)


class MetricsCollector:

    """Collects execution metrics for agent runs and workflows."""

    def __init__(self) -> None:

        self.run_id: Optional[str] = None
        self.objective: Optional[str] = None
        self.workflow_type: Optional[str] = None
        self.started_at: Optional[str] = None
        self.finished_at: Optional[str] = None
        self.duration_seconds: Optional[float] = None
        self.status: str = "running"
        self.total_steps: int = 0
        self.step_metrics: List[StepMetric] = []
        self.tool_call_metrics: List[ToolCallMetric] = []
        self.source_quality: SourceQualityMetric = SourceQualityMetric()
        self.errors: List[str] = []

    # ---- run lifecycle ---------------------------------------------------

    def start_run(
        self,
        objective: str,
        workflow_type: Optional[str] = None,
        run_id: Optional[str] = None,
    ) -> None:

        import uuid

        self.run_id = run_id or str(uuid.uuid4())[:8]
        self.objective = objective
        self.workflow_type = workflow_type
        self.started_at = datetime.now().isoformat()
        self.status = "running"
        self.total_steps = 0
        self.step_metrics = []
        self.tool_call_metrics = []
        self.source_quality = SourceQualityMetric()
        self.errors = []

    def finish_run(self, status: str = "completed") -> None:

        self.finished_at = datetime.now().isoformat()
        self.status = status

        if self.started_at and self.finished_at:

            started = datetime.fromisoformat(self.started_at)

            finished = datetime.fromisoformat(self.finished_at)

            self.duration_seconds = (finished - started).total_seconds()

    # ---- step recording --------------------------------------------------

    def record_step(
        self,
        step_number: int,
        status: str,
        thought: Optional[str] = None,
        latency_seconds: float = 0.0,
        observation: Optional[str] = None,
    ) -> None:

        self.total_steps = max(self.total_steps, step_number)

        self.step_metrics.append(

            StepMetric(

                step_number=step_number,

                status=status,

                thought=thought,

                latency_seconds=latency_seconds,

                observation=observation,

            )

        )

    def record_tool_call(
        self,
        tool: str,
        success: bool,
        latency_seconds: float,
        arguments: Optional[Dict[str, Any]] = None,
        error: Optional[str] = None,
    ) -> None:

        self.tool_call_metrics.append(

            ToolCallMetric(

                tool=tool,

                success=success,

                latency_seconds=latency_seconds,

                arguments=arguments or {},

                error=error,

            )

        )

    def record_error(self, error: str) -> None:

        self.errors.append(error)

    # ---- source quality --------------------------------------------------

    def record_sources(self, sources: List[SourceRecord]) -> None:

        self.source_quality.total_sources += len(sources)

        scores: List[int] = []

        for source in sources:

            url = getattr(source, "url", "")

            title = getattr(source, "title", "")

            score = getattr(source, "relevance_score", None)

            src_category = getattr(source, "source", None)

            if url:

                self.source_quality.sources_with_url += 1

            if title:

                self.source_quality.sources_with_title += 1

            if score is not None:

                self.source_quality.sources_with_score += 1

                scores.append(score)

            if src_category:

                cat = str(src_category)

                self.source_quality.sources_by_category[cat] = (

                    self.source_quality.sources_by_category.get(cat, 0) + 1

                )

        if scores:

            total = self.source_quality.sources_with_score

            current_avg = self.source_quality.avg_relevance_score or 0.0

            # running average

            self.source_quality.avg_relevance_score = round(

                (current_avg * (total - len(scores)) + sum(scores)) / total, 2

            )

    # ---- aggregation -----------------------------------------------------

    def tool_usage_summary(self) -> Dict[str, Dict[str, Any]]:

        summary: Dict[str, Dict[str, Any]] = defaultdict(

            lambda: {

                "calls": 0,

                "successes": 0,

                "failures": 0,

                "total_latency_seconds": 0.0,

                "avg_latency_seconds": 0.0,

            }

        )

        for call in self.tool_call_metrics:

            entry = summary[call.tool]

            entry["calls"] += 1

            if call.success:

                entry["successes"] += 1

            else:

                entry["failures"] += 1

            entry["total_latency_seconds"] += call.latency_seconds

        for entry in summary.values():

            if entry["calls"]:

                entry["avg_latency_seconds"] = round(

                    entry["total_latency_seconds"] / entry["calls"], 4

                )

            entry["success_rate"] = round(

                entry["successes"] / entry["calls"], 4

            ) if entry["calls"] else 0.0

        return dict(summary)

    def step_summary(self) -> Dict[str, Any]:

        completed = sum(

            1 for s in self.step_metrics if s.status == "completed"

        )

        failed = sum(1 for s in self.step_metrics if s.status == "failed")

        avg_step_latency = 0.0

        if self.step_metrics:

            avg_step_latency = round(

                sum(s.latency_seconds for s in self.step_metrics)

                / len(self.step_metrics),

                4,

            )

        return {

            "total_steps": self.total_steps,

            "completed_steps": completed,

            "failed_steps": failed,

            "avg_step_latency_seconds": avg_step_latency,

        }

    def overall_success_rate(self) -> float:

        if not self.tool_call_metrics:

            return 0.0

        successes = sum(1 for c in self.tool_call_metrics if c.success)

        return round(successes / len(self.tool_call_metrics), 4)

    def to_dict(self) -> Dict[str, Any]:

        return {

            "run_id": self.run_id,

            "objective": self.objective,

            "workflow_type": self.workflow_type,

            "started_at": self.started_at,

            "finished_at": self.finished_at,

            "duration_seconds": self.duration_seconds,

            "status": self.status,

            "total_steps": self.total_steps,

            "step_summary": self.step_summary(),

            "tool_usage": self.tool_usage_summary(),

            "overall_success_rate": self.overall_success_rate(),

            "source_quality": {

                "total_sources": self.source_quality.total_sources,

                "sources_with_url": self.source_quality.sources_with_url,

                "sources_with_title": self.source_quality.sources_with_title,

                "sources_with_score": self.source_quality.sources_with_score,

                "avg_relevance_score": self.source_quality.avg_relevance_score,

                "sources_by_category": self.source_quality.sources_by_category,

            },

            "errors": self.errors,

        }


# Global default collector for convenience

metrics = MetricsCollector()

__all__ = [
    "MetricsCollector",
    "ToolCallMetric",
    "StepMetric",
    "SourceQualityMetric",
    "metrics",
]
