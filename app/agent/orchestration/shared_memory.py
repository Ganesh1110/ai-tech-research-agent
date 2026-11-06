"""Phase 4.3 — Shared memory for cross-agent context sharing.

Allows specialist agents to read findings from other specialists without
duplicating research, and lets the orchestrator build a unified view.
"""

import threading
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional

from app.agent.schemas import SourceRecord
from app.agent.orchestration.schemas import SpecialistType, TaskResult


@dataclass
class SharedFinding:

    """A research finding shared across agents."""

    finding_id: str
    specialist_type: SpecialistType
    source_url: str
    title: str
    summary: str
    category: Optional[str] = None
    relevance_score: Optional[int] = None
    contributed_by: str = ""
    created_at: str = field(
        default_factory=lambda: datetime.now().isoformat()
    )


class SharedMemory:

    """Thread-safe shared memory pool for multi-agent research.

    Specialists write findings here; other specialists can query them to
    avoid re-researching the same sources. The orchestrator reads the
    full pool to synthesize the final answer.
    """

    def __init__(self):

        self._lock = threading.RLock()

        # task_id -> TaskResult
        self._task_results: Dict[str, TaskResult] = {}

        # specialist_type -> list of SharedFinding
        self._findings: Dict[SpecialistType, List[SharedFinding]] = (
            defaultdict(list)
        )

        # source_url -> SharedFinding (dedup)
        self._findings_by_url: Dict[str, SharedFinding] = {}

        # specialist_type -> combined answer fragments
        self._answers: Dict[SpecialistType, List[str]] = defaultdict(list)

    # ---- task result registry -------------------------------------------

    def register_task_result(self, result: TaskResult) -> None:

        with self._lock:

            self._task_results[result.task_id] = result

    def get_task_result(self, task_id: str) -> Optional[TaskResult]:

        with self._lock:

            return self._task_results.get(task_id)

    def get_results_by_specialist(
        self, specialist_type: SpecialistType
    ) -> List[TaskResult]:

        with self._lock:

            return [

                r

                for r in self._task_results.values()

                if r.specialist_type == specialist_type

            ]

    def all_task_results(self) -> List[TaskResult]:

        with self._lock:

            return list(self._task_results.values())

    # ---- findings registry ----------------------------------------------

    def add_finding(self, finding: SharedFinding) -> bool:

        """Add a finding. Returns True if newly added (not a duplicate)."""

        with self._lock:

            if finding.source_url in self._findings_by_url:

                existing = self._findings_by_url[finding.source_url]

                # Keep the higher relevance score if available

                if (

                    finding.relevance_score is not None

                    and existing.relevance_score is not None

                    and finding.relevance_score > existing.relevance_score

                ):

                    idx = self._findings[existing.specialist_type].index(

                        existing

                    )

                    self._findings[existing.specialist_type][idx] = finding

                    self._findings_by_url[finding.source_url] = finding

                return False

            self._findings[finding.specialist_type].append(finding)

            self._findings_by_url[finding.source_url] = finding

            return True

    def get_findings_by_specialist(
        self, specialist_type: SpecialistType
    ) -> List[SharedFinding]:

        with self._lock:

            return list(self._findings.get(specialist_type, []))

    def all_findings(self) -> List[SharedFinding]:

        with self._lock:

            return list(self._findings_by_url.values())

    def findings_count(self) -> int:

        with self._lock:

            return len(self._findings_by_url)

    # ---- answer fragments -----------------------------------------------

    def add_answer_fragment(
        self, specialist_type: SpecialistType, fragment: str
    ) -> None:

        with self._lock:

            self._answers[specialist_type].append(fragment)

    def get_answer_fragments(
        self, specialist_type: SpecialistType
    ) -> List[str]:

        with self._lock:

            return list(self._answers.get(specialist_type, []))

    def all_answer_fragments(self) -> Dict[SpecialistType, List[str]]:

        with self._lock:

            return {k: list(v) for k, v in self._answers.items()}

    # ---- summary --------------------------------------------------------

    def summary(self) -> Dict[str, Any]:

        with self._lock:

            total_findings = len(self._findings_by_url)

            findings_by_specialist = {

                st.value: len(v) for st, v in self._findings.items()

            }

            completed = sum(

                1

                for r in self._task_results.values()

                if r.status == "completed"

            )

            failed = sum(

                1 for r in self._task_results.values() if r.status == "failed"

            )

            return {

                "total_findings": total_findings,

                "findings_by_specialist": findings_by_specialist,

                "total_tasks": len(self._task_results),

                "completed_tasks": completed,

                "failed_tasks": failed,

            }
