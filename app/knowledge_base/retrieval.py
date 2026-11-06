"""Phase 5.3 — Hybrid retrieval (BM25 keyword + vector semantic search).

Combines lexical BM25 scoring with cosine-similarity vector search
using Reciprocal Rank Fusion (RRF). Pure Python — no extra dependencies.
"""

import re
from collections import Counter
from math import log
from typing import Any, Dict, List, Optional, Tuple

from app.knowledge_base.storage import KnowledgeBaseStore
from app.knowledge_base.vector_store import SqliteVectorStore


def _tokenize(text: str) -> List[str]:

    return [t for t in re.findall(r"\w+", text.lower()) if t]


class BM25:

    """Pure-Python BM25 ranking over a corpus of documents."""

    def __init__(self, corpus: List[List[str]]):

        self.corpus = corpus

        self.doc_count = len(corpus)

        self.avgdl = (

            sum(len(doc) for doc in corpus) / self.doc_count if self.doc_count else 0

        )

        self.doc_freqs: List[Counter] = []

        self.idf: Dict[str, float] = {}

        df: Counter = Counter()

        for doc in corpus:

            freqs = Counter(doc)

            self.doc_freqs.append(freqs)

            for term in freqs:

                df[term] += 1

        for term, freq in df.items():

            self.idf[term] = log((self.doc_count - freq + 0.5) / (freq + 0.5) + 1.0)

    def score(self, query_terms: List[str], doc_index: int) -> float:

        freqs = self.doc_freqs[doc_index]

        doc_len = len(self.corpus[doc_index])

        k1 = 1.5

        b = 0.75

        score = 0.0

        for term in query_terms:

            if term not in freqs:

                continue

            tf = freqs[term]

            idf = self.idf.get(term, 0.0)

            numerator = tf * (k1 + 1)

            denominator = tf + k1 * (1 - b + b * (doc_len / self.avgdl))

            score += idf * (numerator / denominator)

        return score

    def search(self, query: str, top_k: int = 10) -> List[Tuple[int, float]]:

        query_terms = _tokenize(query)

        if not query_terms or not self.corpus:

            return []

        scores = [

            (self.score(query_terms, i), i) for i in range(self.doc_count)

        ]

        scores.sort(key=lambda x: x[0], reverse=True)

        return [(idx, round(score, 4)) for score, idx in scores[:top_k] if score > 0]


class HybridRetriever:

    """Combines BM25 and vector search via Reciprocal Rank Fusion."""

    def __init__(self, store: KnowledgeBaseStore):

        self.store = store

        self.vector_store = SqliteVectorStore(store)

        self._chunks: List[Any] = []

        self._corpus: List[List[str]] = []

        self._bm25: Optional[BM25] = None

    def _refresh_corpus(self, category: Optional[str] = None) -> None:

        chunks = self.store.get_all_chunks()

        if category:

            docs = {

                d.id: d

                for d in self.store.list_documents(

                    category=category, limit=1000

                )

            }

            chunks = [c for c in chunks if c.document_id in docs]

        self._chunks = chunks

        self._corpus = [_tokenize(c.content) for c in chunks]

        self._bm25 = BM25(self._corpus)

    def _rrf(

        self,

        ranked_lists: List[List[Tuple[int, float]]],

        k: int = 60,

    ) -> List[Tuple[int, float]]:

        """Reciprocal Rank Fusion across multiple ranked lists."""

        scores: Dict[int, float] = {}

        for ranked in ranked_lists:

            for rank, (doc_idx, _) in enumerate(ranked, start=1):

                scores[doc_idx] = scores.get(doc_idx, 0.0) + 1.0 / (k + rank)

        return sorted(scores.items(), key=lambda x: x[1], reverse=True)

    def retrieve(

        self,

        query: str,

        query_embedding: List[float],

        top_k: int = 10,

        category: Optional[str] = None,

    ) -> List[Dict[str, Any]]:

        """Retrieve top-k chunks using hybrid BM25 + vector search."""

        self._refresh_corpus(category=category)

        if not self._chunks:

            return []

        # BM25 ranking

        bm25_ranked = self._bm25.search(query, top_k=top_k * 2)

        bm25_map = {idx: score for score, idx in bm25_ranked}

        # Vector ranking

        vector_results = self.vector_store.search(

            query_embedding, top_k=top_k * 2, category=category

        )

        vector_map = {r["chunk_id"]: r["similarity"] for r in vector_results}

        # Build index lookup: chunk positional index -> chunk record

        chunk_by_pos: Dict[int, Any] = {}

        for i, chunk in enumerate(self._chunks):

            chunk_by_pos[i] = chunk

        # RRF over BM25 positional indices

        bm25_positions = [(idx, score) for score, idx in bm25_ranked]

        vector_positions = [

            (

                next(

                    (

                        i

                        for i, c in enumerate(self._chunks)

                        if c.id == r["chunk_id"]

                    ),

                    None,

                ),

                sim,

            )

            for r, sim in zip(vector_results, vector_results)

            if (

                next(

                    (

                        i

                        for i, c in enumerate(self._chunks)

                        if c.id == r["chunk_id"]

                    ),

                    None,

                )

                is not None

            )

        ]

        fused = self._rrf([bm25_positions, vector_positions])

        # Build final results

        results: List[Dict[str, Any]] = []

        seen_chunk_ids: set = set()

        for pos, rrf_score in fused:

            if pos is None:

                continue

            chunk = chunk_by_pos.get(pos)

            if not chunk or chunk.id in seen_chunk_ids:

                continue

            seen_chunk_ids.add(chunk.id)

            doc = self.store.get_document(chunk.document_id)

            results.append(

                {

                    "chunk_id": chunk.id,

                    "document_id": chunk.document_id,

                    "chunk_index": chunk.chunk_index,

                    "content": chunk.content,

                    "rrf_score": round(rrf_score, 4),

                    "bm25_score": bm25_map.get(pos),

                    "vector_similarity": vector_map.get(chunk.id),

                    "title": doc.title if doc else "Unknown",

                    "source_url": doc.source_url if doc else None,

                    "category": doc.category if doc else None,

                    "run_type": doc.run_type if doc else None,

                    "metadata": chunk.metadata_json,

                }

            )

            if len(results) >= top_k:

                break

        return results


__all__ = ["HybridRetriever", "BM25"]
