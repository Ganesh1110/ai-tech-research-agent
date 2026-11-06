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


class DiscoveryCycle(Base):

    """Every scheduled discovery cycle execution."""

    __tablename__ = "discovery_cycles"

    __table_args__ = (
        Index("idx_discovery_cycle_started", "started_at"),
        Index("idx_discovery_cycle_status", "status"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    finished_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    duration_seconds: Mapped[float | None] = mapped_column(nullable=True)

    items_collected: Mapped[int] = mapped_column(Integer, default=0)

    items_new: Mapped[int] = mapped_column(Integer, default=0)

    items_deduped: Mapped[int] = mapped_column(Integer, default=0)

    high_potential_count: Mapped[int] = mapped_column(Integer, default=0)

    failed_collectors: Mapped[list] = mapped_column(JSON, default=list)

    status: Mapped[str] = mapped_column(String(50), default="running")


class DiscoveredItem(Base):

    """A discovered repository, skill, model, paper, or tool."""

    __tablename__ = "discovered_items"

    __table_args__ = (
        UniqueConstraint(
            "external_id",
            "source",
            name="uq_discovered_item_external_source",
        ),
        Index("idx_discovered_item_category", "category"),
        Index("idx_discovered_item_source", "source"),
        Index("idx_discovered_item_score", "overall_score"),
        Index("idx_discovered_item_first_seen", "first_seen_at"),
        Index("idx_discovered_item_last_checked", "last_checked_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    external_id: Mapped[str] = mapped_column(String(500), nullable=False)

    source: Mapped[str] = mapped_column(String(100), nullable=False)

    title: Mapped[str] = mapped_column(String(1000), nullable=False)

    description: Mapped[str] = mapped_column(Text, default="")

    url: Mapped[str] = mapped_column(Text, nullable=False)

    category: Mapped[str] = mapped_column(String(100), nullable=False)

    first_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    last_checked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    last_changed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict)

    overall_score: Mapped[float | None] = mapped_column(nullable=True)

    recommendation_level: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )


class DiscoveryScore(Base):

    """Ranking factor scores for a discovered item."""

    __tablename__ = "discovery_scores"

    __table_args__ = (
        Index("idx_discovery_score_item", "discovered_item_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    discovered_item_id: Mapped[int] = mapped_column(
        ForeignKey("discovered_items.id", ondelete="CASCADE"),
        nullable=False,
    )

    relevance_score: Mapped[float] = mapped_column(default=0.0)

    novelty_score: Mapped[float] = mapped_column(default=0.0)

    technical_usefulness_score: Mapped[float] = mapped_column(default=0.0)

    maturity_score: Mapped[float] = mapped_column(default=0.0)

    application_value_score: Mapped[float] = mapped_column(default=0.0)

    overall_score: Mapped[float] = mapped_column(default=0.0)

    scored_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    model_used: Mapped[str | None] = mapped_column(String(100), nullable=True)


class Recommendation(Base):

    """AI-generated recommendation for a discovered item."""

    __tablename__ = "recommendations"

    __table_args__ = (
        Index("idx_recommendation_item", "discovered_item_id"),
        Index("idx_recommendation_level", "recommendation_level"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    discovered_item_id: Mapped[int] = mapped_column(
        ForeignKey("discovered_items.id", ondelete="CASCADE"),
        nullable=False,
    )

    recommendation_level: Mapped[str] = mapped_column(String(50), nullable=False)

    reason: Mapped[str] = mapped_column(Text, default="")

    suggested_action: Mapped[str] = mapped_column(Text, default="")

    confidence: Mapped[float] = mapped_column(default=0.0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )


class AgentJob(Base):

    """Queued and executing research tasks."""

    __tablename__ = "agent_jobs"

    __table_args__ = (
        Index("idx_agent_job_status", "status"),
        Index("idx_agent_job_created", "created_at"),
        Index("idx_agent_job_worker", "worker_type"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    job_type: Mapped[str] = mapped_column(String(100), nullable=False)

    worker_type: Mapped[str] = mapped_column(String(100), nullable=False)

    payload: Mapped[dict] = mapped_column(JSON, default=dict)

    status: Mapped[str] = mapped_column(
        String(50), default="pending"
    )  # pending, running, completed, failed

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    finished_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    result: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    error: Mapped[str | None] = mapped_column(Text, nullable=True)

    retry_count: Mapped[int] = mapped_column(Integer, default=0)

    max_retries: Mapped[int] = mapped_column(Integer, default=3)


class BrainstormSession(Base):

    """Persistent brainstorming conversation session."""

    __tablename__ = "brainstorm_sessions"

    __table_args__ = (
        Index("idx_brainstorm_session_updated", "updated_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    title: Mapped[str] = mapped_column(String(500), nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )


class BrainstormMessage(Base):

    """User and agent messages in a brainstorming session."""

    __tablename__ = "brainstorm_messages"

    __table_args__ = (
        Index("idx_brainstorm_message_session", "session_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    session_id: Mapped[int] = mapped_column(
        ForeignKey("brainstorm_sessions.id", ondelete="CASCADE"),
        nullable=False,
    )

    role: Mapped[str] = mapped_column(String(50), nullable=False)  # user, agent

    content: Mapped[str] = mapped_column(Text, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )


class FeasibilityReport(Base):

    """Technical feasibility assessment for a brainstormed idea."""

    __tablename__ = "feasibility_reports"

    __table_args__ = (
        Index("idx_feasibility_session", "session_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    session_id: Mapped[int] = mapped_column(
        ForeignKey("brainstorm_sessions.id", ondelete="CASCADE"),
        nullable=False,
    )

    technically_feasible: Mapped[bool] = mapped_column(default=False)

    architecture_compatibility: Mapped[str | None] = mapped_column(
        String(500), nullable=True
    )

    integration_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    security_implications: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )

    performance_overhead: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )

    recommended_action: Mapped[str | None] = mapped_column(
        String(200), nullable=True
    )

    confidence: Mapped[float] = mapped_column(default=0.0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )


class SourceCheck(Base):

    """Verification and freshness history for external sources."""

    __tablename__ = "source_checks"

    __table_args__ = (
        Index("idx_source_check_source", "source"),
        Index("idx_source_check_checked_at", "checked_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    source: Mapped[str] = mapped_column(String(200), nullable=False)

    checked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    items_found: Mapped[int] = mapped_column(Integer, default=0)

    items_new: Mapped[int] = mapped_column(Integer, default=0)

    status: Mapped[str] = mapped_column(String(50), default="ok")

    error: Mapped[str | None] = mapped_column(Text, nullable=True)


__all__ = [

    "ResearchItem",

    "CollectionRun",

    "DiscoveryCycle",

    "DiscoveredItem",

    "DiscoveryScore",

    "Recommendation",

    "AgentJob",

    "BrainstormSession",

    "BrainstormMessage",

    "FeasibilityReport",

    "SourceCheck",

]
