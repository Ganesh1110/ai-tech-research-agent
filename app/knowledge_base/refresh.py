"""Phase 5.7 — Knowledge refresh.

Detects stale documents (older than a threshold, missing embeddings, or
low relevance scores) and flags them for re-collection or re-embedding.
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from app.knowledge_base.storage import KnowledgeBaseStore


class KnowledgeRefresher:

    """Flags stale knowledge and re-embeds chunks missing vectors."""

    def __init__(self, store: Optional[KnowledgeBaseStore] = None):

        self.store = store or KnowledgeBaseStore()

    def find_stale_documents(

        self,

        max_age_days: int = 90,

        min_relevance: Optional[int] = None,

    ) -> List[Dict[str, Any]]:

        """Return documents that may need refreshing."""

        cutoff = datetime.now(timezone.utc) - timedelta(days=max_age_days)

        docs = self.store.list_documents(limit=1000)

        stale: List[Dict[str, Any]] = []

        for doc in docs:

            if not doc.created_at:

                continue

            created = doc.created_at

            # Normalize timezone for comparison (SQLite may return naive)

            if created.tzinfo is None:

                created = created.replace(tzinfo=timezone.utc)

            reasons: List[str] = []

            if created < cutoff:

                age_days = (datetime.now(timezone.utc) - created).days

                reasons.append(f"older than {max_age_days} days ({age_days} days old)")

            if min_relevance is not None:

                meta = doc.metadata_json or {}

                relevance = meta.get("relevance_score")

                if relevance is not None and relevance < min_relevance:

                    reasons.append(f"low relevance ({relevance} < {min_relevance})")

            chunks = self.store.get_chunks_for_document(doc.id)

            unembedded = [c for c in chunks if not c.embedding]

            if unembedded:

                reasons.append(f"{len(unembedded)} chunks missing embeddings")

            if reasons:

                stale.append(

                    {

                        "id": doc.id,

                        "title": doc.title,

                        "category": doc.category,

                        "run_type": doc.run_type,

                        "created_at": doc.created_at.isoformat()

                        if doc.created_at

                        else None,

                        "reasons": reasons,

                        "chunk_count": len(chunks),

                        "unembedded_chunks": len(unembedded),

                    }

                )

        return stale

    def chunks_missing_embeddings(self, limit: int = 100) -> List[Any]:

        """Return chunks that have no embedding vector yet."""

        chunks = self.store.get_all_chunks()

        return [c for c in chunks if not c.embedding][:limit]

    def summary(self) -> Dict[str, Any]:

        docs = self.store.list_documents(limit=1000)

        total_docs = len(docs)

        total_chunks = sum(len(self.store.get_chunks_for_document(d.id)) for d in docs)

        embedded_chunks = sum(

            1

            for d in docs

            for c in self.store.get_chunks_for_document(d.id)

            if c.embedding

        )

        stale = self.find_stale_documents()

        return {

            "total_documents": total_docs,

            "total_chunks": total_chunks,

            "embedded_chunks": embedded_chunks,

            "embedding_coverage": round(

                embedded_chunks / total_chunks, 4

            )

            if total_chunks

            else 0.0,

            "stale_document_count": len(stale),

        }


__all__ = ["KnowledgeRefresher"]
