from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class AgentStatus(str, Enum):
    PLANNING = "planning"
    EXECUTING = "executing"
    OBSERVING = "observing"
    REPLANNING = "replanning"
    COMPLETED = "completed"
    FAILED = "failed"


class ToolCall(BaseModel):
    tool: str = Field(description="Name of the tool to call")
    arguments: Dict[str, Any] = Field(
        default_factory=dict,
        description="Arguments to pass to the tool",
    )
    reason: str = Field(
        description="Why this tool is being called",
    )


class ToolResult(BaseModel):
    tool: str
    success: bool
    data: Any = None
    error: Optional[str] = None


class AgentStep(BaseModel):
    step_number: int
    status: AgentStatus
    thought: Optional[str] = None
    plan: Optional[List[str]] = None
    tool_calls: List[ToolCall] = Field(default_factory=list)
    tool_results: List[ToolResult] = Field(default_factory=list)
    observation: Optional[str] = None
    timestamp: str


class ResearchPlan(BaseModel):
    objective: str
    subtasks: List[str] = Field(default_factory=list)
    tools_needed: List[str] = Field(default_factory=list)
    success_criteria: str = ""


class AgentResult(BaseModel):
    objective: str
    status: AgentStatus
    steps: List[AgentStep] = Field(default_factory=list)
    final_answer: Optional[str] = None
    sources: List[str] = Field(default_factory=list)
    total_steps: int = 0
    completed_at: Optional[str] = None