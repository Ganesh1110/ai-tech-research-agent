"""Framework comparison workflow.

Compares AI/LLM frameworks and agent frameworks using consistent criteria
such as architecture, tool-calling, memory support, and deployment suitability.
"""

from typing import Any, Dict, List

from app.agent.schemas import SourceRecord
from app.agent.workflows.base import (
    ResearchWorkflow,
    WorkflowResult,
    WorkflowStep,
    WorkflowStepResult,
)


class FrameworkComparisonWorkflow(ResearchWorkflow):

    """Compare AI/LLM frameworks using consistent criteria."""

    @property
    def workflow_type(self) -> str:

        return "framework_comparison"

    def plan_steps(
        self,
        objective: str,
        context: Dict[str, Any],
    ) -> List[WorkflowStep]:

        criteria = context.get(
            "criteria",
            "architecture, tool-calling capabilities, memory support, deployment suitability",
        )

        return [

            WorkflowStep(

                name="Define comparison criteria",

                instructions=(
                    f"Based on the objective '{objective}', define the specific "
                    f"criteria to compare frameworks. Suggested criteria: {criteria}. "
                    "For each criterion, explain what good looks like."
                ),

                expected_output=(
                    "A list of comparison criteria with definitions and "
                    "evaluation expectations for each."
                ),

            ),

            WorkflowStep(

                name="Search for candidate frameworks",

                instructions=(
                    "Search the research database for AI/LLM frameworks and "
                    "agent frameworks relevant to the objective. Use category "
                    "and keyword searches. Retrieve candidate frameworks with "
                    "their descriptions, categories, and source URLs."
                ),

                expected_output=(
                    "A list of candidate frameworks with names, descriptions, "
                    "categories, relevance scores, and source URLs."
                ),

            ),

            WorkflowStep(

                name="Retrieve framework details",

                instructions=(
                    "For each candidate framework, retrieve full details "
                    "including key topics, technologies, implementation ideas, "
                    "and limitations. Focus on architectural and capability "
                    "details relevant to the comparison criteria."
                ),

                expected_output=(
                    "Detailed profiles of each framework covering architecture, "
                    "capabilities, limitations, and source citations."
                ),

            ),

            WorkflowStep(

                name="Compare frameworks",

                instructions=(
                    f"Compare the frameworks using these criteria: {criteria}. "
                    "Create a structured comparison highlighting strengths, "
                    "weaknesses, and trade-offs for each framework. "
                    "Include source citations for every claim."
                ),

                expected_output=(
                    "A side-by-side comparison matrix with per-framework "
                    "assessments across all criteria and traceable citations."
                ),

            ),

            WorkflowStep(

                name="Generate recommendation",

                instructions=(
                    "Based on the comparison, recommend the most suitable "
                    "framework(s) for the stated objective. Justify the "
                    "recommendation with evidence and cite sources."
                ),

                expected_output=(
                    "A clear technical recommendation with rationale, "
                    "trade-offs, and supporting citations."
                ),

            ),

        ]

    def synthesize(
        self,
        objective: str,
        step_results: List[WorkflowStepResult],
    ) -> str:

        lines = [

            f"Framework Comparison: {objective}",

            f"Workflow: {self.workflow_type}",

            f"Steps completed: {len(step_results)}",

            "",

        ]

        for result in step_results:

            lines.append(f"## {result.step_name}")

            lines.append(result.answer)

            lines.append("")

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
