"""AI/LLM specialist agent."""

from typing import Any, Dict, Optional

from app.agent.agent import AutonomousAgent
from app.agent.orchestration.schemas import SpecialistType
from app.agent.orchestration.specialists import SpecialistAgent


class AILlmSpecialist(SpecialistAgent):

    """Researches AI, LLM, generative AI, and foundation model topics."""

    @property

    def specialist_type(self) -> SpecialistType:

        return SpecialistType.AI_LLM

    @property

    def preferred_categories(self) -> list:

        return ["ai-llm", "ai_llm", "AI/LLM", "generative-ai"]

    @property

    def keyword_hints(self) -> list:

        return [

            "LLM",

            "large language model",

            "foundation model",

            "generative AI",

            "inference",

            "quantization",

            "fine-tuning",

            "transformer",

        ]


__all__ = ["AILlmSpecialist"]
