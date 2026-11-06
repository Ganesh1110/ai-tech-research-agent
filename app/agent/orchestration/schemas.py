"""Phase 4.4 — Agent communication contracts.

Structured task and result contracts for specialist agents coordinated by
an orchestrator. These keep inter-agent communication explicit and
traceable.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from app.agent.schemas import SourceRecord


class SpecialistType(str, Enum):
    """Categories of specialist research agents."""

    AI_LLM = "ai_llm"
    REACT_NATIVE = "react_native"
    AGENTIC_AI = "agentic_ai"
    DEVELOPER_TOOLS = "developer_tools"
    OPEN_SOURCE = "open_source"
    GENERAL = "general"


class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


class AgentTask(BaseModel):
    """A delegated unit of work for a specialist agent."""

    task_id: str
    specialist_type: SpecialistType
    objective: str
    instructions: str
    context: Dict[str, Any] = Field(default_factory=dict)
    status: TaskStatus = TaskStatus.PENDING
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    completed_at: Optional[str] = None
    depends_on: List[str] = Field(
        default_factory=list,
        description="Task IDs that must complete before this task",
    )


class TaskResult(BaseModel):
    """Result returned by a specialist agent for a delegated task."""

    task_id: str
    specialist_type: SpecialistType
    status: TaskStatus
    answer: str
    sources: List[SourceRecord] = Field(default_factory=list)
    metrics: Dict[str, Any] = Field(default_factory=dict)
    completed_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    error: Optional[str] = None


class SpecialistAgentResult(BaseModel):
    """Aggregated result from one specialist agent across its tasks."""

    specialist_type: SpecialistType
    task_results: List[TaskResult] = Field(default_factory=list)
    combined_answer: str
    all_sources: List[SourceRecord] = Field(default_factory=list)
    total_tasks: int = 0
    completed_tasks: int = 0
    failed_tasks: int = 0


class OrchestratorResult(BaseModel):
    """Final result of an orchestrator-coordinated research run."""

    objective: str
    specialist_results: List[SpecialistAgentResult] = Field(default_factory=list)
    final_answer: str
    all_sources: List[SourceRecord] = Field(default_factory=list)
    total_tasks: int = 0
    completed_tasks: int = 0
    failed_tasks: int = 0
    duration_seconds: Optional[float] = None
    metrics: Dict[str, Any] = Field(default_factory=dict)
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())


__all__ = [
    "SpecialistType",
    "TaskStatus",
    "AgentTask",
    "TaskResult",
    "SpecialistAgentResult",
    "OrchestratorResult",
]
