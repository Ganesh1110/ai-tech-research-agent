"""Phase 5.5 — Knowledge graph.

Stores entities (technologies, frameworks, papers, concepts) and
directed relationships between them. Complements vector search with
explicit, traversable connections.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Set, Tuple

from sqlalchemy.orm import Session

from app.database.db import SessionLocal
from app.knowledge_base.models import (
    KnowledgeGraphEntity,
    KnowledgeGraphRelationship,
)


class KnowledgeGraph:

    """CRUD and traversal operations for the knowledge graph."""

    def __init__(self, db: Optional[Session] = None):

        self._owns_session = db is None

        self.db = db or SessionLocal()

    def __enter__(self):

        return self

    def __exit__(self, exc_type, exc_val, exc_tb):

        if self._owns_session:

            self.db.close()

    # ---- entities -------------------------------------------------------

    def add_entity(

        self,

        name: str,

        entity_type: str,

        description: Optional[str] = None,

        metadata: Optional[Dict[str, Any]] = None,

    ) -> KnowledgeGraphEntity:

        entity = (

            self.db.query(KnowledgeGraphEntity)

            .filter_by(name=name, entity_type=entity_type)

            .first()

        )

        if entity:

            if description:

                entity.description = description

            if metadata:

                entity.metadata_json = metadata

            self.db.flush()

            return entity

        entity = KnowledgeGraphEntity(

            name=name,

            entity_type=entity_type,

            description=description,

            metadata_json=metadata or {},

        )

        self.db.add(entity)

        self.db.flush()

        return entity

    def get_entity(self, entity_id: int) -> Optional[KnowledgeGraphEntity]:

        return self.db.query(KnowledgeGraphEntity).get(entity_id)

    def get_entity_by_name(

        self, name: str, entity_type: Optional[str] = None

    ) -> Optional[KnowledgeGraphEntity]:

        query = self.db.query(KnowledgeGraphEntity).filter_by(name=name)

        if entity_type:

            query = query.filter_by(entity_type=entity_type)

        return query.first()

    def list_entities(

        self,

        entity_type: Optional[str] = None,

        limit: int = 100,

    ) -> List[KnowledgeGraphEntity]:

        query = self.db.query(KnowledgeGraphEntity)

        if entity_type:

            query = query.filter_by(entity_type=entity_type)

        return query.limit(limit).all()

    # ---- relationships --------------------------------------------------

    def add_relationship(

        self,

        source_name: str,

        source_type: str,

        target_name: str,

        target_type: str,

        relationship_type: str,

        weight: float = 1.0,

        metadata: Optional[Dict[str, Any]] = None,

    ) -> KnowledgeGraphRelationship:

        source = self.add_entity(source_name, source_type)

        target = self.add_entity(target_name, target_type)

        rel = (

            self.db.query(KnowledgeGraphRelationship)

            .filter_by(

                source_entity_id=source.id,

                target_entity_id=target.id,

                relationship_type=relationship_type,

            )

            .first()

        )

        if rel:

            rel.weight = weight

            if metadata:

                rel.metadata_json = metadata

            self.db.flush()

            return rel

        rel = KnowledgeGraphRelationship(

            source_entity_id=source.id,

            target_entity_id=target.id,

            relationship_type=relationship_type,

            weight=weight,

            metadata_json=metadata or {},

        )

        self.db.add(rel)

        self.db.flush()

        return rel

    def get_relationships_for_entity(

        self,

        entity_id: int,

        direction: str = "both",

    ) -> List[KnowledgeGraphRelationship]:

        query = self.db.query(KnowledgeGraphRelationship)

        if direction == "outgoing":

            query = query.filter_by(source_entity_id=entity_id)

        elif direction == "incoming":

            query = query.filter_by(target_entity_id=entity_id)

        else:

            query = query.filter(

                (KnowledgeGraphRelationship.source_entity_id == entity_id)

                | (KnowledgeGraphRelationship.target_entity_id == entity_id)

            )

        return query.all()

    # ---- traversal ------------------------------------------------------

    def neighbors(

        self,

        entity_id: int,

        relationship_type: Optional[str] = None,

    ) -> List[KnowledgeGraphEntity]:

        """Return directly connected entities."""

        rels = self.get_relationships_for_entity(entity_id)

        neighbor_ids: Set[int] = set()

        for rel in rels:

            if relationship_type and rel.relationship_type != relationship_type:

                continue

            if rel.source_entity_id == entity_id:

                neighbor_ids.add(rel.target_entity_id)

            else:

                neighbor_ids.add(rel.source_entity_id)

        return [

            self.get_entity(nid) for nid in neighbor_ids if self.get_entity(nid)

        ]

    def find_path(

        self,

        source_name: str,

        source_type: str,

        target_name: str,

        target_type: str,

        max_depth: int = 3,

    ) -> Optional[List[Dict[str, Any]]]:

        """BFS shortest path between two named entities."""

        source = self.get_entity_by_name(source_name, source_type)

        target = self.get_entity_by_name(target_name, target_type)

        if not source or not target:

            return None

        from collections import deque

        queue: deque = deque([(source.id, [source.id])])

        visited: Set[int] = {source.id}

        while queue:

            current_id, path = queue.popleft()

            if len(path) > max_depth + 1:

                continue

            if current_id == target.id:

                return self._path_to_dicts(path)

            for neighbor in self.neighbors(current_id):

                if neighbor.id not in visited:

                    visited.add(neighbor.id)

                    queue.append((neighbor.id, path + [neighbor.id]))

        return None

    @staticmethod

    def _path_to_dicts(path: List[int]) -> List[Dict[str, Any]]:

        # caller re-queries entities for full detail

        return [{"entity_id": eid} for eid in path]

    def commit(self) -> None:

        self.db.commit()

    def close(self) -> None:

        if self._owns_session:

            self.db.close()


__all__ = ["KnowledgeGraph"]
