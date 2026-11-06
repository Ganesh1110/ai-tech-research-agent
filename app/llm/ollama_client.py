import json
import logging
from typing import Any, Dict, Optional

import httpx

from app.config import settings
from app.llm.schemas import IntelligenceResult, ResearchAnalysis

logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = settings.OLLAMA_BASE_URL
DEFAULT_MODEL = "llama3.1:8b"


class OllamaClient:

    def __init__(
        self,
        base_url: str = OLLAMA_BASE_URL,
        model: str = DEFAULT_MODEL,
        timeout: int = 120,
    ):

        self.base_url = base_url
        self.model = model
        self.timeout = timeout

    def is_available(self) -> bool:

        try:

            with httpx.Client(timeout=10) as client:

                response = client.get(f"{self.base_url}/api/tags")

                return response.status_code == 200

        except Exception:

            return False

    def analyze(
        self,
        title: str,
        source: str,
        category: str,
        published: Optional[str],
        description: str,
        model: Optional[str] = None,
    ) -> IntelligenceResult:

        from app.llm.prompts import (
            SYSTEM_PROMPT,
            build_analysis_prompt,
        )

        model_name = model or self.model
        prompt = build_analysis_prompt(
            title=title,
            source=source,
            category=category,
            published=published,
            description=description,
        )

        payload: Dict[str, Any] = {
            "model": model_name,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            "stream": False,
            "format": "json",
        }

        with httpx.Client(timeout=self.timeout) as client:

            response = client.post(
                f"{self.base_url}/api/chat",
                json=payload,
            )

            response.raise_for_status()

            data = response.json()

        content = data.get("message", {}).get("content", "")

        if not content:

            raise ValueError("Empty response from Ollama")

        try:

            analysis_data = json.loads(content)

            analysis = ResearchAnalysis(**analysis_data)

        except (json.JSONDecodeError, ValueError) as error:

            logger.warning(
                "Failed to parse structured response: %s. Raw content: %s",
                error,
                content[:500],
            )

            analysis = ResearchAnalysis(
                summary=content[:500],
                category=category,
                relevance_score=0,
                technical_value_score=0,
                novelty_score=0,
                key_topics=[],
                technologies=[],
                implementation_ideas=[],
                limitations=["Failed to parse LLM response"],
                why_it_matters="Parsing failed; manual review required",
            )

        return IntelligenceResult(
            analysis=analysis,
            model_used=model_name,
            processed_at=data.get("created_at", ""),
        )

    def generate_json(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generate structured JSON directly using Ollama."""
        model_name = model or self.model
        sys = system_prompt or "You are an expert AI startup strategist and technical architect. Return ONLY valid JSON."
        payload: Dict[str, Any] = {
            "model": model_name,
            "messages": [
                {"role": "system", "content": sys},
                {"role": "user", "content": prompt},
            ],
            "stream": False,
            "format": "json",
        }

        with httpx.Client(timeout=self.timeout) as client:
            response = client.post(f"{self.base_url}/api/chat", json=payload)
            response.raise_for_status()
            data = response.json()

        content = data.get("message", {}).get("content", "").strip()
        if not content:
            raise ValueError("Empty response from Ollama")

        return json.loads(content)
