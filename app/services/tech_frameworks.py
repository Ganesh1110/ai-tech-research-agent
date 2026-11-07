"""Tech Frameworks Directory service — all directory data is sourced from the
database, never hardcoded at runtime. Seed data lives in
app/data/tech_frameworks_seed.json and is loaded into the DB once on demand."""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.models import TechFramework

logger = logging.getLogger(__name__)

SEED_FILE = Path(__file__).resolve().parent.parent / "data" / "tech_frameworks_seed.json"


def _load_seed_data() -> List[Dict[str, Any]]:

    with open(SEED_FILE, "r", encoding="utf-8") as fh:

        return json.load(fh)


def _framework_to_dict(framework: TechFramework) -> Dict[str, Any]:

    return {

        "id": framework.framework_id,

        "category": framework.category,

        "name": framework.name,

        "framework": framework.framework,

        "runtime": framework.runtime,

        "maturity": framework.maturity,

        "maturityColor": framework.maturity_color,

        "tagline": framework.tagline,

        "keyFeatures": framework.key_features or [],

        "bestFor": framework.best_for,

        "docsUrl": framework.docs_url,

    }


def seed_tech_frameworks(db: Session) -> int:

    """Seed tech frameworks into the database if the table is empty.

    Returns the number of frameworks now present in the database.
    """

    existing = db.scalars(select(TechFramework.framework_id)).all()

    if existing:

        return len(existing)

    seed_data = _load_seed_data()

    for item in seed_data:

        if not item.get("is_active", True):

            continue

        db.add(

            TechFramework(

                framework_id=item["framework_id"],

                category=item["category"],

                name=item["name"],

                framework=item.get("framework", ""),

                runtime=item.get("runtime", ""),

                maturity=item.get("maturity", ""),

                maturity_color=item.get("maturity_color", "#6366f1"),

                tagline=item.get("tagline", ""),

                key_features=item.get("key_features", []),

                best_for=item.get("best_for", ""),

                docs_url=item.get("docs_url", ""),

                is_active=True,

            )

        )

    db.commit()

    count = db.scalars(select(TechFramework)).all()

    logger.info("Seeded %d tech frameworks into the database.", len(count))

    return len(count)


def list_tech_frameworks(
    db: Session, limit: Optional[int] = None, offset: Optional[int] = None
) -> List[Dict[str, Any]]:

    """Return all active tech frameworks from the database, seeding if empty."""

    if not db.scalars(select(TechFramework.framework_id)).all():

        seed_tech_frameworks(db)

    query = select(TechFramework).where(TechFramework.is_active.is_(True)).order_by(

        TechFramework.category, TechFramework.name

    )

    if offset is not None:

        query = query.offset(offset)

    if limit is not None:

        query = query.limit(limit)

    frameworks = db.scalars(query).all()

    return [_framework_to_dict(f) for f in frameworks]


def get_tech_framework(db: Session, framework_id: str) -> Optional[Dict[str, Any]]:

    """Return a single tech framework by id, or None if not found."""

    framework = db.scalars(

        select(TechFramework).where(TechFramework.framework_id == framework_id)

    ).first()

    if not framework:

        return None

    return _framework_to_dict(framework)


def list_categories(db: Session) -> List[str]:

    """Return sorted unique active categories."""

    if not db.scalars(select(TechFramework.framework_id)).all():

        seed_tech_frameworks(db)

    categories = db.scalars(

        select(TechFramework.category)

        .where(TechFramework.is_active.is_(True))

        .distinct()

    ).all()

    return sorted([c for c in categories if c])
