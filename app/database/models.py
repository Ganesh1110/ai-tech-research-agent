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
    DateTime as SQLDateTime,
)

from sqlalchemy.orm import Mapped, mapped_column

from app.database.db import Base


class ResearchItem(Base):

    __tablename__ = "research_items"

    __table_args__ = (
        UniqueConstraint(
            "url",
            name="uq_research_item_url"
        ),
        Index("idx_research_category", "category"),
        Index("idx_research_published", "published_at"),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True
    )

    title: Mapped[str] = mapped_column(
        String(1000),
        nullable=False
    )

    url: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    description: Mapped[str] = mapped_column(
        Text,
        default=""
    )

    source: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    category: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    published_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    discovered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )

    metadata_json: Mapped[dict] = mapped_column(
        JSON,
        default=dict
    )

    processing_status: Mapped[str] = mapped_column(
        String(50),
        default="pending",
        nullable=False,
    )

    ai_summary: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )

    ai_category: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )

    relevance_score: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
    )

    technical_value_score: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
    )

    novelty_score: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
    )

    key_topics: Mapped[Optional[list]] = mapped_column(
        JSON,
        nullable=True,
    )

    technologies: Mapped[Optional[list]] = mapped_column(
        JSON,
        nullable=True,
    )

    implementation_ideas: Mapped[Optional[list]] = mapped_column(
        JSON,
        nullable=True,
    )

    limitations: Mapped[Optional[list]] = mapped_column(
        JSON,
        nullable=True,
    )

    analysis_model: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )

    analyzed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    processing_error: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )


class CollectionRun(Base):

    __tablename__ = "collection_runs"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True
    )

    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )

    finished_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    duration_seconds: Mapped[float | None] = mapped_column(
        nullable=True
    )

    fetched_count: Mapped[int] = mapped_column(
        Integer,
        default=0
    )

    inserted_count: Mapped[int] = mapped_column(
        Integer,
        default=0
    )

    failed_sources: Mapped[list] = mapped_column(
        JSON,
        default=list
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="running"
    )