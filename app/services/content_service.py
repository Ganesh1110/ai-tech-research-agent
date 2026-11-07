"""Content service — all catalog data (models, datasets, trending items,
dashboard metrics) is sourced from the database. Seed data lives in
app/data/*_seed.json and is loaded once on demand. No hardcoded content
at runtime."""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.models import DashboardMetric, SystemConfig, TechResource, TrendingItem
from app.knowledge_base.models import KnowledgeGraphEntity, KnowledgeGraphRelationship

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def _load_seed(filename: str) -> List[Dict[str, Any]]:

    with open(DATA_DIR / filename, "r", encoding="utf-8") as fh:

        return json.load(fh)


# ---------------------------------------------------------------------------
# Tech Resources (models & datasets)
# ---------------------------------------------------------------------------

def _resource_to_dict(resource: TechResource) -> Dict[str, Any]:

    return {

        "id": resource.resource_id,

        "type": resource.resource_type,

        "name": resource.name,

        "org": resource.org,

        "context": resource.context,

        "strengths": resource.strengths,

        "suitability": resource.suitability,

        "benchmark": resource.benchmark,

        "size": resource.size,

        "desc": resource.desc,

        "url": resource.url,

        "is_active": resource.is_active,

    }


def seed_tech_resources(db: Session) -> int:

    existing = db.scalars(select(TechResource.resource_id)).all()

    if existing:

        return len(existing)

    for item in _load_seed("tech_resources_seed.json"):

        if not item.get("is_active", True):

            continue

        db.add(

            TechResource(

                resource_id=item["resource_id"],

                resource_type=item["resource_type"],

                name=item["name"],

                org=item.get("org", ""),

                context=item.get("context", ""),

                strengths=item.get("strengths", ""),

                suitability=item.get("suitability", ""),

                benchmark=item.get("benchmark", ""),

                size=item.get("size", ""),

                desc=item.get("desc", ""),

                url=item.get("url", ""),

                is_active=True,

            )

        )

    db.commit()

    count = len(db.scalars(select(TechResource.resource_id)).all())

    logger.info("Seeded %d tech resources into the database.", count)

    return count


def list_tech_resources(db: Session, resource_type: Optional[str] = None) -> List[Dict[str, Any]]:

    if not db.scalars(select(TechResource.resource_id)).all():

        seed_tech_resources(db)

    query = select(TechResource).where(TechResource.is_active.is_(True))

    if resource_type:

        query = query.where(TechResource.resource_type == resource_type)

    query = query.order_by(TechResource.resource_type, TechResource.name)

    resources = db.scalars(query).all()

    return [_resource_to_dict(r) for r in resources]


# ---------------------------------------------------------------------------
# Trending Items (repos & topics)
# ---------------------------------------------------------------------------

def _trending_to_dict(item: TrendingItem) -> Dict[str, Any]:

    return {

        "id": item.item_id,

        "type": item.item_type,

        "name": item.name,

        "stars": item.stars,

        "forks": item.forks,

        "growth": item.growth,

        "category": item.category,

        "desc": item.desc,

        "count": item.count,

        "url": item.url,

        "is_active": item.is_active,

    }


def seed_trending_items(db: Session) -> int:

    existing = db.scalars(select(TrendingItem.item_id)).all()

    if existing:

        return len(existing)

    for item in _load_seed("trending_items_seed.json"):

        if not item.get("is_active", True):

            continue

        db.add(

            TrendingItem(

                item_id=item["item_id"],

                item_type=item["item_type"],

                name=item["name"],

                stars=item.get("stars", ""),

                forks=item.get("forks", ""),

                growth=item.get("growth", ""),

                category=item.get("category", ""),

                desc=item.get("desc", ""),

                count=item.get("count", ""),

                url=item.get("url", ""),

                is_active=True,

            )

        )

    db.commit()

    count = len(db.scalars(select(TrendingItem.item_id)).all())

    logger.info("Seeded %d trending items into the database.", count)

    return count


