from typing import Any, Dict, List, Optional

from app.database.db import SessionLocal
from app.database.models import ResearchItem


class ToolResult:

    def __init__(self, success: bool, data: Any = None, error: Optional[str] = None):

        self.success = success
        self.data = data
        self.error = error

    def to_dict(self) -> Dict[str, Any]:

        return {
            "success": self.success,
            "data": self.data,
            "error": self.error,
        }


class DatabaseTools:

    """Tools for searching the local research database."""

    @staticmethod
    def search_by_keyword(
        keyword: str,
        limit: int = 10,
    ) -> ToolResult:

        try:

            from sqlalchemy import or_

            with SessionLocal() as db:

                terms = [t.strip() for t in keyword.split() if t.strip()]

                if not terms:

                    return ToolResult(success=True, data=[])

                conditions = []

                for term in terms:

                    like = f"%{term}%"

                    conditions.append(

                        or_(

                            ResearchItem.title.ilike(like),

                            ResearchItem.ai_summary.ilike(like),

                            ResearchItem.description.ilike(like),

                        )

                    )

                items = (

                    db.query(ResearchItem)

                    .filter(or_(*conditions))

                    .order_by(ResearchItem.discovered_at.desc())

                    .limit(limit)

                    .all()
                )

                return ToolResult(
                    success=True,
                    data=[
                        {
                            "id": item.id,
                            "title": item.title,
                            "source": item.source,
                            "category": item.ai_category or item.category,
                            "relevance_score": item.relevance_score,
                            "summary": item.ai_summary,
                            "url": item.url,
                        }
                        for item in items
                    ],
                )

        except Exception as error:

            return ToolResult(success=False, error=str(error))

    @staticmethod
    def search_by_category(
        category: str,
        limit: int = 10,
    ) -> ToolResult:

        try:

            with SessionLocal() as db:

                items = (
                    db.query(ResearchItem)
                    .filter(
                        ResearchItem.ai_category.ilike(f"%{category}%")
                        | ResearchItem.category.ilike(f"%{category}%")
                    )
                    .order_by(
                        ResearchItem.relevance_score.desc()
                    )
                    .limit(limit)
                    .all()
                )

                return ToolResult(
                    success=True,
                    data=[
                        {
                            "id": item.id,
                            "title": item.title,
                            "source": item.source,
                            "category": item.ai_category or item.category,
                            "relevance_score": item.relevance_score,
                            "summary": item.ai_summary,
                            "url": item.url,
                        }
                        for item in items
                    ],
                )

        except Exception as error:

            return ToolResult(success=False, error=str(error))

    @staticmethod
    def get_item_details(item_id: int) -> ToolResult:

        try:

            with SessionLocal() as db:

                item = (
                    db.query(ResearchItem)
                    .filter(ResearchItem.id == item_id)
                    .first()
                )

                if not item:

                    return ToolResult(
                        success=False,
                        error=f"Item {item_id} not found",
                    )

                return ToolResult(
                    success=True,
                    data={
                        "id": item.id,
                        "title": item.title,
                        "url": item.url,
                        "source": item.source,
                        "category": item.ai_category or item.category,
                        "description": item.description,
                        "summary": item.ai_summary,
                        "relevance_score": item.relevance_score,
                        "technical_value_score": item.technical_value_score,
                        "novelty_score": item.novelty_score,
                        "key_topics": item.key_topics,
                        "technologies": item.technologies,
                        "implementation_ideas": item.implementation_ideas,
                        "limitations": item.limitations,
                        "why_it_matters": None,
                        "published_at": (
                            item.published_at.isoformat()
                            if item.published_at
                            else None
                        ),
                    },
                )

        except Exception as error:

            return ToolResult(success=False, error=str(error))

    @staticmethod
    def list_categories(limit: int = 20) -> ToolResult:

        try:

            with SessionLocal() as db:

                categories = (
                    db.query(ResearchItem.ai_category)
                    .filter(ResearchItem.ai_category.isnot(None))
                    .distinct()
                    .limit(limit)
                    .all()
                )

                return ToolResult(
                    success=True,
                    data=[c[0] for c in categories if c[0]],
                )

        except Exception as error:

            return ToolResult(success=False, error=str(error))

    @staticmethod
    def top_by_score(
        score_field: str = "relevance_score",
        limit: int = 10,
    ) -> ToolResult:

        try:

            with SessionLocal() as db:

                items = (
                    db.query(ResearchItem)
                    .filter(
                        ResearchItem.processing_status == "completed"
                    )
                    .order_by(getattr(ResearchItem, score_field).desc())
                    .limit(limit)
                    .all()
                )

                return ToolResult(
                    success=True,
                    data=[
                        {
                            "id": item.id,
                            "title": item.title,
                            "source": item.source,
                            "category": item.ai_category or item.category,
                            "score": getattr(item, score_field),
                            "summary": item.ai_summary,
                            "url": item.url,
                        }
                        for item in items
                    ],
                )

        except Exception as error:

            return ToolResult(success=False, error=str(error))


class ToolRegistry:

    """Registry of available tools for the agent."""

    def __init__(self):

        self.tools: Dict[str, Any] = {
            "search_by_keyword": DatabaseTools.search_by_keyword,
            "search_by_category": DatabaseTools.search_by_category,
            "get_item_details": DatabaseTools.get_item_details,
            "list_categories": DatabaseTools.list_categories,
            "top_by_score": DatabaseTools.top_by_score,
        }

    def get_tool(self, name: str) -> Any:

        return self.tools.get(name)

    def list_tool_names(self) -> List[str]:

        return list(self.tools.keys())

    def describe_tools(self) -> str:

        descriptions = {
            "search_by_keyword": (
                "Search research items by keyword in title, summary, or description. "
                "Arguments: keyword (str), limit (int, default 10)"
            ),
            "search_by_category": (
                "Search research items by category. "
                "Arguments: category (str), limit (int, default 10)"
            ),
            "get_item_details": (
                "Get full details of a specific research item by ID. "
                "Arguments: item_id (int)"
            ),
            "list_categories": (
                "List all available research categories. "
                "Arguments: limit (int, default 20)"
            ),
            "top_by_score": (
                "Get top research items by a score field. "
                "Arguments: score_field (str, default 'relevance_score'), limit (int, default 10)"
            ),
        }

        lines = ["Available tools:"]

        for name in self.list_tool_names():

            lines.append(f"- {name}: {descriptions[name]}")

        return "\n".join(lines)


TOOL_REGISTRY = ToolRegistry()