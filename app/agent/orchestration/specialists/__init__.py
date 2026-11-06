"""Phase 4.2 — Specialist agents package."""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional

from app.agent.agent import AutonomousAgent
from app.agent.orchestration.schemas import SpecialistType


class SpecialistAgent(ABC):

    """Base class for domain-specific research specialists."""

    def __init__(
        self,
        agent: Optional[AutonomousAgent] = None,
        model: Optional[str] = None,
    ):

        self.agent = agent or AutonomousAgent(model=model)

    @property

    @abstractmethod

    def specialist_type(self) -> SpecialistType:

        ...

    @property

    @abstractmethod

    def preferred_categories(self) -> List[str]:

        ...

    @property

    @abstractmethod

    def keyword_hints(self) -> List[str]:

        ...

    def run(self, objective: str, context: Optional[Dict[str, Any]] = None):

        """Execute research for this specialist's domain."""

        context = context or {}

        instructions = self._build_instructions(objective, context)

        prompt = self._build_prompt(objective, instructions, context)

        return self.agent.run(objective=prompt)

    def _build_instructions(

        self,

        objective: str,

        context: Dict[str, Any],

    ) -> str:

        cats = ", ".join(self.preferred_categories)

        hints = ", ".join(self.keyword_hints)

        return (

            f"You are a {self.specialist_type.value} research specialist. "

            f"Research the objective from your domain perspective.\n\n"

            f"OBJECTIVE: {objective}\n"

            f"PREFERRED CATEGORIES: {cats}\n"

            f"KEYWORD HINTS: {hints}\n\n"

            "Focus your research on findings matching your preferred "

            "categories and keywords. Use the available database tools "

            "to gather evidence. Return findings with source citations.\n"

        )

    def _build_prompt(

        self,

        objective: str,

        instructions: str,

        context: Dict[str, Any],

    ) -> str:

        lines = [

            f"RESEARCH OBJECTIVE: {objective}",

            f"SPECIALIST: {self.specialist_type.value}",

            f"INSTRUCTIONS: {instructions}",

            "",

        ]

        if context:

            lines.append("CONTEXT:")

            for key, value in context.items():

                lines.append(f"  {key}: {value}")

            lines.append("")

        lines.append("Use the available database tools to gather evidence.")

        lines.append("Return findings with source citations.")

        return "\n".join(lines)


from app.agent.orchestration.specialists.ai_llm import AILlmSpecialist
from app.agent.orchestration.specialists.agentic_ai import AgenticAISpecialist
from app.agent.orchestration.specialists.developer_tools import (
    DeveloperToolsSpecialist,
)
from app.agent.orchestration.specialists.open_source import OpenSourceSpecialist
from app.agent.orchestration.specialists.react_native import (
    ReactNativeSpecialist,
)

__all__ = [
    "SpecialistAgent",
    "AILlmSpecialist",
    "AgenticAISpecialist",
    "ReactNativeSpecialist",
    "DeveloperToolsSpecialist",
    "OpenSourceSpecialist",
]

SPECIALIST_MAP = {

    "ai_llm": AILlmSpecialist,

    "agentic_ai": AgenticAISpecialist,

    "react_native": ReactNativeSpecialist,

    "developer_tools": DeveloperToolsSpecialist,

    "open_source": OpenSourceSpecialist,

}
