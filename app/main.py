import argparse
import logging

from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from apscheduler.schedulers.blocking import BlockingScheduler
from sqlalchemy import insert
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert

from app.config import settings

from app.database.db import (
    SessionLocal,
    create_tables
)

from app.database.models import (
    ResearchItem,
    CollectionRun,
)

from app.agent.agent import AutonomousAgent
from app.services.intelligence import run_intelligence
from app.services.reports import generate_daily_report, format_report_text

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

    start_time = datetime.now(timezone.utc)

    all_items = []

    failed_sources = []

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

            failed_sources.append(name)

    fetched_count = len(all_items)

    if not all_items:

        logger.warning("No research items collected")

        _record_collection_run(
            start_time,
            fetched_count=0,
            inserted_count=0,
            failed_sources=failed_sources,
            status="completed_no_items"
        )

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

        _record_collection_run(
            start_time,
            fetched_count=fetched_count,
            inserted_count=0,
            failed_sources=failed_sources,
            status="completed_no_valid_rows"
        )

        return

    try:

        create_tables()

        inserted = 0

        with SessionLocal.begin() as db:

            if "sqlite" in settings.DATABASE_URL:

                statement = sqlite_insert(ResearchItem).values(rows).prefix_with("OR IGNORE")

            else:

                statement = pg_insert(ResearchItem).values(rows).on_conflict_do_nothing(
                    index_elements=["url"]
                )

            result = db.execute(statement)

            inserted = result.rowcount or 0

        logger.info(
            "Collection completed: %s fetched, %s new records",
            len(rows),
            inserted
        )

        _record_collection_run(
            start_time,
            fetched_count=fetched_count,
            inserted_count=inserted,
            failed_sources=failed_sources,
            status="completed"
        )

    except Exception:

        logger.exception(
            "Database storage failed"
        )

        _record_collection_run(
            start_time,
            fetched_count=fetched_count,
            inserted_count=0,
            failed_sources=failed_sources + ["database"],
            status="failed"
        )


def _record_collection_run(
    started_at: datetime,
    fetched_count: int,
    inserted_count: int,
    failed_sources: list,
    status: str,
) -> None:

    finished_at = datetime.now(timezone.utc)
    duration = (finished_at - started_at).total_seconds()

    try:

        create_tables()

        with SessionLocal.begin() as db:

            db.add(
                CollectionRun(
                    started_at=started_at,
                    finished_at=finished_at,
                    duration_seconds=duration,
                    fetched_count=fetched_count,
                    inserted_count=inserted_count,
                    failed_sources=failed_sources,
                    status=status,
                )
            )

        logger.info(
            "Collection run recorded: %s fetched, %s inserted, %s duration",
            fetched_count,
            inserted_count,
            duration,
        )

    except Exception:

        logger.exception(
            "Failed to record collection run"
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

    parser.add_argument(
        "--intelligence",
        action="store_true",
        help="Run LLM intelligence processing on pending items"
    )

    parser.add_argument(
        "--all",
        action="store_true",
        help="Process all pending items (not just one batch)"
    )

    parser.add_argument(
        "--report",
        action="store_true",
        help="Generate daily intelligence report"
    )

    parser.add_argument(
        "--agent",
        action="store_true",
        help="Run autonomous research agent"
    )

    parser.add_argument(
        "--objective",
        type=str,
        default="",
        help="Research objective for the autonomous agent"
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

    elif args.intelligence:

        result = run_intelligence(
            process_all_items=args.all,
        )

        logger.info(
            "Intelligence processing complete: %s processed, %s succeeded, %s failed",
            result["processed"],
            result["succeeded"],
            result["failed"],
        )

    elif args.report:

        report = generate_daily_report()

        print(format_report_text(report))

    elif args.agent:

        if not args.objective:

            logger.error(
                "--objective is required with --agent"
            )

            parser.print_help()

        else:

            agent = AutonomousAgent()

            result = agent.run(objective=args.objective)

            print("\n" + "=" * 60)

            print("AUTONOMOUS RESEARCH AGENT - RESULT")

            print("=" * 60)

            print(f"Objective: {result.objective}")

            print(f"Status: {result.status.value}")

            print(f"Total steps: {result.total_steps}")

            print(f"Sources: {len(result.sources)}")

            print("=" * 60)

            print("\nFINAL ANSWER:\n")

            print(result.final_answer)

            print("\n" + "=" * 60)

            if result.sources:

                print("\nSOURCES:")

                for source in result.sources:

                    title = getattr(source, "title", source) if not isinstance(source, str) else source

                    url = getattr(source, "url", "") if not isinstance(source, str) else ""

                    print(f"- {title}")

                    if url:

                        print(f"  {url}")

    else:

        parser.print_help()


if __name__ == "__main__":
    main()