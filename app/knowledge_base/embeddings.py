"""Phase 5.2 — Embedding provider using Ollama (nomic-embed-text).

Reuses the existing Ollama infrastructure instead of pulling a heavy
sentence-transformers/torch dependency. Defaults to the
nomic-embed-text model already available on the remote instance.
"""

import json
from typing import Any, Dict, List, Optional

import httpx

from app.config import settings


class OllamaEmbeddingProvider:

    """Generates embeddings via Ollama's /api/embed endpoint."""

    def __init__(

        self,

        base_url: Optional[str] = None,

        model: str = "nomic-embed-text",

    ):

        self.base_url = (base_url or settings.OLLAMA_BASE_URL).rstrip("/")

        self.model = model

    def embed(self, text: str) -> List[float]:

        """Return the embedding vector for a single text."""

        payload: Dict[str, Any] = {

            "model": self.model,

            "input": text,

        }

        with httpx.Client(timeout=60) as client:

            response = client.post(

                f"{self.base_url}/api/embed",

                json=payload,

            )

            response.raise_for_status()

            data = response.json()

        embeddings = data.get("embeddings")

        if not embeddings:

            # Some Ollama versions return a single embedding under "embedding"

            single = data.get("embedding")

            if single:

                return [float(x) for x in single]

            raise ValueError(f"No embeddings in Ollama response: {data}")

        return [float(x) for x in embeddings[0]]

    def embed_batch(self, texts: List[str]) -> List[List[float]]:

        """Return embeddings for multiple texts (one call per text)."""

        return [self.embed(t) for t in texts]

    def is_available(self) -> bool:

        try:

            with httpx.Client(timeout=10) as client:

                response = client.get(f"{self.base_url}/api/tags")

                return response.status_code == 200

        except Exception:

            return False


__all__ = ["OllamaEmbeddingProvider"]
