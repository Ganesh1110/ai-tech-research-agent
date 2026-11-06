"""Phase 4.1 — Orchestrator agent.

Coordinates specialist agents: decomposes an objective into specialist
tasks, executes them (in parallel where independent), collects results
into shared memory, and synthesizes a unified final answer with
traceable citations.
"""

import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from typing import Any, Dict, List, Optional

from app.agent.agent import AutonomousAgent
from app.agent.orchestration.shared_memory import SharedFinding, SharedMemory
from app.agent.orchestration.validation import EvidenceValidator
from app.agent.orchestration.schemas import (
    AgentTask,
    OrchestratorResult,
    SpecialistAgentResult,
    SpecialistType,
    TaskResult,
    TaskStatus,
)
from app.agent.schemas import SourceRecord
from app.config import settings


class Orchestrator:

    """Coordinates specialist research agents for a single objective."""

    # Default specialist types invoked for a general research objective

    DEFAULT_SPECIALISTS: List[SpecialistType] = [

        SpecialistType.AI_LLM,

        SpecialistType.AGENTIC_AI,

        SpecialistType.DEVELOPER_TOOLS,

        SpecialistType.REACT_NATIVE,

        SpecialistType.OPEN_SOURCE,

    ]

    def __init__(

        self,

        agent: Optional[AutonomousAgent] = None,

        shared_memory: Optional[SharedMemory] = None,

        max_workers: int = 3,

    ):

        self.agent = agent or AutonomousAgent()

        self.memory = shared_memory or SharedMemory()

        self.max_workers = max_workers

        self.validator = EvidenceValidator()

    # ---- task decomposition -------------------------------------------

    def decompose_objective(

        self,

        objective: str,

        specialist_types: Optional[List[SpecialistType]] = None,

    ) -> List[AgentTask]:

        """Break an objective into per-specialist tasks."""

        raw = specialist_types or self.DEFAULT_SPECIALISTS

        specialists: List[SpecialistType] = []

        for s in raw:

            if isinstance(s, str):

                try:

                    specialists.append(SpecialistType(s))

                except ValueError:

                    continue

            else:

                specialists.append(s)

        tasks: List[AgentTask] = []

        for idx, st in enumerate(specialists):

            tasks.append(

                AgentTask(

                    task_id=f"task-{idx+1}",

                    specialist_type=st,

                    objective=objective,

                    instructions=self._build_instructions(st, objective),

                    context={},

                )

            )

        return tasks

    @staticmethod

    def _build_instructions(

        specialist_type: SpecialistType,

        objective: str,

    ) -> str:

        return (

            f"You are a {specialist_type.value} research specialist. "

            f"Research the following objective from your specialist perspective: "

            f"{objective}\n\n"

            "Focus on findings relevant to your specialty. Use the available "

            "database tools to gather evidence. Return your findings with "

            "source citations (title, URL, category, relevance score)."

        )

    # ---- execution ----------------------------------------------------

    def run(

        self,

        objective: str,

        specialist_types: Optional[List[SpecialistType]] = None,

        parallel: bool = True,

    ) -> OrchestratorResult:

        """Execute the full orchestration pipeline."""

        start_time = datetime.now()

        specialists = specialist_types or self.DEFAULT_SPECIALISTS

        tasks = self.decompose_objective(objective, specialists)

        task_results: List[TaskResult] = []

        if parallel and len(tasks) > 1:

            task_results = self._run_parallel(tasks)

        else:

            task_results = self._run_sequential(tasks)

        # Register all results in shared memory

        for result in task_results:

            self.memory.register_task_result(result)

            for source in result.sources:

                self.memory.add_finding(

                    SharedFinding(

                        finding_id=f"finding-{result.task_id}",

                        specialist_type=result.specialist_type,

                        source_url=source.url,

                        title=source.title,

                        summary=getattr(source, "summary", ""),

                        category=source.source,

                        relevance_score=source.relevance_score,

                        contributed_by=result.specialist_type.value,

                    )

                )

        # Build per-specialist aggregated results

        specialist_results: List[SpecialistAgentResult] = []

        all_sources: List[SourceRecord] = []

        seen_urls: set = set()

        for st in specialists:

            st_results = [

                r for r in task_results if r.specialist_type == st

            ]

            combined = "\n\n".join(

                f"## Task {r.task_id}\n{r.answer}" for r in st_results if r.answer

            )

            st_sources: List[SourceRecord] = []

            for r in st_results:

                for s in r.sources:

                    if s.url and s.url not in seen_urls:

                        seen_urls.add(s.url)

                        st_sources.append(s)

                        all_sources.append(s)

            completed = sum(

                1 for r in st_results if r.status == TaskStatus.COMPLETED

            )

            failed = sum(1 for r in st_results if r.status == TaskStatus.FAILED)

            specialist_results.append(

                SpecialistAgentResult(

                    specialist_type=st,

                    task_results=st_results,

                    combined_answer=combined,

                    all_sources=st_sources,

                    total_tasks=len(st_results),

                    completed_tasks=completed,

                    failed_tasks=failed,

                )

            )

        # Synthesize final answer

        final_answer = self._synthesize(objective, specialist_results)

        # Validate evidence quality

        validation_report = self.validator.validate_sources(all_sources)

        if not validation_report.is_valid or validation_report.issues:

            final_answer += "\n\n" + EvidenceValidator.format_report(

                validation_report

            )

        finished_at = datetime.now()

        duration = (finished_at - start_time).total_seconds()

        completed = sum(

            1 for r in task_results if r.status == TaskStatus.COMPLETED

        )

        failed = sum(1 for r in task_results if r.status == TaskStatus.FAILED)

        return OrchestratorResult(

            objective=objective,

            specialist_results=specialist_results,

            final_answer=final_answer,

            all_sources=all_sources,

            total_tasks=len(task_results),

            completed_tasks=completed,

            failed_tasks=failed,

            duration_seconds=duration,

            metrics=self.memory.summary(),

            created_at=finished_at.isoformat(),

        )

    def _run_parallel(self, tasks: List[AgentTask]) -> List[TaskResult]:

        results: List[TaskResult] = []

        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:

            future_to_task = {

                executor.submit(self._execute_task, task): task

                for task in tasks

            }

            for future in as_completed(future_to_task):

                task = future_to_task[future]

                try:

                    result = future.result()

                    results.append(result)

                except Exception as exc:  # noqa: BLE001

                    results.append(

                        TaskResult(

                            task_id=task.task_id,

                            specialist_type=task.specialist_type,

                            status=TaskStatus.FAILED,

                            answer="",

                            error=str(exc),

                        )

                    )

        return results

    def _run_sequential(self, tasks: List[AgentTask]) -> List[TaskResult]:

        results: List[TaskResult] = []

        for task in tasks:

            results.append(self._execute_task(task))

        return results

    def _execute_task(self, task: AgentTask) -> TaskResult:

        """Execute a single delegated task via a specialist agent."""

        task.status = TaskStatus.IN_PROGRESS

        start_time = time.time()

        try:

            # Build a prompt that includes any prior findings from

            # other specialists (shared memory context)

            prior_findings = self._gather_prior_findings(

                task.specialist_type, task.task_id

            )

            prompt = self._build_step_prompt(task, prior_findings)

            agent_result = self.agent.run(objective=prompt)

            latency = time.time() - start_time

            task.status = TaskStatus.COMPLETED

            task.completed_at = datetime.now().isoformat()

            # Convert agent sources to SourceRecord list

            sources: List[SourceRecord] = []

            for s in agent_result.sources or []:

                sources.append(

                    SourceRecord(

                        id=getattr(s, "id", None),

                        title=getattr(s, "title", "Unknown"),

                        url=getattr(s, "url", ""),

                        source=getattr(s, "source", "unknown"),

                        relevance_score=getattr(s, "relevance_score", None),

                    )

                )

            return TaskResult(

                task_id=task.task_id,

                specialist_type=task.specialist_type,

                status=TaskStatus.COMPLETED,

                answer=agent_result.final_answer or "",

                sources=sources,

                metrics={

                    "steps": agent_result.total_steps,

                    "latency_seconds": latency,

                },

            )

        except Exception as exc:  # noqa: BLE001

            latency = time.time() - start_time

            task.status = TaskStatus.FAILED

            task.completed_at = datetime.now().isoformat()

            return TaskResult(

                task_id=task.task_id,

                specialist_type=task.specialist_type,

                status=TaskStatus.FAILED,

                answer="",

                error=str(exc),

                metrics={"latency_seconds": latency},

            )

    def _gather_prior_findings(

        self, specialist_type: SpecialistType, current_task_id: str

    ) -> str:

        """Return findings from other specialists as context."""

        lines: List[str] = []

        for result in self.memory.all_task_results():

            if result.specialist_type == specialist_type:

                continue

            if result.answer:

                lines.append(

                    f"--- {result.specialist_type.value} findings ---"

                )

                lines.append(result.answer[:600])

                lines.append("")

        return "\n".join(lines)

    @staticmethod

    def _build_step_prompt(

        task: AgentTask, prior_findings: str

    ) -> str:

        lines = [

            f"RESEARCH OBJECTIVE: {task.objective}",

            f"SPECIALIST: {task.specialist_type.value}",

            f"INSTRUCTIONS: {task.instructions}",

            "",

        ]

        if prior_findings:

            lines.append("PRIOR FINDINGS FROM OTHER SPECIALISTS:")

            lines.append(prior_findings)

            lines.append("")

        lines.append("Use the available database tools to gather evidence.")

        lines.append("Return findings with source citations.")

        return "\n".join(lines)

    # ---- synthesis ----------------------------------------------------

    def _synthesize(

        self,

        objective: str,

        specialist_results: List[SpecialistAgentResult],

    ) -> str:

        lines = [

            f"Multi-Agent Research: {objective}",

            f"Specialists consulted: {len(specialist_results)}",

            "",

        ]

        for sr in specialist_results:

            lines.append(f"## {sr.specialist_type.value}")

            lines.append(sr.combined_answer)

            lines.append("")

        # Deduplicate sources

        seen = set()

        unique: List[SourceRecord] = []

        for sr in specialist_results:

            for s in sr.all_sources:

                if s.url and s.url not in seen:

                    seen.add(s.url)

                    unique.append(s)

        lines.append("## Sources")

        for idx, source in enumerate(unique, 1):

            title = source.title

            src = source.source or "unknown"

            score = source.relevance_score

            score_str = f" (relevance: {score}/100)" if score else ""

            lines.append(f"[{idx}] {title} [{src}]{score_str}")

            lines.append(f"    {source.url}")

        return "\n".join(lines)


__all__ = ["Orchestrator", "OrchestratorResult"]
