import json
import logging

from typing import Any, Dict, List, Optional

from app.config import settings
from app.llm.ollama_client import OllamaClient
from app.agent.schemas import ResearchPlan

logger = logging.getLogger(__name__)


PLANNING_PROMPT = """You are an autonomous research agent. Given a research objective, break it down into subtasks and identify which tools to use.

RESEARCH OBJECTIVE: {objective}

AVAILABLE TOOLS:
{tools}

Your job is to:
1. Break the objective into 3-6 concrete subtasks
2. Identify which tools from the list above are needed for each subtask
3. Define success criteria for knowing when the research is complete

Return ONLY a valid JSON object with these exact fields:
- "objective": restate the research objective
- "subtasks": list of subtask descriptions
- "tools_needed": list of tool names that will be useful
- "success_criteria": description of what constitutes complete research

IMPORTANT: Return ONLY valid JSON. No markdown, no code blocks, no explanatory text."""


class Planner:

    def __init__(self, model: Optional[str] = None):

        self.model = model or settings.OLLAMA_MODEL
        self.client = OllamaClient(model=self.model)

    def plan(
        self,
        objective: str,
        tool_descriptions: str,
    ) -> ResearchPlan:

        prompt = PLANNING_PROMPT.format(
            objective=objective,
            tools=tool_descriptions,
        )

        from app.llm.prompts import SYSTEM_PROMPT

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            "stream": False,
            "format": "json",
        }

        import httpx

        with httpx.Client(timeout=120) as client:

            response = client.post(
                f"{self.client.base_url}/api/chat",
                json=payload,
            )

            response.raise_for_status()

            data = response.json()

        content = data.get("message", {}).get("content", "")

        if not content:

            raise ValueError("Empty response from planner")

        try:

            plan_data = json.loads(content)

            return ResearchPlan(**plan_data)

        except (json.JSONDecodeError, ValueError) as error:

            logger.warning(
                "Failed to parse plan: %s. Raw: %s",
                error,
                content[:500],
            )

            return ResearchPlan(
                objective=objective,
                subtasks=[objective],
                tools_needed=["search_by_keyword"],
                success_criteria="Found relevant research items",
            )