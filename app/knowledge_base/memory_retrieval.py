"""Phase 5.6 — Agent memory retrieval from prior research.

Lets specialists query the knowledge base for relevant prior research
before executing, so they build on existing findings instead of
re-researching from scratch.
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from app.knowledge_base.embeddings import OllamaEmbeddingProvider
from app.knowledge_base.retrieval import HybridRetriever
from app.knowledge_base.storage import KnowledgeBaseStore


class MemoryRetriever:

    """Retrieves prior research context for a query and formats it for agents."""

    def __init__(

        self,

        store: Optional[KnowledgeBaseStore] = None,

        embedder: Optional[OllamaEmbeddingProvider] = None,

        retriever: Optional[HybridRetriever] = None,

    ):

        self.store = store or KnowledgeBaseStore()

        self.embedder = embedder or OllamaEmbeddingProvider()

        self.retriever = retriever or HybridRetriever(self.store)

    def retrieve_context(

        self,

        query: str,

        top_k: int = 5,

        category: Optional[str] = None,

    ) -> str:

        """Return prior research context as formatted text for agent prompts."""

        if not self.embedder.is_available():

            return ""

        try:

            query_embedding = self.embedder.embed(query)

        except Exception:

            return ""

        results = self.retriever.retrieve(

            query=query,

            query_embedding=query_embedding,

            top_k=top_k,

            category=category,

        )

        if not results:

            return ""

        lines = ["## Prior Research Context (from knowledge base)",""]

        for idx, result in enumerate(results, 1):

            title = result.get("title", "Unknown")

            source = result.get("source_url", "")

            content = result.get("content", "")[:400]

            category_name = result.get("category", "unknown")

            lines.append(

                f"{idx}. {title} [{category_name}]"

            )

            lines.append(f"   Source: {source}")

            lines.append(f"   Excerpt: {content}...")

            lines.append("")

        return "\n".join(lines)

    def get_recent_documents(

        self,

        days: int = 30,

        limit: int = 20,

    ) -> List[Dict[str, Any]]:

        """List recently stored research documents."""

        cutoff = datetime.now(timezone.utc) - timedelta(days=days)

        # naive filter in Python

        docs = self.store.list_documents(limit=limit * 3)

        recent = [

            {

                "id": d.id,

                "title": d.title,

                "category": d.category,

                "run_type": d.run_type,

                "created_at": d.created_at.isoformat() if d.created_at else None,

                "source_url": d.source_url,

            }

            for d in docs

            if d.created_at

            and (

                d.created_at.replace(tzinfo=timezone.utc)

                if d.created_at.tzinfo is None

                else d.created_at

            )

            >= cutoff

        ]

        return recent[:limit]


__all__ = ["MemoryRetriever"]
