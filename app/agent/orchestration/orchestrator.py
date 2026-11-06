"""Phase 4.1 — Orchestrator agent.

Coordinates specialist agents: decomposes an objective into specialist
tasks, executes them (in parallel where independent), collects results
into shared memory, and synthesizes a unified final answer with
traceable citations.
"""

from __future__ import annotations

import re
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
from app.knowledge_base.embeddings import OllamaEmbeddingProvider
from app.knowledge_base.memory_retrieval import MemoryRetriever
from app.knowledge_base.storage import KnowledgeBaseStore


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

        self.embedder = OllamaEmbeddingProvider()

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

    @staticmethod
    def _clean_answer(answer: str) -> str:

        """Remove leaked prompt/meta-instruction text from a specialist answer."""

        if not answer:

            return ""

        lines = answer.splitlines()

        cleaned: List[str] = []

        skip_until_blank = False

        for line in lines:

            stripped = line.strip()

            if stripped.startswith(

                (

                    "RESEARCH OBJECTIVE:",

                    "SPECIALIST:",

                    "INSTRUCTIONS:",

                    "CONTEXT:",

                )

            ):

                skip_until_blank = True

                continue

            if skip_until_blank:

                if stripped == "":

                    skip_until_blank = False

                continue

            if stripped in (

                "Use the available database tools to gather evidence.",

                "Return findings with source citations.",

            ):

                continue

            if stripped.startswith("Sources:"):

                break

            cleaned.append(line)

        text = "\n".join(cleaned)

        text = re.sub(r"\n{3,}", "\n\n", text)

        return text.strip()

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

        # Normalize to valid SpecialistType enums, dropping invalid strings
        # (e.g. "Ai") so downstream aggregation matches the decomposed tasks.
        normalized: List[SpecialistType] = []
        for s in specialists:
            if isinstance(s, str):
                try:
                    normalized.append(SpecialistType(s))
                except ValueError:
                    continue
            else:
                normalized.append(s)
        specialists = normalized

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

                self._clean_answer(r.answer) for r in st_results if r.answer

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

            # Phase 5.6: retrieve prior research context from the KB

            kb_context = self._retrieve_kb_context(task.objective)

            if kb_context:

                prior_findings = (

                    prior_findings + "\n\n" + kb_context

                    if prior_findings

                    else kb_context

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

            # Phase 5.1/5.2: persist result as a research document with chunks

            # and embeddings for future retrieval

            self._store_research_document(

                task=task,

                answer=agent_result.final_answer or "",

                sources=sources,

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

    def _retrieve_kb_context(self, objective: str) -> str:
        """Phase 5.6: retrieve prior research context from the KB."""
        try:
            with MemoryRetriever() as retriever:
                return retriever.retrieve_context(
                    query=objective, top_k=5
                )
        except Exception:
            return ""

    def _store_research_document(
        self,
        task: AgentTask,
        answer: str,
        sources: List[SourceRecord],
    ) -> None:
        """Phase 5.1/5.2: persist a specialist result as a KB document
        with text chunks and embeddings for future retrieval.
        """
        try:
            title = f"{task.specialist_type.value}: {task.objective[:120]}"
            content = answer
            if sources:
                content += "\n\n## Sources\n"
                for s in sources:
                    content += f"- {s.title} [{s.source}] {s.url}\n"

            with KnowledgeBaseStore() as store:

                doc = store.store_document(

                    title=title,

                    content=content,

                    source_url=sources[0].url if sources else None,

                    category=task.specialist_type.value,

                    run_type="orchestration",

                    run_id=task.task_id,

                    metadata={

                        "specialist": task.specialist_type.value,

                        "task_id": task.task_id,

                        "source_count": len(sources),

                    },

                )

                # Chunk the document and embed each chunk

                chunks = self._chunk_text(content, max_chars=500)

                embedder = self.embedder

                if not embedder.is_available():

                    return

                from app.knowledge_base.vector_store import SqliteVectorStore

                vector_store = SqliteVectorStore(store)

                for idx, chunk_text in enumerate(chunks):

                    embedding = embedder.embed(chunk_text)

                    chunk = store.add_chunk(

                        document_id=doc.id,

                        chunk_index=idx,

                        content=chunk_text,

                        embedding=embedding,

                    )

                    vector_store.store_embedding(chunk.id, embedding)

                store.commit()

        except Exception:

            # KB storage must not fail the orchestrator run

            pass

    @staticmethod

    def _chunk_text(text: str, max_chars: int = 500) -> List[str]:

        """Simple character-based chunking."""

        if not text:

            return []

        words = text.split()

        chunks: List[str] = []

        current: List[str] = []

        current_len = 0

        for word in words:

            if current_len + len(word) + 1 > max_chars and current:

                chunks.append(" ".join(current))

                current = [word]

                current_len = len(word)

            else:

                current.append(word)

                current_len += len(word) + 1

        if current:

            chunks.append(" ".join(current))

        return chunks

    # ---- synthesis -----------------------------------------------------

    def _synthesize(

        self,

        objective: str,

        specialist_results: List[SpecialistAgentResult],

    ) -> str:

        total_tasks = sum(sr.total_tasks for sr in specialist_results)

        completed_tasks = sum(sr.completed_tasks for sr in specialist_results)

        failed_tasks = sum(sr.failed_tasks for sr in specialist_results)

        specialist_names = ", ".join(

            sr.specialist_type.value for sr in specialist_results

        )

        lines = [

            f"# AI Tech Research — {objective}",

            "",

            f"Specialists consulted: {len(specialist_results)} ({specialist_names})",

            f"Tasks: {total_tasks} total, {completed_tasks} completed, {failed_tasks} failed",

            "",

        ]

        for sr in specialist_results:

            display = sr.specialist_type.value.replace("_", " ").title()

            lines.append(f"## {display}")

            if sr.combined_answer:

                lines.append(sr.combined_answer)

            lines.append("")

        # Deduplicate sources globally across all specialists.

        seen: set = set()

        unique: List[SourceRecord] = []

        for sr in specialist_results:

            for s in sr.all_sources:

                if s.url and s.url not in seen:

                    seen.add(s.url)

                    unique.append(s)

        if unique:

            lines.append(f"## Sources ({len(unique)})")

            lines.append("")

            for idx, source in enumerate(unique, 1):

                title = source.title

                src = source.source or "unknown"

                score = source.relevance_score

                score_str = f" (relevance: {score}/100)" if score else ""

                lines.append(f"[{idx}] {title} [{src}]{score_str}")

                lines.append(f"    {source.url}")

                lines.append("")

        return "\n".join(lines).rstrip() + "\n"


__all__ = ["Orchestrator", "OrchestratorResult"]
