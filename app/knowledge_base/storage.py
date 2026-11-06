"""Phase 5.1 — Research document storage.

Persists research outputs and their chunks to the SQLite/PostgreSQL
database, complementing the existing research_items table as the
structured source of truth.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from app.database.db import SessionLocal
from app.knowledge_base.models import DocumentChunk, ResearchDocument


class KnowledgeBaseStore:

    """CRUD operations for research documents and chunks."""

    def __init__(self, db: Optional[Session] = None):

        self._owns_session = db is None

        self.db = db or SessionLocal()

    def __enter__(self):

        return self

    def __exit__(self, exc_type, exc_val, exc_tb):

        if self._owns_session:

            self.db.close()

    # ---- documents ------------------------------------------------------

    def store_document(

        self,

        title: str,

        content: str,

        source_url: Optional[str] = None,

        category: Optional[str] = None,

        run_type: str = "agent",

        run_id: Optional[str] = None,

        metadata: Optional[Dict[str, Any]] = None,

    ) -> ResearchDocument:

        doc = ResearchDocument(

            title=title,

            content=content,

            source_url=source_url,

            category=category,

            run_type=run_type,

            run_id=run_id,

            metadata_json=metadata or {},

        )

        self.db.add(doc)

        self.db.flush()

        return doc

    def get_document(self, document_id: int) -> Optional[ResearchDocument]:

        return self.db.query(ResearchDocument).get(document_id)

    def list_documents(

        self,

        category: Optional[str] = None,

        run_type: Optional[str] = None,

        limit: int = 50,

    ) -> List[ResearchDocument]:

        query = self.db.query(ResearchDocument)

        if category:

            query = query.filter(ResearchDocument.category.ilike(f"%{category}%"))

        if run_type:

            query = query.filter(ResearchDocument.run_type == run_type)

        return query.order_by(ResearchDocument.created_at.desc()).limit(limit).all()

    # ---- chunks ---------------------------------------------------------

    def add_chunk(

        self,

        document_id: int,

        chunk_index: int,

        content: str,

        embedding: Optional[List[float]] = None,

        metadata: Optional[Dict[str, Any]] = None,

    ) -> DocumentChunk:

        chunk = DocumentChunk(

            document_id=document_id,

            chunk_index=chunk_index,

            content=content,

            embedding=embedding,

            metadata_json=metadata or {},

        )

        self.db.add(chunk)

        self.db.flush()

        return chunk

    def get_chunks_for_document(self, document_id: int) -> List[DocumentChunk]:

        return (

            self.db.query(DocumentChunk)

            .filter(DocumentChunk.document_id == document_id)

            .order_by(DocumentChunk.chunk_index)

            .all()

        )

    def get_all_chunks(self) -> List[DocumentChunk]:

        return self.db.query(DocumentChunk).all()

    def commit(self) -> None:

        self.db.commit()

    def close(self) -> None:

        if self._owns_session:

            self.db.close()


__all__ = ["KnowledgeBaseStore"]
