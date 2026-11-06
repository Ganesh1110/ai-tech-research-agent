"""Phase 6.2/6.4 — Discovery manager: dedup, scoring, storage.

Handles deduplication of discovered items across cycles, compute
relevance scores, and persist new discoveries to the database.
"""

import logging
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy import select

from app.database.db import SessionLocal
from app.database.models import (
    DiscoveredItem,
    DiscoveryScore,
)

logger = logging.getLogger(__name__)

# Scoring factor weights (total = 100)

WEIGHT_RELEVANCE = 30

WEIGHT_NOVELTY = 20

WEIGHT_TECHNICAL_USEFULNESS = 20

WEIGHT_MATURITY = 15

WEIGHT_APPLICATION_VALUE = 15

# Recommendation level thresholds

THRESHOLD_HIGH = 85

THRESHOLD_WORTH_INVESTIGATING = 70

THRESHOLD_KEEP = 50


class DiscoveryManager:

    """Manages discovered items: dedup, score, store, recommend."""

    def __init__(self):

        self.seen_keys: set = set()

    # ---- dedup ---------------------------------------------------------

    def is_duplicate(

        self,

        external_id: str,

        source: str,

    ) -> bool:

        """Check if an item with this external_id+source already exists."""

        key = f"{source}:{external_id}"

        with SessionLocal() as db:

            stmt = select(DiscoveredItem).where(

                DiscoveredItem.external_id == external_id,

                DiscoveredItem.source == source,

            )

            existing = db.execute(stmt).scalar_one_or_none()

        if existing:

            # Update last_checked_at

            now = datetime.now(timezone.utc)

            with SessionLocal() as db2:

                item = db2.get(DiscoveredItem, existing.id)

                if item:

                    item.last_checked_at = now

                    db2.commit()

            return True

        self.seen_keys.add(key)

        return False

    # ---- scoring -------------------------------------------------------

    def score_item(

        self,

        item_data: Dict[str, Any],

    ) -> Dict[str, float]:

        """Compute factor scores and overall score (0-100)."""

        relevance = self._score_relevance(item_data)

        novelty = self._score_novelty(item_data)

        technical = self._score_technical_usefulness(item_data)

        maturity = self._score_maturity(item_data)

        application = self._score_application_value(item_data)

        overall = round(

            (relevance * WEIGHT_RELEVANCE

             + novelty * WEIGHT_NOVELTY

             + technical * WEIGHT_TECHNICAL_USEFULNESS

             + maturity * WEIGHT_MATURITY

             + application * WEIGHT_APPLICATION_VALUE)

            / 100.0,

            2,

        )

        return {

            "relevance": round(relevance, 2),

            "novelty": round(novelty, 2),

            "technical_usefulness": round(technical, 2),

            "maturity": round(maturity, 2),

            "application_value": round(application, 2),

            "overall": overall,

        }

    @staticmethod

    def _score_relevance(data: Dict[str, Any]) -> float:

        """Relevance to AI/tech research interests (0-100)."""

        text = f"{data.get('title', '')} {data.get('description', '')} {data.get('category', '')}".lower()

        ai_terms = [

            "llm", "ai", "agent", "mcp", "model", "inference", "quantization",

            "fine-tun", "transformer", "neural", "generative", "copilot",

            "assistant", "automation", "workflow", "tool", "framework",

            "library", "sdk", "api",

        ]

        hits = sum(1 for t in ai_terms if t in text)

        return min(hits / 6.0 * 100.0, 100.0)

    @staticmethod

    def _score_novelty(data: Dict[str, Any]) -> float:

        """Novelty and freshness (0-100). Based on recency and keywords."""

        text = f"{data.get('title', '')} {data.get('description', '')}".lower()

        new_terms = [

            "new", "latest", "2026", "2025", "v2", "v3", "beta", "preview",

            "announce", "launch", "release", "introducing", "first",

        ]

        hits = sum(1 for t in new_terms if t in text)

        return min(hits / 4.0 * 100.0, 100.0)

    @staticmethod

    def _score_technical_usefulness(data: Dict[str, Any]) -> float:

        """Technical usefulness (0-100)."""

        text = f"{data.get('title', '')} {data.get('description', '')}".lower()

        tech_terms = [

            "python", "javascript", "typescript", "go", "rust", "api",

            "sdk", "library", "framework", "integration", "server",

            "client", "tool", "utility", "open source", "github",

        ]

        hits = sum(1 for t in tech_terms if t in text)

        return min(hits / 5.0 * 100.0, 100.0)

    @staticmethod

    def _score_maturity(data: Dict[str, Any]) -> float:

        """Project maturity and maintenance (0-100)."""

        text = f"{data.get('title', '')} {data.get('description', '')}".lower()

        mature_terms = [

            "stable", "production", "v1", "v2", "v3", "maintained",

            "active", "documentation", "docs", "stars", "forks",

        ]

        hits = sum(1 for t in mature_terms if t in text)

        return min(hits / 4.0 * 100.0, 100.0)

    @staticmethod

    def _score_application_value(data: Dict[str, Any]) -> float:

        """Potential application value (0-100)."""

        text = f"{data.get('title', '')} {data.get('description', '')} {data.get('category', '')}".lower()

        value_terms = [

            "integration", "plugin", "extension", "automation", "deployment",

            "monitoring", "security", "performance", "scalability",

            "research", "analysis", "development", "building",

        ]

        hits = sum(1 for t in value_terms if t in text)

        return min(hits / 5.0 * 100.0, 100.0)

    # ---- store ---------------------------------------------------------

    def store_discovered_item(

        self,

        cycle_id: int,

        category: str,

        item_data: Dict[str, Any],

        scores: Dict[str, float],

    ) -> Optional[DiscoveredItem]:

        """Store a new discovered item and its scores."""

        with SessionLocal() as db:

            item = DiscoveredItem(

                external_id=item_data["external_id"],

                source=item_data["source"],

                title=item_data["title"],

                description=item_data.get("description", ""),

                url=item_data["url"],

                category=category,

                metadata_json=item_data.get("metadata", {}),

                overall_score=scores["overall"],

            )

            db.add(item)

            db.flush()

            score = DiscoveryScore(

                discovered_item_id=item.id,

                relevance_score=scores["relevance"],

                novelty_score=scores["novelty"],

                technical_usefulness_score=scores["technical_usefulness"],

                maturity_score=scores["maturity"],

                application_value_score=scores["application_value"],

                overall_score=scores["overall"],

            )

            db.add(score)

            db.commit()

            db.refresh(item)

            return item

    # ---- top items -----------------------------------------------------

    def get_top_items(

        self,

        limit: int = 20,

        min_score: float = 0.0,

    ) -> List[Dict[str, Any]]:

        with SessionLocal() as db:

            stmt = select(DiscoveredItem).where(

                (DiscoveredItem.overall_score.isnot(None))

                & (DiscoveredItem.overall_score >= min_score)

            ).order_by(DiscoveredItem.overall_score.desc()).limit(limit)

            rows = db.execute(stmt).scalars().all()

            return [

                {

                    "id": r.id,

                    "external_id": r.external_id,

                    "source": r.source,

                    "title": r.title,

                    "description": r.description,

                    "url": r.url,

                    "category": r.category,

                    "overall_score": r.overall_score,

                    "recommendation_level": r.recommendation_level,

                    "first_seen_at": r.first_seen_at.isoformat()

                    if r.first_seen_at else None,

                }

                for r in rows

            ]


__all__ = [

    "DiscoveryManager",

    "WEIGHT_RELEVANCE",

    "WEIGHT_NOVELTY",

    "WEIGHT_TECHNICAL_USEFULNESS",

    "WEIGHT_MATURITY",

    "WEIGHT_APPLICATION_VALUE",

]