def list_trending_items(
    db: Session, item_type: Optional[str] = None
) -> List[Dict[str, Any]]:

    if not db.scalars(select(TrendingItem.item_id)).all():

        seed_trending_items(db)

    query = select(TrendingItem).where(TrendingItem.is_active.is_(True))

    if item_type:

        query = query.where(TrendingItem.item_type == item_type)

    query = query.order_by(TrendingItem.item_type, TrendingItem.name)

    items = db.scalars(query).all()

    return [_trending_to_dict(i) for i in items]


# ---------------------------------------------------------------------------
# Dashboard Metrics (charts & KPIs)
# ---------------------------------------------------------------------------

def _metric_to_dict(metric: DashboardMetric) -> Dict[str, Any]:

    return {

        "id": metric.metric_name,

        "name": metric.metric_name,

        "type": metric.metric_type,

        "label": metric.label,

        "value": metric.value,

        "color": metric.color,

        "is_active": metric.is_active,

    }


def seed_dashboard_metrics(db: Session) -> int:

    existing = db.scalars(select(DashboardMetric.metric_name)).all()

    if existing:

        return len(existing)

    for item in _load_seed("dashboard_metrics_seed.json"):

        if not item.get("is_active", True):

            continue

        db.add(

            DashboardMetric(

                metric_name=item["metric_name"],

                metric_type=item["metric_type"],

                label=item.get("label", ""),

                value=item.get("value", 0),

                color=item.get("color", "#6366f1"),

                is_active=True,

            )

        )

    db.commit()

    count = len(db.scalars(select(DashboardMetric.metric_name)).all())

    logger.info("Seeded %d dashboard metrics into the database.", count)

    return count


def list_dashboard_metrics(
    db: Session, metric_type: Optional[str] = None
) -> List[Dict[str, Any]]:

    if not db.scalars(select(DashboardMetric.metric_name)).all():

        seed_dashboard_metrics(db)

    query = select(DashboardMetric).where(DashboardMetric.is_active.is_(True))

    if metric_type:

        query = query.where(DashboardMetric.metric_type == metric_type)

    query = query.order_by(DashboardMetric.metric_type, DashboardMetric.metric_name)

    metrics = db.scalars(query).all()

    return [_metric_to_dict(m) for m in metrics]


# ---------------------------------------------------------------------------
# Problem categories & sources (distinct from GlobalProblem table)
# ---------------------------------------------------------------------------

def list_problem_categories(db: Session) -> List[str]:

    from app.database.models import GlobalProblem

    if not db.scalars(select(GlobalProblem.id)).all():

        return []

    categories = db.scalars(

        select(GlobalProblem.category).distinct().where(GlobalProblem.status == "active")

    ).all()

    return sorted([c for c in categories if c])


def list_problem_sources(db: Session) -> List[str]:

    from app.database.models import GlobalProblem

    if not db.scalars(select(GlobalProblem.id)).all():

        return []

    sources = db.scalars(

        select(GlobalProblem.source).distinct().where(GlobalProblem.status == "active")

    ).all()

    return sorted([s for s in sources if s])


# ---------------------------------------------------------------------------
# Knowledge Graph entities & relationships (KB-backed)
# ---------------------------------------------------------------------------

