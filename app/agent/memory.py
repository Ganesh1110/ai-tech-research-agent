from datetime import datetime
from typing import Any, Dict, List, Optional

from app.agent.schemas import AgentStep, ToolResult


class ResearchMemory:

    """In-memory research context for a single agent session."""

    def __init__(self, objective: str):

        self.objective = objective
        self.steps: List[AgentStep] = []
        self.findings: List[Dict[str, Any]] = []
        self.sources: List[str] = []
        self.created_at = datetime.now().isoformat()

    def add_step(self, step: AgentStep) -> None:

        self.steps.append(step)

    def add_finding(self, finding: Dict[str, Any]) -> None:

        self.findings.append(finding)

        source = finding.get("url") or finding.get("title")

        if not source:

            data = finding.get("data", [])

            if isinstance(data, list):

                for item in data:

                    if isinstance(item, dict):

                        source = item.get("url") or item.get("title")

                        if source:

                            break

            elif isinstance(data, dict):

                source = data.get("url") or data.get("title")

        if source and source not in self.sources:

            self.sources.append(source)

    def add_tool_result(self, result: ToolResult) -> None:

        if result.success and result.data:

            self.add_finding(
                {
                    "tool": result.tool if hasattr(result, "tool") else "unknown",
                    "data": result.data,
                    "timestamp": datetime.now().isoformat(),
                }
            )

    def get_context_summary(self) -> str:

        lines = [f"Research Objective: {self.objective}"]
        lines.append(f"Total steps: {len(self.steps)}")
        lines.append(f"Total findings: {len(self.findings)}")
        lines.append(f"Sources: {len(self.sources)}")

        if self.findings:

            lines.append("\nKey findings:")

            for finding in self.findings[:10]:

                data = finding.get("data", {})

                if isinstance(data, list):

                    for item in data[:3]:

                        if isinstance(item, dict):

                            title = item.get("title", "Unknown")

                            lines.append(f"- {title}")

                elif isinstance(data, dict):

                    title = data.get("title", "Unknown")

                    lines.append(f"- {title}")

        return "\n".join(lines)

    def to_dict(self) -> Dict[str, Any]:

        return {
            "objective": self.objective,
            "steps": [step.model_dump() for step in self.steps],
            "findings": self.findings,
            "sources": self.sources,
            "created_at": self.created_at,
        }


__all__ = ["ResearchMemory"]