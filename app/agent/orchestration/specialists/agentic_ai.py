"""Agentic AI specialist agent."""

from typing import Any, Dict, Optional

from app.agent.agent import AutonomousAgent
from app.agent.orchestration.schemas import SpecialistType
from app.agent.orchestration.specialists import SpecialistAgent


class AgenticAISpecialist(SpecialistAgent):

    """Researches AI agents, multi-agent systems, and agent frameworks."""

    @property

    def specialist_type(self) -> SpecialistType:

        return SpecialistType.AGENTIC_AI

    @property

    def preferred_categories(self) -> list:

        return ["agentic-ai", "ai-agents", "multi-agent", "agents"]

    @property

    def keyword_hints(self) -> list:

        return [

            "AI agent",

            "agentic",

            "multi-agent",

            "agent framework",

            "tool-calling",

            "autonomous agent",

            "MCP",

        ]


__all__ = ["AgenticAISpecialist"]
