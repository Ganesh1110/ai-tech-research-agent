from sqlalchemy import (
    create_engine,
    text,
)
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.config import settings


engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10
)


SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    expire_on_commit=False
)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()

    try:

        yield db

    finally:

        db.close()


def _column_exists(connection, table_name: str, column_name: str) -> bool:

    dialect = connection.dialect.name

    if dialect == "sqlite":

        result = connection.execute(
            text(f"PRAGMA table_info({table_name})")
        )

        return any(
            row[1] == column_name for row in result.fetchall()
        )

    result = connection.execute(
        text(
            "SELECT 1 FROM information_schema.columns "
            "WHERE table_name = :table AND column_name = :column"
        ),
        {"table": table_name, "column": column_name},
    )

    return result.fetchone() is not None


def migrate_database():

    from app.database.models import ResearchItem

    # Import knowledge_base models so they are registered on Base

    from app.knowledge_base.models import (  # noqa: F401

        ResearchDocument,

        DocumentChunk,

    )

    Base.metadata.create_all(bind=engine)

    new_columns = [
        ("processing_status", "VARCHAR(50) DEFAULT 'pending'"),
        ("ai_summary", "TEXT"),
        ("ai_category", "VARCHAR(100)"),
        ("relevance_score", "INTEGER"),
        ("technical_value_score", "INTEGER"),
        ("novelty_score", "INTEGER"),
        ("key_topics", "JSON"),
        ("technologies", "JSON"),
        ("implementation_ideas", "JSON"),
        ("limitations", "JSON"),
        ("analysis_model", "VARCHAR(100)"),
        ("analyzed_at", "TIMESTAMP"),
        ("processing_error", "TEXT"),
    ]

    with engine.connect() as connection:

        for column_name, column_type in new_columns:

            if not _column_exists(connection, "research_items", column_name):

                connection.execute(
                    text(
                        f"ALTER TABLE research_items "
                        f"ADD COLUMN {column_name} {column_type}"
                    )
                )

        connection.commit()


def create_tables():

    migrate_database()