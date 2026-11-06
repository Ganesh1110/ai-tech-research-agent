"""app.data package."""

from app.data.tech_frameworks import (
    TECH_FRAMEWORKS_DATA,
    get_framework,
    list_categories,
    list_frameworks,
)

__all__ = ["TECH_FRAMEWORKS_DATA", "list_frameworks", "get_framework", "list_categories"]
