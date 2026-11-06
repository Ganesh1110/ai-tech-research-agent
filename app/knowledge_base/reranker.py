"""Phase 5.4 — Reranking.

A pluggable reranker that refines hybrid retrieval results. The default
is a lightweight lexical reranker (query-term overlap, position, source
quality signals). A real cross-encoder (e.g. cross-encoder/ms-marco-
MiniLM-L-6-v2) can be swapped in by subclassing CrossEncoderReranker.
"""

from __future__ import annotations

import re
from typing import Any, Callable, Dict, List, Optional, Tuple

from app.knowledge_base.retrieval import _tokenize


class CrossEncoderReranker:

    """Reranks retrieved chunks for a query.

    Subclass and override _score() to plug in a real cross-encoder model.
    """

    def __init__(self, model_name: Optional[str] = None):

        self.model_name = model_name

    def rerank(

        self,

        query: str,

        results: List[Dict[str, Any]],

        top_k: Optional[int] = None,

    ) -> List[Dict[str, Any]]:

        """Return results reordered by relevance to the query."""

        if not results:

            return results

        query_terms = set(_tokenize(query))

        scored: List[Tuple[float, Dict[str, Any]]] = []

        for result in results:

            score = self._score(query, query_terms, result)

            scored.append((score, result))

        scored.sort(key=lambda x: x[0], reverse=True)

        reranked = [r for _, r in scored]

        if top_k is not None:

            reranked = reranked[:top_k]

        return reranked

    def _score(

        self,

        query: str,

        query_terms: set,

        result: Dict[str, Any],

    ) -> float:

        """Default lexical relevance score (pluggable)."""

        content = result.get("content", "")

        content_terms = set(_tokenize(content))

        title = result.get("title", "") or ""

        title_terms = set(_tokenize(title))

        # Query term overlap in content

        content_overlap = len(query_terms & content_terms) / max(

            len(query_terms), 1

        )

        # Query term overlap in title (higher weight)

        title_overlap = len(query_terms & title_terms) / max(len(query_terms), 1)

        # Existing signals

        rrf_score = result.get("rrf_score", 0.0) or 0.0

        vector_sim = result.get("vector_similarity") or 0.0

        bm25_score = result.get("bm25_score") or 0.0

        # Relevance score boost

        relevance = result.get("metadata", {}).get("relevance_score") or 0

        relevance_boost = min(relevance / 100.0, 1.0) * 0.1

        score = (

            0.4 * content_overlap

            + 0.25 * title_overlap

            + 0.15 * rrf_score

            + 0.1 * vector_sim

            + 0.05 * bm25_score

            + relevance_boost

        )

        return round(score, 4)


__all__ = ["CrossEncoderReranker"]
