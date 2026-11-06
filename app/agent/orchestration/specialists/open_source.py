"""Open-source specialist agent."""

from typing import Any, Dict, Optional

from app.agent.agent import AutonomousAgent
from app.agent.orchestration.schemas import SpecialistType
from app.agent.orchestration.specialists import SpecialistAgent


class OpenSourceSpecialist(SpecialistAgent):

    """Researches open-source projects, licenses, and community trends."""

    @property

    def specialist_type(self) -> SpecialistType:

        return SpecialistType.OPEN_SOURCE

    @property

    def preferred_categories(self) -> list:

        return ["open-source", "github", "community"]

    @property

    def keyword_hints(self) -> list:

        return [

            "open source",

            "GitHub",

            "license",

            "community",

            "repository",

        ]


__all__ = ["OpenSourceSpecialist"]
