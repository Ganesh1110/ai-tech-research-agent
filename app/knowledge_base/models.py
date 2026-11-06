"""Phase 5.1 — Research document storage models.

Stores complete research outputs (agent/orchestrator runs) and their
text chunks for retrieval. These complement the existing
research_items/collection_runs tables as the structured source of truth.
"""

from typing import Optional

from datetime import datetime, timezone

from sqlalchemy import (
    String,
    Text,
    DateTime,
    JSON,
    UniqueConstraint,
    Index,
    Integer,
    ForeignKey,
)

from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.db import Base


class ResearchDocument(Base):

    """A stored research output (agent run, workflow run, or orchestrator run)."""

    __tablename__ = "research_documents"

    __table_args__ = (
        Index("idx_research_doc_category", "category"),
        Index("idx_research_doc_created", "created_at"),
        Index("idx_research_doc_type", "run_type"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    title: Mapped[str] = mapped_column(String(1000), nullable=False)

    content: Mapped[str] = mapped_column(Text, nullable=False)

    source_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    run_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # agent, workflow, orchestration

    run_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict)

    chunks: Mapped[list["DocumentChunk"]] = relationship(
        back_populates="document", cascade="all, delete-orphan"
    )


class DocumentChunk(Base):

    """A text chunk of a research document, with an embedding for semantic search."""

    __tablename__ = "document_chunks"

    __table_args__ = (
        Index("idx_doc_chunk_document", "document_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    document_id: Mapped[int] = mapped_column(
        ForeignKey("research_documents.id", ondelete="CASCADE"),
        nullable=False,
    )

    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)

    content: Mapped[str] = mapped_column(Text, nullable=False)

    embedding: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)

    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict)

    document: Mapped["ResearchDocument"] = relationship(
        back_populates="chunks"
    )


class KnowledgeGraphEntity(Base):

    """A node in the knowledge graph (technology, framework, paper, concept, etc.)."""

    __tablename__ = "kgraph_entities"

    __table_args__ = (
        UniqueConstraint(
            "name",
            "entity_type",
            name="uq_kgraph_entity_name_type",
        ),
        Index("idx_kgraph_entity_type", "entity_type"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    name: Mapped[str] = mapped_column(String(500), nullable=False)

    entity_type: Mapped[str] = mapped_column(String(100), nullable=False)

    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    outgoing: Mapped[list["KnowledgeGraphRelationship"]] = relationship(

        foreign_keys="KnowledgeGraphRelationship.source_entity_id",

        back_populates="source_entity",

        cascade="all, delete-orphan",

    )

    incoming: Mapped[list["KnowledgeGraphRelationship"]] = relationship(

        foreign_keys="KnowledgeGraphRelationship.target_entity_id",

        back_populates="target_entity",

    )


class KnowledgeGraphRelationship(Base):

    """A directed edge in the knowledge graph."""

    __tablename__ = "kgraph_relationships"

    __table_args__ = (

        Index("idx_kgraph_rel_source", "source_entity_id"),

        Index("idx_kgraph_rel_target", "target_entity_id"),

        Index("idx_kgraph_rel_type", "relationship_type"),

    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    source_entity_id: Mapped[int] = mapped_column(

        ForeignKey("kgraph_entities.id", ondelete="CASCADE"),

        nullable=False,

    )

    target_entity_id: Mapped[int] = mapped_column(

        ForeignKey("kgraph_entities.id", ondelete="CASCADE"),

        nullable=False,

    )

    relationship_type: Mapped[str] = mapped_column(String(100), nullable=False)

    weight: Mapped[float] = mapped_column(default=1.0, nullable=False)

    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    source_entity: Mapped["KnowledgeGraphEntity"] = relationship(

        foreign_keys=[source_entity_id], back_populates="outgoing"

    )

    target_entity: Mapped["KnowledgeGraphEntity"] = relationship(

        foreign_keys=[target_entity_id], back_populates="incoming"

    )


__all__ = [

    "ResearchDocument",

    "DocumentChunk",

    "KnowledgeGraphEntity",

    "KnowledgeGraphRelationship",

]

