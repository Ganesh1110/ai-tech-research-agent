"""Developer tools specialist agent."""

from typing import Any, Dict, Optional

from app.agent.agent import AutonomousAgent
from app.agent.orchestration.schemas import SpecialistType
from app.agent.orchestration.specialists import SpecialistAgent


class DeveloperToolsSpecialist(SpecialistAgent):

    """Researches developer tools, CLI, CI/CD, and local infrastructure."""

    @property

    def specialist_type(self) -> SpecialistType:

        return SpecialistType.DEVELOPER_TOOLS

    @property

    def preferred_categories(self) -> list:

        return ["developer-tools", "dev-tools", "cli", "infrastructure"]

    @property

    def keyword_hints(self) -> list:

        return [

            "developer tools",

            "CLI",

            "CI/CD",

            "Ollama",

            "local deployment",

            "infrastructure",

            "dev platform",

        ]


__all__ = ["DeveloperToolsSpecialist"]
