"""Phase 4.6 — Evidence validation.

Validates specialist findings for source quality and flags potential
conflicts across specialists so the orchestrator can resolve them.
"""

import re
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from app.agent.schemas import SourceRecord


@dataclass

class ValidationIssue:

    """A single validation issue found in evidence."""

    severity: str  # "warning" or "error"

    message: str

    source_url: Optional[str] = None


@dataclass

class ValidationReport:

    """Aggregated validation results."""

    total_sources: int = 0

    valid_sources: int = 0

    sources_with_score: int = 0

    avg_relevance_score: Optional[float] = None

    issues: List[ValidationIssue] = field(default_factory=list)

    is_valid: bool = True

    def add_issue(self, severity: str, message: str, source_url: Optional[str] = None):

        self.issues.append(ValidationIssue(severity, message, source_url))

        if severity == "error":

            self.is_valid = False


class EvidenceValidator:

    """Validates research evidence quality and consistency."""

    def validate_sources(self, sources: List[SourceRecord]) -> ValidationReport:

        report = ValidationReport()

        report.total_sources = len(sources)

        scores: List[int] = []

        seen_urls: set = set()

        for source in sources:

            url = source.url or ""

            title = source.title or ""

            score = source.relevance_score

            # Check URL validity

            if not url:

                report.add_issue(

                    "error",

                    "Source missing URL",

                    url or None,

                )

                continue

            if not self._is_valid_url(url):

                report.add_issue(

                    "warning",

                    f"Source URL may be invalid: {url}",

                    url,

                )

                continue

            # Check title

            if not title or title == "Unknown":

                report.add_issue(

                    "warning",

                    f"Source missing title: {url}",

                    url,

                )

                continue

            # Duplicate detection

            if url in seen_urls:

                report.add_issue(

                    "warning",

                    f"Duplicate source URL: {url}",

                    url,

                )

                continue

            seen_urls.add(url)

            report.valid_sources += 1

            if score is not None:

                scores.append(score)

                report.sources_with_score += 1

        if scores:

            report.avg_relevance_score = round(sum(scores) / len(scores), 2)

        return report

    @staticmethod

    def _is_valid_url(url: str) -> bool:

        return bool(

            re.match(r"^https?://", url, re.IGNORECASE)

        )

    @staticmethod

    def format_report(report: ValidationReport) -> str:

        lines = [

            "## Evidence Validation",

            f"Total sources: {report.total_sources}",

            f"Valid sources: {report.valid_sources}",

            f"Sources with score: {report.sources_with_score}",

            f"Avg relevance: {report.avg_relevance_score}",

            f"Valid: {report.is_valid}",

        ]

        if report.issues:

            lines.append("")

            lines.append("Issues:")

            for issue in report.issues[:10]:

                lines.append(

                    f"  [{issue.severity}] {issue.message}"

                    + (f" ({issue.source_url})" if issue.source_url else "")

                )

        return "\n".join(lines)


__all__ = ["EvidenceValidator", "ValidationReport", "ValidationIssue"]
