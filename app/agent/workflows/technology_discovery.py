"""Technology discovery workflow.

Identifies and summarizes emerging technologies from the research database,
supporting technology radar and landscape mapping use cases.
"""

from typing import Any, Dict, List

from app.agent.schemas import SourceRecord
from app.agent.workflows.base import (
    ResearchWorkflow,
    WorkflowResult,
    WorkflowStep,
    WorkflowStepResult,
)


class TechnologyDiscoveryWorkflow(ResearchWorkflow):

    """Discover emerging technologies from research items."""

    @property
    def workflow_type(self) -> str:

        return "technology_discovery"

    def plan_steps(
        self,
        objective: str,
        context: Dict[str, Any],
    ) -> List[WorkflowStep]:

        return [

            WorkflowStep(

                name="Search for candidate technologies",

                instructions=(
                    "Search the research database for emerging AI/LLM technologies "
                    "relevant to the objective. Use keyword searches across title, "
                    "summary, and description fields. Retrieve the top candidates "
                    "by relevance score across multiple technology categories."
                ),

                expected_output=(
                    "A list of candidate technologies with titles, categories, "
                    "relevance scores, brief descriptions, and source URLs."
                ),

            ),

            WorkflowStep(

                name="Retrieve technology details",

                instructions=(
                    "For each candidate technology identified in step 1, retrieve "
                    "full details including key topics, technologies used, "
                    "implementation ideas, limitations, and publication dates. "
                    "Focus on actionable technical details."
                ),

                expected_output=(
                    "Detailed profiles of each candidate technology covering "
                    "architecture, capabilities, maturity, and source citations."
                ),

            ),

            WorkflowStep(

                name="Summarize technology landscape",

                instructions=(
                    "Synthesize findings into a technology landscape summary. "
                    "Group related technologies, highlight the most promising "
                    "candidates, and note any gaps or trends. Include full "
                    "source citations for every claim."
                ),

                expected_output=(
                    "A structured technology landscape summary with categorized "
                    "findings, top recommendations, and traceable citations."
                ),

            ),

        ]

    def synthesize(
        self,
        objective: str,
        step_results: List[WorkflowStepResult],
    ) -> str:

        lines = [

            f"Technology Discovery: {objective}",

            f"Workflow: {self.workflow_type}",

            f"Steps completed: {len(step_results)}",

            "",

        ]

        for result in step_results:

            lines.append(f"## {result.step_name}")

            lines.append(result.answer)

            lines.append("")

        # Deduplicate sources by URL while preserving order

        seen = set()

        unique_sources: List[SourceRecord] = []

        for result in step_results:

            for source in result.sources:

                url = source.url if hasattr(source, "url") else str(source)

                if url and url not in seen:

                    seen.add(url)

                    unique_sources.append(source)

        lines.append("## Sources")

        for idx, source in enumerate(unique_sources, 1):

            title = getattr(source, "title", "Unknown")

            src = getattr(source, "source", "unknown")

            score = getattr(source, "relevance_score", None)

            score_str = f" (relevance: {score}/100)" if score else ""

            url = getattr(source, "url", "")

            lines.append(f"[{idx}] {title} [{src}]{score_str}")

            lines.append(f"    {url}")

        return "\n".join(lines)
