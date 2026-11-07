"""Tech frameworks directory data source.

All tech framework data is now sourced from the database at runtime
(see :mod:`app.services.tech_frameworks`). Seed data for the initial
database population lives in ``app/data/tech_frameworks_seed.json``.
This module intentionally contains no hardcoded framework data.
"""

from __future__ import annotations

from typing import Any, Dict, List

__all__ = ["list_frameworks", "get_framework", "list_categories"]


def list_frameworks() -> List[Dict[str, Any]]:

    """Deprecated: use :func:`app.services.tech_frameworks.list_tech_frameworks`."""

    raise RuntimeError(
        "tech_frameworks.list_frameworks() is deprecated. "
        "Use app.services.tech_frameworks.list_tech_frameworks(db) instead, "
        "which reads from the database."
    )


def get_framework(framework_id: str) -> Dict[str, Any] | None:

    """Deprecated: use :func:`app.services.tech_frameworks.get_tech_framework`."""

    raise RuntimeError(
        "tech_frameworks.get_framework() is deprecated. "
        "Use app.services.tech_frameworks.get_tech_framework(db, framework_id) "
        "instead, which reads from the database."
    )


def list_categories() -> List[str]:

    """Deprecated: use :func:`app.services.tech_frameworks.list_categories`."""

    raise RuntimeError(
        "tech_frameworks.list_categories() is deprecated. "
        "Use app.services.tech_frameworks.list_categories(db) instead, "
        "which reads from the database."
    )
