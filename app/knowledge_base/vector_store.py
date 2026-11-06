"""Phase 5.2 — SQLite vector store with cosine similarity.

Stores embedding vectors as JSON blobs on DocumentChunk and performs
in-Python cosine similarity search. Keeps the vector index inside the
existing SQLite/PostgreSQL database (no ChromaDB dependency).
"""

import math
from typing import Any, Dict, List, Optional, Tuple

from app.knowledge_base.storage import KnowledgeBaseStore


def _cosine_similarity(a: List[float], b: List[float]) -> float:

    if len(a) != len(b):

        return 0.0

    dot = 0.0

    norm_a = 0.0

    norm_b = 0.0

    for x, y in zip(a, b):

        dot += x * y

        norm_a += x * x

        norm_b += y * y

    if norm_a == 0.0 or norm_b == 0.0:

        return 0.0

    return dot / (math.sqrt(norm_a) * math.sqrt(norm_b))


class SqliteVectorStore:

    """Vector search over DocumentChunk embeddings stored in the DB."""

    def __init__(self, store: KnowledgeBaseStore):

        self.store = store

    def search(

        self,

        query_embedding: List[float],

        top_k: int = 10,

        category: Optional[str] = None,

    ) -> List[Dict[str, Any]]:

        """Return top-k chunks most similar to the query embedding."""

        chunks = self.store.get_all_chunks()

        # Optionally filter by document category

        if category:

            # Load documents to filter

            docs = {

                d.id: d

                for d in self.store.list_documents(

                    category=category, limit=1000

                )

            }

            chunks = [c for c in chunks if c.document_id in docs]

        scored: List[Tuple[float, Any]] = []

        for chunk in chunks:

            embedding = chunk.embedding

            if not embedding:

                continue

            score = _cosine_similarity(query_embedding, embedding)

            scored.append((score, chunk))

        scored.sort(key=lambda x: x[0], reverse=True)

        results: List[Dict[str, Any]] = []

        for score, chunk in scored[:top_k]:

            doc = self.store.get_document(chunk.document_id)

            results.append(

                {

                    "chunk_id": chunk.id,

                    "document_id": chunk.document_id,

                    "chunk_index": chunk.chunk_index,

                    "content": chunk.content,

                    "similarity": round(score, 4),

                    "title": doc.title if doc else "Unknown",

                    "source_url": doc.source_url if doc else None,

                    "category": doc.category if doc else None,

                    "run_type": doc.run_type if doc else None,

                    "metadata": chunk.metadata_json,

                }

            )

        return results

    def store_embedding(self, chunk_id: int, embedding: List[float]) -> None:

        chunk = next(

            (

                c

                for c in self.store.get_all_chunks()

                if c.id == chunk_id

            ),

            None,

        )

        if chunk:

            chunk.embedding = embedding

            self.store.commit()


__all__ = ["SqliteVectorStore", "_cosine_similarity"]
