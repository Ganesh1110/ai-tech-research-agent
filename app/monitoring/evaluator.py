"""Evaluation framework for agent and workflow reliability testing.

Runs a suite of test objectives and scores results on:
  - source accuracy (valid URL + title)
  - category filtering correctness
  - empty-result handling
  - duplicate prevention
  - multi-step execution efficiency
  - citation traceability
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional

from app.monitoring.metrics import MetricsCollector


@dataclass
class TestCase:

    name: str
    objective: str
    mode: str = "agent"  # "agent" or "workflow"
    workflow_type: Optional[str] = None
    criteria: Optional[str] = None
    expected_min_sources: int = 1
    expected_categories: Optional[List[str]] = None
    must_not_be_empty: bool = True


@dataclass
class EvaluationResult:

    test_name: str
    passed: bool
    score: float  # 0.0 to 1.0
    checks: Dict[str, bool] = field(default_factory=dict)
    details: Dict[str, Any] = field(default_factory=dict)
    error: Optional[str] = None


class Evaluator:

    """Runs evaluation test cases and scores reliability."""

    def __init__(self, agent: Optional[AutonomousAgent] = None):

        from app.agent.agent import AutonomousAgent as _Agent

        self.agent = agent or _Agent()

    def run_case(
        self,
        case: TestCase,
    ) -> EvaluationResult:

        checks: Dict[str, bool] = {}
        details: Dict[str, Any] = {}
        error: Optional[str] = None

        try:

            if case.mode == "workflow" and case.workflow_type:

                from app.agent.workflows import (

                    FrameworkComparisonWorkflow,

                    TechnologyDiscoveryWorkflow,

                )

                workflow_map = {

                    "technology_discovery": TechnologyDiscoveryWorkflow,

                    "framework_comparison": FrameworkComparisonWorkflow,

                }

                workflow_cls = workflow_map.get(case.workflow_type)

                if not workflow_cls:

                    return EvaluationResult(

                        test_name=case.name,

                        passed=False,

                        score=0.0,

                        error=f"Unknown workflow type: {case.workflow_type}",

                    )

                context: Dict[str, Any] = {}

                if case.criteria:

                    context["criteria"] = case.criteria

                result = workflow_cls(agent=self.agent).run(

                    objective=case.objective,

                    context=context,

                )

                answer = result.final_answer or ""

                sources = list(result.sources or [])

                metrics = result.metrics or {}

            else:

                result = self.agent.run(objective=case.objective)

                answer = result.final_answer or ""

                sources = list(result.sources or [])

                metrics = result.metrics or {}

            # ---- Check 1: Source accuracy ----

            accurate = 0

            for source in sources:

                url = getattr(source, "url", "") or ""

                title = getattr(source, "title", "") or ""

                if url and title:

                    accurate += 1

            source_accuracy = (accurate / len(sources)) if sources else (1.0 if not case.must_not_be_empty else 0.0)

            checks["source_accuracy"] = source_accuracy >= 1.0 if sources else True

            details["source_accuracy"] = round(source_accuracy, 2)

            details["sources_checked"] = len(sources)

            details["accurate_sources"] = accurate

            # ---- Check 2: No-result handling ----

            if not sources and case.must_not_be_empty:

                checks["empty_result_handled"] = "No relevant research items" in answer or "No " in answer

            else:

                checks["empty_result_handled"] = True

            details["sources_returned"] = len(sources)

            # ---- Check 3: Duplicate prevention ----

            urls = [getattr(s, "url", "") for s in sources if getattr(s, "url", "")]

            checks["no_duplicates"] = len(urls) == len(set(urls))

            details["unique_urls"] = len(set(urls))

            details["total_urls"] = len(urls)

            # ---- Check 4: Citation traceability ----

            citation_numbers = self._extract_citation_numbers(answer)

            source_urls = {getattr(s, "url", "") for s in sources if getattr(s, "url", "")}

            # every citation number should be <= number of sources

            max_cite = max(citation_numbers) if citation_numbers else 0

            checks["citations_traceable"] = max_cite <= len(sources)

            details["max_citation_number"] = max_cite

            details["citation_numbers"] = citation_numbers[:10]

            # ---- Check 5: Category filtering ----

            if case.expected_categories:

                cats = {getattr(s, "source", "") or getattr(s, "title", "") for s in sources}

                # heuristic: check if any source mentions expected category terms

                category_match = any(

                    any(cat.lower() in str(s).lower() for cat in case.expected_categories)

                    for s in sources

                ) if sources else False

                checks["category_filtering"] = category_match

                details["expected_categories"] = case.expected_categories

            else:

                checks["category_filtering"] = True

            # ---- Check 6: Multi-step execution (did not waste all steps failing) ----

            step_sum = metrics.get("step_summary", {})

            total_steps = step_sum.get("total_steps", 0)

            failed_steps = step_sum.get("failed_steps", 0)

            checks["efficient_execution"] = failed_steps < total_steps if total_steps else True

            details["total_steps"] = total_steps

            details["failed_steps"] = failed_steps

            # ---- Check 7: Minimum sources ----

            checks["min_sources_met"] = len(sources) >= case.expected_min_sources

            # ---- Overall score ----

            passed_checks = [v for v in checks.values() if isinstance(v, bool)]

            score = (sum(passed_checks) / len(passed_checks)) if passed_checks else 0.0

            passed = all(passed_checks) and (len(sources) >= case.expected_min_sources or not case.must_not_be_empty)

            return EvaluationResult(

                test_name=case.name,

                passed=passed,

                score=round(score, 2),

                checks=checks,

                details=details,

            )

        except Exception as exc:  # noqa: BLE001

            error = str(exc)

            return EvaluationResult(

                test_name=case.name,

                passed=False,

                score=0.0,

                checks={},

                details={},

                error=error,

            )

    def run_suite(
        self,
        cases: List[TestCase],
    ) -> List[EvaluationResult]:

        return [self.run_case(c) for c in cases]

    @staticmethod

    def _extract_citation_numbers(answer: str) -> List[int]:

        import re

        return [int(m) for m in re.findall(r"\[(\d+)\]", answer)]

    @staticmethod

    def report(results: List[EvaluationResult]) -> str:

        lines = ["EVALUATION REPORT", "=" * 60, ""]

        total = len(results)

        passed = sum(1 for r in results if r.passed)

        avg_score = round(sum(r.score for r in results) / total, 2) if total else 0.0

        lines.append(f"Total tests: {total}")

        lines.append(f"Passed: {passed}")

        lines.append(f"Failed: {total - passed}")

        lines.append(f"Average score: {avg_score}")

        lines.append("")

        for r in results:

            status = "PASS" if r.passed else "FAIL"

            lines.append(f"[{status}] {r.test_name} (score: {r.score})")

            for check, ok in r.checks.items():

                lines.append(f"    {check}: {'ok' if ok else 'FAIL'}")

            if r.error:

                lines.append(f"    ERROR: {r.error}")

            lines.append("")

        return "\n".join(lines)


__all__ = ["Evaluator", "TestCase", "EvaluationResult"]
