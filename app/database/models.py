from datetime import datetime, timezone

from sqlalchemy import (
    String,
    Text,
    DateTime,
    JSON,
    UniqueConstraint,
    Index
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