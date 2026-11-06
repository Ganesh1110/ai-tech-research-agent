"""Base classes for reusable research workflows."""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from app.agent.agent import AutonomousAgent
from app.agent.schemas import AgentResult, SourceRecord
from app.monitoring.metrics import MetricsCollector, SourceQualityMetric


class WorkflowStep(BaseModel):
    """A single step in a research workflow."""

    name: str = Field(description="Human-readable step name")
    instructions: str = Field(
        description="Instructions for what to research in this step"
    )
    expected_output: str = Field(
        description="Description of what this step should produce"
    )


class WorkflowStepResult(BaseModel):
    """Result of executing a single workflow step."""

    step_name: str
    answer: str
    sources: List[SourceRecord] = Field(default_factory=list)
    completed_at: Optional[str] = None


class WorkflowResult(BaseModel):
    """Aggregated result of a complete workflow run."""

    objective: str
    workflow_type: str
    steps: List[WorkflowStepResult] = Field(default_factory=list)
    final_answer: Optional[str] = None
    sources: List[SourceRecord] = Field(default_factory=list)
    created_at: Optional[str] = None
    metrics: Optional[Dict[str, Any]] = None


class ResearchWorkflow(ABC):
    """Base class for reusable research workflows.

    Workflows define *how* to research a topic by decomposing an objective
    into ordered steps. The AutonomousAgent serves as the execution engine
    for each step.
    """

    def __init__(self, agent: Optional[AutonomousAgent] = None):

        self.agent = agent or AutonomousAgent()

    @property
    @abstractmethod
    def workflow_type(self) -> str:

        ...

    @abstractmethod
    def plan_steps(self, objective: str, context: Dict[str, Any]) -> List[WorkflowStep]:

        ...

    @abstractmethod
    def synthesize(
        self,
        objective: str,
        step_results: List[WorkflowStepResult],
    ) -> str:

        ...

    def run(
        self,
        objective: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> WorkflowResult:

        """Execute the full workflow against the given objective."""

        context = context or {}
        step_results: List[WorkflowStepResult] = []
        all_sources: List[SourceRecord] = []
        seen_urls: set = set()

        workflow_metrics = MetricsCollector()
        workflow_metrics.start_run(objective=objective, workflow_type=self.workflow_type)

        steps = self.plan_steps(objective, context)

        for step in steps:

            prompt = self._build_step_prompt(objective, step, step_results)

            agent_result: AgentResult = self.agent.run(objective=prompt)

            # Merge agent-level metrics into workflow-level metrics

            for tool_call in self.agent.metrics.tool_call_metrics:

                workflow_metrics.record_tool_call(

                    tool=tool_call.tool,

                    success=tool_call.success,

                    latency_seconds=tool_call.latency_seconds,

                    arguments=tool_call.arguments,

                    error=tool_call.error,

                )

            for step_metric in self.agent.metrics.step_metrics:

                workflow_metrics.record_step(

                    step_number=step_metric.step_number,

                    status=step_metric.status,

                    thought=step_metric.thought,

                    latency_seconds=step_metric.latency_seconds,

                    observation=step_metric.observation,

                )

            for error in self.agent.metrics.errors:

                workflow_metrics.record_error(error)

            step_sources = list(agent_result.sources or [])

            unique_sources = []

            for source in step_sources:

                url = source.url if hasattr(source, "url") else source

                if url and url not in seen_urls:

                    seen_urls.add(url)

                    unique_sources.append(source)

                    all_sources.append(source)

            step_result = WorkflowStepResult(

                step_name=step.name,

                answer=agent_result.final_answer or "",

                sources=unique_sources,

                completed_at=datetime.now().isoformat(),

            )

            step_results.append(step_result)

        workflow_metrics.record_sources(all_sources)

        workflow_metrics.finish_run(status="completed")

        final_answer = self.synthesize(objective, step_results)

        return WorkflowResult(

            objective=objective,

            workflow_type=self.workflow_type,

            steps=step_results,

            final_answer=final_answer,

            sources=all_sources,

            created_at=datetime.now().isoformat(),

            metrics=workflow_metrics.to_dict(),

        )

    def _build_step_prompt(
        self,
        objective: str,
        step: WorkflowStep,
        previous_results: List[WorkflowStepResult],
    ) -> str:

        """Build the prompt for a single workflow step."""

        lines = [

            f"RESEARCH OBJECTIVE: {objective}",

            f"CURRENT STEP: {step.name}",

            f"INSTRUCTIONS: {step.instructions}",

            f"EXPECTED OUTPUT: {step.expected_output}",

            "",

        ]

        if previous_results:

            lines.append("PREVIOUS STEP FINDINGS:")

            for prev in previous_results:

                lines.append(f"\n--- {prev.step_name} ---")

                lines.append(prev.answer[:800])

                if prev.sources:

                    lines.append("Sources:")

                    for source in prev.sources:

                        title = getattr(source, "title", "Unknown")

                        url = getattr(source, "url", "")

                        lines.append(f"  - {title}: {url}")

            lines.append("")

        lines.append("Use the available tools to gather evidence from the database.")

        lines.append("Return your findings with source citations.")

        return "\n".join(lines)
