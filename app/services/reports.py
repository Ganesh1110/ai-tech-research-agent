from collections import defaultdict
from typing import Any, Dict, List, Optional

from app.database.db import SessionLocal
from app.database.models import ResearchItem


def get_completed_items() -> List[ResearchItem]:

    with SessionLocal() as db:

        items = (
            db.query(ResearchItem)
            .filter(ResearchItem.processing_status == "completed")
            .order_by(ResearchItem.analyzed_at.desc())
            .all()
        )

        return items


def top_discoveries(limit: int = 10) -> List[ResearchItem]:

    items = get_completed_items()

    scored = [
        item
        for item in items
        if item.relevance_score is not None
    ]

    scored.sort(
        key=lambda x: (x.relevance_score or 0),
        reverse=True,
    )

    return scored[:limit]


def top_github_repositories(limit: int = 5) -> List[ResearchItem]:

    items = get_completed_items()

    github = [
        item
        for item in items
        if item.source == "github"
        and item.technical_value_score is not None
    ]

    github.sort(
        key=lambda x: (x.technical_value_score or 0),
        reverse=True,
    )

    return github[:limit]


def top_research_papers(limit: int = 5) -> List[ResearchItem]:

    items = get_completed_items()

    papers = [
        item
        for item in items
        if item.source == "arxiv"
        and item.relevance_score is not None
    ]

    papers.sort(
        key=lambda x: (x.relevance_score or 0),
        reverse=True,
    )

    return papers[:limit]


def new_tools_frameworks_models(limit: int = 10) -> List[ResearchItem]:

    items = get_completed_items()

    tool_items = [
        item
        for item in items
        if item.technologies and len(item.technologies) > 0
    ]

    tool_items.sort(
        key=lambda x: (x.relevance_score or 0),
        reverse=True,
    )

    return tool_items[:limit]


def best_implementation_ideas(limit: int = 10) -> List[ResearchItem]:

    items = get_completed_items()

    idea_items = [
        item
        for item in items
        if item.implementation_ideas
        and len(item.implementation_ideas) > 0
    ]

    idea_items.sort(
        key=lambda x: (x.relevance_score or 0),
        reverse=True,
    )

    return idea_items[:limit]


def items_by_category(category: str, limit: int = 5) -> List[ResearchItem]:

    items = get_completed_items()

    filtered = [
        item
        for item in items
        if item.ai_category
        and item.ai_category.lower() == category.lower()
    ]

    filtered.sort(
        key=lambda x: (x.relevance_score or 0),
        reverse=True,
    )

    return filtered[:limit]


def all_categories() -> List[str]:

    items = get_completed_items()

    categories = set()

    for item in items:

        if item.ai_category:

            categories.add(item.ai_category)

    return sorted(categories)


def get_processing_stats() -> Dict[str, Any]:

    with SessionLocal() as db:

        total = db.query(ResearchItem).count()

        completed = (
            db.query(ResearchItem)
            .filter(ResearchItem.processing_status == "completed")
            .count()
        )

        pending = (
            db.query(ResearchItem)
            .filter(ResearchItem.processing_status == "pending")
            .count()
        )

        failed = (
            db.query(ResearchItem)
            .filter(ResearchItem.processing_status == "failed")
            .count()
        )

        avg_relevance = (
            db.query(func_avg(ResearchItem.relevance_score))
            .filter(ResearchItem.processing_status == "completed")
            .scalar()
        )

    return {
        "total": total,
        "completed": completed,
        "pending": pending,
        "failed": failed,
        "avg_relevance": round(avg_relevance, 1) if avg_relevance else 0,
    }


def func_avg(column):

    from sqlalchemy import func

    return func.avg(column)


def generate_daily_report() -> Dict[str, Any]:

    stats = get_processing_stats()
    categories = all_categories()

    report: Dict[str, Any] = {
        "generated_at": __import__("datetime").datetime.now().isoformat(),
        "stats": stats,
        "top_discoveries": _serialize(top_discoveries(10)),
        "top_github_repositories": _serialize(top_github_repositories(5)),
        "top_research_papers": _serialize(top_research_papers(5)),
        "new_tools_frameworks": _serialize(new_tools_frameworks_models(10)),
        "implementation_ideas": _serialize(best_implementation_ideas(10)),
        "by_category": {},
    }

    for category in categories:

        report["by_category"][category] = _serialize(
            items_by_category(category, 5)
        )

    return report