def seed_kg_graph(db: Session) -> int:

    """Seed KG entities and relationships from seed files if empty."""

    existing_entities = db.scalars(select(KnowledgeGraphEntity.name)).all()

    if existing_entities:

        existing_names = set(existing_entities)

    else:

        existing_names = set()

    entities_added = 0

    for item in _load_seed("kg_entities_seed.json"):

        if item["name"] in existing_names:

            continue

        db.add(

            KnowledgeGraphEntity(

                name=item["name"],

                entity_type=item.get("entity_type", "concept"),

                description=item.get("description", ""),

                metadata_json=item.get("metadata_json", {}),

            )

        )

        entities_added += 1

    db.commit()

    # Seed relationships by name lookup

    rel_seed = _load_seed("kg_relationships_seed.json")

    entities_by_name = {

        e.name: e.id for e in db.scalars(select(KnowledgeGraphEntity)).all()

    }

    relationships_added = 0

    for item in rel_seed:

        src_id = entities_by_name.get(item["source_entity_name"])

        tgt_id = entities_by_name.get(item["target_entity_name"])

        if not src_id or not tgt_id:

            continue

        existing_rel = db.scalars(

            select(KnowledgeGraphRelationship).where(

                KnowledgeGraphRelationship.source_entity_id == src_id,

                KnowledgeGraphRelationship.target_entity_id == tgt_id,

                KnowledgeGraphRelationship.relationship_type

                == item["relationship_type"],

            )

        ).first()

        if existing_rel:

            continue

        db.add(

            KnowledgeGraphRelationship(

                source_entity_id=src_id,

                target_entity_id=tgt_id,

                relationship_type=item["relationship_type"],

                weight=1.0,

                metadata_json={},

            )

        )

        relationships_added += 1

    db.commit()

    logger.info(

        "Seeded %d KG entities and %d KG relationships.",

        entities_added,

        relationships_added,

    )

    return len(db.scalars(select(KnowledgeGraphEntity.id)).all())


def get_kg_graph() -> Dict[str, Any]:

    """Return nodes and edges from the KB knowledge graph."""

    from app.database.db import SessionLocal

    with SessionLocal() as db:

        entities = db.scalars(select(KnowledgeGraphEntity).limit(50)).all()

        relationships = db.scalars(

            select(KnowledgeGraphRelationship).limit(100)

        ).all()

    nodes = [

        {

            "id": f"node-{e.id}",

            "label": e.name,

            "type": e.entity_type,

            "color": _entity_color(e.entity_type),

            "x": 100 + (e.id % 5) * 120,

            "y": 100 + (e.id % 3) * 110,

        }

        for e in entities

    ]

    edges = [

        {

            "from": f"node-{r.source_entity_id}",

            "to": f"node-{r.target_entity_id}",

            "label": r.relationship_type,

        }

        for r in relationships

    ]

    return {"nodes": nodes, "edges": edges}


def _entity_color(entity_type: str) -> str:

    colors = {

        "technology": "#00f0ff",

        "framework": "#a855f7",

        "model": "#10b981",

        "concept": "#3b82f6",

        "tool": "#f59e0b",

        "paper": "#ec4899",

    }

    return colors.get(entity_type.lower(), "#6366f1")


# ---------------------------------------------------------------------------
# System config (key/value store)
# ---------------------------------------------------------------------------

def seed_system_config(db: Session) -> int:

    """Seed system config key/values from seed file if empty."""

    existing = db.scalars(select(SystemConfig.config_key)).all()

    if existing:

        return len(existing)

    for item in _load_seed("system_config_seed.json"):

        if not item.get("is_active", True):

            continue

        db.add(

            SystemConfig(

                config_key=item["config_key"],

                config_value=item.get("config_value", ""),

                config_type=item.get("config_type", "string"),

                description=item.get("description", ""),

                is_active=True,

            )

        )

    db.commit()

    count = len(db.scalars(select(SystemConfig.config_key)).all())

    logger.info("Seeded %d system config entries into the database.", count)

    return count


def get_system_config(db: Session, config_key: str) -> Optional[str]:

    """Return a single config value by key, or None if not found."""

    if not db.scalars(select(SystemConfig.config_key)).all():

        seed_system_config(db)

    row = db.scalars(

        select(SystemConfig.config_value).where(SystemConfig.config_key == config_key)

    ).first()

    return row


__all__ = [

    "seed_tech_resources",

    "list_tech_resources",

    "seed_trending_items",

    "list_trending_items",

    "seed_dashboard_metrics",

    "list_dashboard_metrics",

    "list_problem_categories",

    "list_problem_sources",

    "seed_kg_graph",

    "get_kg_graph",

    "seed_system_config",

    "get_system_config",

]
