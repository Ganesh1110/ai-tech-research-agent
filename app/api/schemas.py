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


# ---- Autonomous ------------------------------------------------------

class AutonomousStartResponse(BaseModel):
    started: bool
    interval_seconds: int


class AutonomousStatusResponse(BaseModel):
    running: bool
    interval_seconds: int
    job_counts: Dict[str, int]


class JobResponse(BaseModel):
    id: int
    job_type: str
    worker_type: str
    payload: Dict[str, Any]
    status: str
    created_at: Optional[str] = None
    started_at: Optional[str] = None
    finished_at: Optional[str] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    retry_count: int
    max_retries: int


class ProcessJobResponse(BaseModel):
    processed: bool
    job: Optional[JobResponse] = None


class DiscoveryItemResponse(BaseModel):
    id: int
    external_id: str
    source: str
    title: str
    description: str
    url: str
    category: str
    overall_score: Optional[float] = None
    recommendation_level: Optional[str] = None
    first_seen_at: Optional[str] = None


class DiscoveriesResponse(BaseModel):
    items: List[DiscoveryItemResponse]
    count: int


class RecommendationItemResponse(BaseModel):
    id: int
    discovered_item_id: int
    recommendation_level: str
    reason: str
    suggested_action: str
    confidence: float
    created_at: Optional[str] = None


class RecommendationsResponse(BaseModel):
    items: List[RecommendationItemResponse]
    count: int


class CycleResponse(BaseModel):
    id: int
    started_at: Optional[str] = None
    finished_at: Optional[str] = None
    duration_seconds: Optional[float] = None
    items_collected: int
    items_new: int
    items_deduped: int
    high_potential_count: int
    failed_collectors: List[str]
    status: str


class CyclesResponse(BaseModel):
    cycles: List[CycleResponse]
    count: int


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

    "AutonomousStartResponse",

    "AutonomousStatusResponse",

    "JobResponse",

    "ProcessJobResponse",

    "DiscoveryItemResponse",

    "DiscoveriesResponse",

    "RecommendationItemResponse",

    "RecommendationsResponse",

    "CycleResponse",

    "CyclesResponse",

]