def _serialize(items: List[ResearchItem]) -> List[Dict[str, Any]]:

    result = []

    for item in items:

        result.append(
            {
                "id": item.id,
                "title": item.title,
                "url": item.url,
                "source": item.source,
                "category": item.ai_category or item.category,
                "relevance_score": item.relevance_score,
                "technical_value_score": item.technical_value_score,
                "novelty_score": item.novelty_score,
                "summary": item.ai_summary,
                "key_topics": item.key_topics or [],
                "technologies": item.technologies or [],
                "implementation_ideas": item.implementation_ideas or [],
                "limitations": item.limitations or [],
                "why_it_matters": None,
                "analyzed_at": (
                    item.analyzed_at.isoformat()
                    if item.analyzed_at
                    else None
                ),
            }
        )

    return result


def format_report_text(report: Dict[str, Any]) -> str:

    lines = []

    lines.append("# Daily AI Research Intelligence Briefing")
    lines.append(f"Generated: {report['generated_at']}")
    lines.append("")

    stats = report["stats"]

    lines.append("## Processing Status")
    lines.append(f"- Total collected: {stats['total']}")
    lines.append(f"- Analyzed: {stats['completed']}")
    lines.append(f"- Pending: {stats['pending']}")
    lines.append(f"- Failed: {stats['failed']}")
    lines.append(f"- Average relevance: {stats['avg_relevance']}/100")
    lines.append("")

    lines.append("## Top 10 Discoveries by Relevance")
    for item in report["top_discoveries"]:

        lines.append(
            f"### {item['title']}"
        )
        lines.append(
            f"- Source: {item['source']} | Category: {item['category']}"
        )
        lines.append(
            f"- Relevance: {item['relevance_score']}/100 | "
            f"Technical Value: {item['technical_value_score']}/100 | "
            f"Novelty: {item['novelty_score']}/100"
        )
        if item["summary"]:

            lines.append(f"- Summary: {item['summary']}")
        if item["technologies"]:

            lines.append(f"- Technologies: {', '.join(item['technologies'])}")
        lines.append(f"- URL: {item['url']}")
        lines.append("")

    lines.append("## Top 5 GitHub Repositories by Technical Value")
    for item in report["top_github_repositories"]:

        lines.append(
            f"### {item['title']}"
        )
        lines.append(
            f"- Technical Value: {item['technical_value_score']}/100 | "
            f"Relevance: {item['relevance_score']}/100"
        )
        if item["technologies"]:

            lines.append(f"- Technologies: {', '.join(item['technologies'])}")
        if item["implementation_ideas"]:

            lines.append(f"- Ideas: {'; '.join(item['implementation_ideas'][:2])}")
        lines.append(f"- URL: {item['url']}")
        lines.append("")

    lines.append("## Top 5 Research Papers")
    for item in report["top_research_papers"]:

        lines.append(
            f"### {item['title']}"
        )
        lines.append(
            f"- Relevance: {item['relevance_score']}/100 | "
            f"Novelty: {item['novelty_score']}/100"
        )
        if item["summary"]:

            lines.append(f"- Summary: {item['summary']}")
        lines.append(f"- URL: {item['url']}")
        lines.append("")

    lines.append("## New Tools, Frameworks & Models")
    for item in report["new_tools_frameworks"]:

        lines.append(
            f"### {item['title']}"
        )
        lines.append(
            f"- Technologies: {', '.join(item['technologies'][:5])}"
        )
        lines.append(f"- URL: {item['url']}")
        lines.append("")

    lines.append("## Best Implementation Ideas")
    for item in report["implementation_ideas"]:

        lines.append(
            f"### {item['title']}"
        )
        if item["implementation_ideas"]:

            lines.append(
                f"- Ideas: {'; '.join(item['implementation_ideas'][:3])}"
            )
        lines.append(f"- URL: {item['url']}")
        lines.append("")

    lines.append("## By Category")
    for category, items in report["by_category"].items():

        lines.append(f"### {category} ({len(items)} items)")
        for item in items:

            lines.append(
                f"- {item['title']} (relevance: {item['relevance_score']})"
            )
        lines.append("")

    return "\n".join(lines)