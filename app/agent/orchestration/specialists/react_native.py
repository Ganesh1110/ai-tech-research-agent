"""React Native specialist agent."""

from typing import Any, Dict, Optional

from app.agent.agent import AutonomousAgent
from app.agent.orchestration.schemas import SpecialistType
from app.agent.orchestration.specialists import SpecialistAgent


class ReactNativeSpecialist(SpecialistAgent):

    """Researches React Native, mobile development, and Expo topics."""

    @property

    def specialist_type(self) -> SpecialistType:

        return SpecialistType.REACT_NATIVE

    @property

    def preferred_categories(self) -> list:

        return ["react-native", "mobile", "expo"]

    @property

    def keyword_hints(self) -> list:

        return [

            "React Native",

            "Expo",

            "mobile",

            "iOS",

            "Android",

            "native modules",

        ]


__all__ = ["ReactNativeSpecialist"]
