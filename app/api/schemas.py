"""Phase 6.1 — FastAPI backend API schemas.

Request/response models for the research platform API.
"""

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ---- Agent -----------------------------------------------------------

class AgentRunRequest(BaseModel):
    objective: str = Field(..., description="Research objective")


class AgentRunResponse(BaseModel):
    objective: str
    status: str
    total_steps: int
    sources: int
    final_answer: str
    completed_at: Optional[str] = None


# ---- Workflow --------------------------------------------------------

class WorkflowRunRequest(BaseModel):
    workflow_type: str = Field(
        ..., description="technology_discovery or framework_comparison"
    )
    objective: str
    criteria: Optional[str] = None


class WorkflowRunResponse(BaseModel):
    objective: str
    workflow_type: str
    steps_completed: int
    sources: int
    final_answer: str
    created_at: Optional[str] = None


# ---- Orchestration ---------------------------------------------------

class OrchestrateRunRequest(BaseModel):
    objective: str
    specialists: Optional[str] = Field(
        None, description="Comma-separated specialist types"
    )
    parallel: bool = True


class OrchestrateRunResponse(BaseModel):
    objective: str
    specialists: int
    total_tasks: int
    completed_tasks: int
    failed_tasks: int
    duration_seconds: Optional[float]
    sources: int
    final_answer: str
    created_at: Optional[str] = None


# ---- Knowledge Base --------------------------------------------------

class KbSearchRequest(BaseModel):
    query: str
    top_k: int = 10
    category: Optional[str] = None


class KbSearchResult(BaseModel):
    chunk_id: int
    document_id: int
    chunk_index: int
    content: str
    title: str
    source_url: Optional[str] = None
    category: Optional[str] = None
    run_type: Optional[str] = None
    rrf_score: Optional[float] = None
    bm25_score: Optional[float] = None
    vector_similarity: Optional[float] = None


class KbSearchResponse(BaseModel):
    query: str
    results: List[KbSearchResult]
    count: int


class KbStatsResponse(BaseModel):
    total_documents: int
    total_chunks: int
    embedded_chunks: int
    embedding_coverage: float
    stale_documents: int


# ---- Document --------------------------------------------------------

class DocumentSummary(BaseModel):
    id: int
    title: str
    category: Optional[str] = None
    run_type: Optional[str] = None
    created_at: Optional[str] = None
    source_url: Optional[str] = None


class DocumentsResponse(BaseModel):
    documents: List[DocumentSummary]
    count: int


# ---- Evaluation ------------------------------------------------------

class EvaluationResponse(BaseModel):
    total_tests: int
    passed: int
    failed: int
    average_score: float
    results: List[Dict[str, Any]]


# ---- Health ----------------------------------------------------------

class HealthResponse(BaseModel):
    status: str
    ollama_available: bool
    ollama_model: str
    ollama_base_url: str


__all__ = [
    "AgentRunRequest",
    "AgentRunResponse",
    "WorkflowRunRequest",
    "WorkflowRunResponse",
    "OrchestrateRunRequest",
    "OrchestrateRunResponse",
    "KbSearchRequest",
    "KbSearchResponse",
    "KbStatsResponse",
    "DocumentSummary",
    "DocumentsResponse",
    "EvaluationResponse",
    "HealthResponse",
]
