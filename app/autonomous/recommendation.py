"""Phase 6.5 — Recommendation engine.

Assigns recommendation levels to discovered items based on overall score:

- 85-100: High priority
- 70-84: Worth investigating
- 50-69: Keep in knowledge base
- Below 50: Low priority
"""

from typing import Any, Dict, List, Optional

from app.database.db import SessionLocal
from app.database.models import DiscoveredItem, Recommendation


class RecommendationEngine:

    """Assigns recommendation levels and generates recommendations."""

    LEVEL_HIGH_PRIORITY = "high_priority"

    LEVEL_WORTH_INVESTIGATING = "worth_investigating"

    LEVEL_KEEP = "keep_in_kb"

    LEVEL_LOW_PRIORITY = "low_priority"

    LEVELS = [

        LEVEL_HIGH_PRIORITY,

        LEVEL_WORTH_INVESTIGATING,

        LEVEL_KEEP,

        LEVEL_LOW_PRIORITY,

    ]

    def classify(self, overall_score: float) -> str:

        if overall_score >= 85:

            return self.LEVEL_HIGH_PRIORITY

        if overall_score >= 70:

            return self.LEVEL_WORTH_INVESTIGATING

        if overall_score >= 50:

            return self.LEVEL_KEEP

        return self.LEVEL_LOW_PRIORITY

    def recommend(

        self,

        discovered_item_id: int,

        overall_score: float,

        factor_scores: Optional[Dict[str, float]] = None,

    ) -> Recommendation:

        """Create and persist a recommendation for a discovered item."""

        level = self.classify(overall_score)

        reason = self._build_reason(overall_score, factor_scores or {})

        action = self._suggest_action(level)

        confidence = self._confidence(overall_score)

        with SessionLocal() as db:

            rec = Recommendation(

                discovered_item_id=discovered_item_id,

                recommendation_level=level,

                reason=reason,

                suggested_action=action,

                confidence=confidence,

            )

            db.add(rec)

            # Update the item's recommendation_level

            item = db.get(DiscoveredItem, discovered_item_id)

            if item:

                item.recommendation_level = level

            db.commit()

            db.refresh(rec)

            return rec

    def get_recommendations(

        self,

        level: Optional[str] = None,

        limit: int = 50,

    ) -> List[Dict[str, Any]]:

        with SessionLocal() as db:

            from sqlalchemy import select, desc

            stmt = select(Recommendation)

            if level:

                stmt = stmt.where(Recommendation.recommendation_level == level)

            stmt = stmt.order_by(desc(Recommendation.created_at)).limit(limit)

            rows = db.execute(stmt).scalars().all()

            return [

                {

                    "id": r.id,

                    "discovered_item_id": r.discovered_item_id,

                    "recommendation_level": r.recommendation_level,

                    "reason": r.reason,

                    "suggested_action": r.suggested_action,

                    "confidence": r.confidence,

                    "created_at": r.created_at.isoformat()

                    if r.created_at else None,

                }

                for r in rows

            ]

    # ---- helpers ------------------------------------------------------

    @staticmethod

    def _build_reason(

        score: float,

        factors: Dict[str, float],

    ) -> str:

        parts = [f"Overall score: {score}/100"]

        if factors:

            top = sorted(factors.items(), key=lambda x: x[1], reverse=True)[:3]

            detail = ", ".join(f"{k}={v}" for k, v in top)

            parts.append(f"Top factors: {detail}")

        return "; ".join(parts)

    @staticmethod

    def _suggest_action(level: str) -> str:

        if level == RecommendationEngine.LEVEL_HIGH_PRIORITY:

            return "High priority — investigate for integration"

        if level == RecommendationEngine.LEVEL_WORTH_INVESTIGATING:

            return "Worth investigating — add to shortlist"

        if level == RecommendationEngine.LEVEL_KEEP:

            return "Keep in knowledge base — monitor for updates"

        return "Low priority — archive unless explicitly requested"

    @staticmethod

    def _confidence(score: float) -> float:

        # Higher score = higher confidence in recommendation

        return round(min(score / 100.0, 1.0), 2)


__all__ = [

    "RecommendationEngine",

]
