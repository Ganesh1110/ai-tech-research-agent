import argparse
import logging

from datetime import datetime
from zoneinfo import ZoneInfo

from apscheduler.schedulers.blocking import BlockingScheduler
from sqlalchemy.dialects.postgresql import insert

from app.config import settings

from app.database.db import (
    SessionLocal,
    create_tables
)

from app.database.models import ResearchItem

from app.collectors.github import (
    fetch_github_repositories
)

from app.collectors.rss import (
    fetch_rss_feeds
)

from app.collectors.arxiv import (
    fetch_arxiv_papers
)


logging.basicConfig(
    level=settings.LOG_LEVEL,
    format="%(asctime)s | %(levelname)s | %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(
            "logs/research.log"
        )
    ]
)

logger = logging.getLogger(__name__)


def run_collection():

    logger.info("Starting research collection")

    all_items = []

    collectors = [
        ("GitHub", fetch_github_repositories),
        ("RSS", fetch_rss_feeds),
        ("arXiv", fetch_arxiv_papers),
    ]

    for name, collector in collectors:

        try:

            items = collector()

            all_items.extend(items)

            logger.info(
                "%s collected %s items",
                name,
                len(items)
            )

        except Exception:

            logger.exception(
                "%s collector failed",
                name
            )

    if not all_items:

        logger.warning("No research items collected")
        return

    rows = []

    for item in all_items:

        if not item.get("url") or not item.get("title"):
            continue

        rows.append({

            "title": item["title"][:1000],

            "url": item["url"],

            "description": item.get(
                "description", ""
            ),

            "source": item["source"],

            "category": item["category"],

            "published_at": item.get(
                "published_at"
            ),

            "metadata_json": item.get(
                "metadata", {}
            )
        })

    if not rows:
        logger.warning("No valid records to save")
        return

    try:

        create_tables()

        with SessionLocal.begin() as db:

            statement = (
                insert(ResearchItem)
                .values(rows)
                .on_conflict_do_nothing(
                    index_elements=["url"]
                )
            )

            result = db.execute(statement)

            inserted = result.rowcount or 0

        logger.info(
            "Collection completed: %s fetched, %s new records",
            len(rows),
            inserted
        )

    except Exception:

        logger.exception(
            "Database storage failed"
        )


def main():

    parser = argparse.ArgumentParser(
        description="AI Technology Research Collector"
    )

    parser.add_argument(
        "--once",
        action="store_true",
        help="Execute collection once"
    )

    parser.add_argument(
        "--schedule",
        action="store_true",
        help="Run collection every day at 8 AM"
    )

    args = parser.parse_args()

    create_tables()

    if args.once:

        run_collection()

    elif args.schedule:

        scheduler = BlockingScheduler(
            timezone=ZoneInfo(settings.TIMEZONE)
        )

        scheduler.add_job(
            run_collection,
            trigger="cron",
            hour=8,
            minute=0,
            id="daily_research",
            max_instances=1,
            coalesce=True
        )

        logger.info(
            "Daily research scheduler started at 08:00 %s",
            settings.TIMEZONE
        )

        scheduler.start()

    else:

        parser.print_help()


if __name__ == "__main__":
    main()