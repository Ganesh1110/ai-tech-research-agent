import logging
from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import func

from app.config import settings
from app.database.db import SessionLocal, create_tables
from app.database.models import ResearchItem
from app.llm.ollama_client import OllamaClient

logger = logging.getLogger(__name__)

BATCH_SIZE = 10


class IntelligenceProcessor:

    def __init__(
        self,
        model: Optional[str] = None,
        batch_size: int = BATCH_SIZE,
    ):

        self.model = model or settings.OLLAMA_MODEL
        self.batch_size = batch_size
        self.client = OllamaClient(model=self.model)

    def get_pending_items(self, limit: int) -> List[ResearchItem]:

        with SessionLocal() as db:

            items = (
                db.query(ResearchItem)
                .filter(
                    ResearchItem.processing_status == "pending"
                )
                .order_by(ResearchItem.discovered_at.desc())
                .limit(limit)
                .all()
            )

            return items

    def get_item_count_by_status(self) -> dict:

        with SessionLocal() as db:

            rows = (
                db.query(
                    ResearchItem.processing_status,
                    func.count(ResearchItem.id),
                )
                .group_by(ResearchItem.processing_status)
                .all()
            )

            return {status: count for status, count in rows}

    def process_item(self, item: ResearchItem) -> bool:

        description = item.description or ""

        try:

            item.processing_status = "processing"

            with SessionLocal.begin() as db:

                db.merge(item)

            result = self.client.analyze(
                title=item.title,
                source=item.source,
                category=item.category,
                published=(
                    item.published_at.isoformat()
                    if item.published_at
                    else None
                ),
                description=description,
                model=self.model,
            )

            analysis = result.analysis

            with SessionLocal.begin() as db:

                db_item = (
                    db.query(ResearchItem)
                    .filter(ResearchItem.id == item.id)
                    .first()
                )

                if not db_item:

                    logger.warning(
                        "Item %s not found in database during update",
                        item.id,
                    )

                    return False

                db_item.processing_status = "completed"
                db_item.ai_summary = analysis.summary
                db_item.ai_category = analysis.category
                db_item.relevance_score = analysis.relevance_score
                db_item.technical_value_score = (
                    analysis.technical_value_score
                )
                db_item.novelty_score = analysis.novelty_score
                db_item.key_topics = analysis.key_topics
                db_item.technologies = analysis.technologies
                db_item.implementation_ideas = (
                    analysis.implementation_ideas
                )
                db_item.limitations = analysis.limitations
                db_item.analysis_model = result.model_used
                db_item.analyzed_at = datetime.now(timezone.utc)
                db_item.processing_error = None

                db.merge(db_item)

            logger.info(
                "Processed item %s: %s (relevance=%s, value=%s)",
                item.id,
                item.title[:60],
                analysis.relevance_score,
                analysis.technical_value_score,
            )

            return True

        except Exception as error:

            logger.exception(
                "Failed to process item %s: %s",
                item.id,
                error,
            )

            try:

                with SessionLocal.begin() as db:

                    db_item = (
                        db.query(ResearchItem)
                        .filter(ResearchItem.id == item.id)
                        .first()
                    )

                    if db_item:

                        db_item.processing_status = "failed"
                        db_item.processing_error = str(error)[:1000]

                        db.merge(db_item)

            except Exception as db_error:

                logger.exception(
                    "Failed to record error for item %s: %s",
                    item.id,
                    db_error,
                )

            return False

    def process_batch(self, batch_size: Optional[int] = None) -> dict:

        create_tables()

        limit = batch_size or self.batch_size

        items = self.get_pending_items(limit)

        if not items:

            logger.info("No pending items to process")

            return {
                "processed": 0,
                "succeeded": 0,
                "failed": 0,
                "remaining": 0,
            }

        succeeded = 0
        failed = 0

        for item in items:

            if self.process_item(item):

                succeeded += 1

            else:

                failed += 1

        remaining = self.get_item_count_by_status().get("pending", 0)

        logger.info(
            "Batch complete: %s succeeded, %s failed, %s remaining",
            succeeded,
            failed,
            remaining,
        )

        return {
            "processed": len(items),
            "succeeded": succeeded,
            "failed": failed,
            "remaining": remaining,
        }

    def process_all(self) -> dict:

        total_processed = 0
        total_succeeded = 0
        total_failed = 0

        while True:

            result = self.process_batch()

            if result["processed"] == 0:

                break

            total_processed += result["processed"]
            total_succeeded += result["succeeded"]
            total_failed += result["failed"]

        return {
            "processed": total_processed,
            "succeeded": total_succeeded,
            "failed": total_failed,
        }


def run_intelligence(
    model: Optional[str] = None,
    batch_size: Optional[int] = None,
    process_all_items: bool = False,
) -> dict:

    processor = IntelligenceProcessor(
        model=model,
        batch_size=batch_size or BATCH_SIZE,
    )

    if not processor.client.is_available():

        raise RuntimeError(
            "Ollama is not available at http://localhost:11434. "
            "Start it with 'ollama serve'."
        )

    if process_all_items:

        return processor.process_all()

    return processor.process_batch(batch_size)