"""Phase 6.1 — FastAPI backend API schemas.

Request/response models for the research platform API.
"""

from __future__ import annotations

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


# ---- Frameworks (Tech Frameworks Directory) --------------------------

class FrameworkItem(BaseModel):
    id: str
    category: str
    name: str
    framework: str
    runtime: str
    maturity: str
    maturityColor: str
    tagline: str
    keyFeatures: List[str]
    bestFor: str
    docsUrl: str


class FrameworksResponse(BaseModel):
    frameworks: List[FrameworkItem]
    categories: List[str]
    count: int


# ---- Content: Tech Resources, Trending Items, Dashboard Metrics ----------

class TechResourceItem(BaseModel):
    id: str
    type: str
    name: str
    org: str = ""
    context: str = ""
    strengths: str = ""
    suitability: str = ""
    benchmark: str = ""
    size: str = ""
    desc: str = ""
    url: str = ""
    is_active: bool = True


class TechResourceListResponse(BaseModel):
    items: List[TechResourceItem]
    total: int


class TrendingItemResponse(BaseModel):
    id: str
    type: str
    name: str
    stars: str = ""
    forks: str = ""
    growth: str = ""
    category: str = ""
    desc: str = ""
    count: str = ""
    url: str = ""
    is_active: bool = True


class TrendingItemListResponse(BaseModel):
    items: List[TrendingItemResponse]
    total: int


class DashboardMetricItem(BaseModel):
    id: str
    name: str
    type: str
    label: str = ""
    value: int = 0
    color: str = "#6366f1"
    is_active: bool = True


class DashboardMetricListResponse(BaseModel):
    items: List[DashboardMetricItem]
    total: int


class ProblemCategoriesResponse(BaseModel):
    categories: List[str]


class ProblemSourcesResponse(BaseModel):
    sources: List[str]


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


# ---- Founder OS: Startup & Growth Models ----------------------------

class StartupOpportunityResponse(BaseModel):
    id: int
    research_item_id: Optional[int] = None
    title: str
    tagline: str = ""
    problem_statement: str
    proposed_solution: str
    target_audience: str = ""
    business_model: str = "B2B SaaS"
    technical_feasibility: int = 75
    market_opportunity: int = 75
    cost_feasibility: int = 80
    differentiation: int = 70
    overall_score: int = 75
    technologies: List[str] = Field(default_factory=list)
    competitors: List[str] = Field(default_factory=list)
    mvp_features: List[str] = Field(default_factory=list)
    status: str = "discovered"
    notes: Optional[str] = None
    metadata_json: Dict[str, Any] = Field(default_factory=dict)
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class StartupOpportunityListResponse(BaseModel):
    items: List[StartupOpportunityResponse]
    total: int


class UpdateOpportunityStatusRequest(BaseModel):
    status: str
    notes: Optional[str] = None


class WeeklyBriefingResponse(BaseModel):
    id: int
    week_identifier: str
    title: str
    summary: str
    top_technologies: List[Dict[str, Any]] = Field(default_factory=list)
    top_opportunities: List[Dict[str, Any]] = Field(default_factory=list)
    recommended_mvp: Dict[str, Any] = Field(default_factory=dict)
    skill_focus: Dict[str, Any] = Field(default_factory=dict)
    generated_at: Optional[str] = None
    is_read: bool = False
    metadata_json: Dict[str, Any] = Field(default_factory=dict)


class WeeklyBriefingListResponse(BaseModel):
    briefings: List[WeeklyBriefingResponse]
    total: int


class ProductBlueprintResponse(BaseModel):
    id: int
    opportunity_id: Optional[int] = None
    name: str
    tagline: str = ""
    architecture_summary: str = ""
    tech_stack: Dict[str, Any] = Field(default_factory=dict)
    system_components: List[Dict[str, Any]] = Field(default_factory=list)
    api_spec_outline: List[Dict[str, Any]] = Field(default_factory=list)
    mvp_roadmap: List[str] = Field(default_factory=list)
    status: str = "draft"
    metadata_json: Dict[str, Any] = Field(default_factory=dict)
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class ProductBlueprintListResponse(BaseModel):
    blueprints: List[ProductBlueprintResponse]
    total: int


class CreateProductBlueprintRequest(BaseModel):
    opportunity_id: Optional[int] = None
    name: str
    tagline: Optional[str] = ""
    architecture_summary: Optional[str] = ""
    tech_stack: Optional[Dict[str, Any]] = None
    mvp_roadmap: Optional[List[str]] = None


class FounderProfileResponse(BaseModel):
    id: int
    name: str
    title: str
    bio: str
    target_domains: List[str] = Field(default_factory=list)
    primary_goals: List[str] = Field(default_factory=list)
    weekly_hours: int = 20
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class UpdateFounderProfileRequest(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    bio: Optional[str] = None
    target_domains: Optional[List[str]] = None
    primary_goals: Optional[List[str]] = None
    weekly_hours: Optional[int] = None


class SkillAssessmentResponse(BaseModel):
    id: int
    category: str
    skill_name: str
    proficiency_level: int
    target_level: int
    notes: str = ""
    actionable_recommendations: List[str] = Field(default_factory=list)
    last_assessed_at: Optional[str] = None


class SkillAssessmentListResponse(BaseModel):
    skills: List[SkillAssessmentResponse]
    total: int


class UpdateSkillRequest(BaseModel):
    proficiency_level: Optional[int] = None
    target_level: Optional[int] = None
    notes: Optional[str] = None


# ---- Idea Vault & Global Problems ------------------------------------

class IdeaVaultItemResponse(BaseModel):
    id: int
    title: str
    problem_statement: str = ""
    proposed_solution: str = ""
    target_audience: str = ""
    monetization_hypothesis: str = ""
    status: str = "draft"
    validation_score: float = 0.0
    validation_feedback: Dict[str, Any] = Field(default_factory=dict)
    tags: List[str] = Field(default_factory=list)
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class IdeaVaultItemListResponse(BaseModel):
    ideas: List[IdeaVaultItemResponse]
    total: int


class CreateIdeaRequest(BaseModel):
    title: str = Field(..., min_length=3, description="Idea title")
    problem_statement: Optional[str] = ""
    proposed_solution: Optional[str] = ""
    target_audience: Optional[str] = ""
    monetization_hypothesis: Optional[str] = ""
    tags: Optional[List[str]] = Field(default_factory=list)


class UpdateIdeaRequest(BaseModel):
    title: Optional[str] = None
    problem_statement: Optional[str] = None
    proposed_solution: Optional[str] = None
    target_audience: Optional[str] = None
    monetization_hypothesis: Optional[str] = None
    status: Optional[str] = None
    tags: Optional[List[str]] = None


class GlobalProblemResponse(BaseModel):
    id: int
    title: str
    description: str = ""
    category: str = "General"
    source: str = "Reddit"
    source_url: str = ""
    severity_score: float = 5.0
    frequency_score: float = 5.0
    commercial_viability: float = 5.0
    composite_pain_score: float = 50.0
    sentiment_quotes: List[str] = Field(default_factory=list)
    suggested_tech_stack: List[str] = Field(default_factory=list)
    matched_ideas_count: int = 0
    status: str = "active"
    discovered_at: Optional[str] = None


class GlobalProblemListResponse(BaseModel):
    problems: List[GlobalProblemResponse]
    total: int


class CreateProblemRequest(BaseModel):
    title: str = Field(..., min_length=5)
    description: Optional[str] = ""
    category: Optional[str] = "General"
    source: Optional[str] = "Manual"
    source_url: Optional[str] = ""
    severity_score: Optional[float] = 6.0
    frequency_score: Optional[float] = 6.0
    commercial_viability: Optional[float] = 6.0
    sentiment_quotes: Optional[List[str]] = Field(default_factory=list)


class UpdateProblemRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None
    severity_score: Optional[float] = None
    frequency_score: Optional[float] = None
    commercial_viability: Optional[float] = None



# ============================================================================
# Content Validation Schemas (Create / Update requests with Pydantic validation)
# ============================================================================

class TechResourceCreate(BaseModel):
    resource_id: str = Field(..., min_length=1, max_length=100, description="Unique resource identifier")
    resource_type: str = Field(..., pattern=r"^(model|dataset|benchmark)$", description="Type: model, dataset, or benchmark")
    name: str = Field(..., min_length=1, max_length=200, description="Resource name")
    org: str = Field(default="", max_length=200, description="Organization / vendor")
    context: str = Field(default="", max_length=200, description="Context / token window")
    strengths: str = Field(default="", description="Key strengths")
    suitability: str = Field(default="", description="Best use / deployment suitability")
    benchmark: str = Field(default="", max_length=200, description="Benchmark scores")
    size: str = Field(default="", max_length=200, description="Dataset size")
    desc: str = Field(default="", description="Description")
    url: str = Field(default="", max_length=500, description="Documentation / weights URL")
    is_active: bool = Field(default=True)


class TechResourceUpdate(BaseModel):
    resource_type: Optional[str] = Field(None, pattern=r"^(model|dataset|benchmark)$")
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    org: Optional[str] = Field(None, max_length=200)
    context: Optional[str] = Field(None, max_length=200)
    strengths: Optional[str] = None
    suitability: Optional[str] = None
    benchmark: Optional[str] = Field(None, max_length=200)
    size: Optional[str] = Field(None, max_length=200)
    desc: Optional[str] = None
    url: Optional[str] = Field(None, max_length=500)
    is_active: Optional[bool] = None


class TrendingItemCreate(BaseModel):
    item_id: str = Field(..., min_length=1, max_length=100, description="Unique item identifier")
    item_type: str = Field(..., pattern=r"^(repo|topic)$", description="Type: repo or topic")
    name: str = Field(..., min_length=1, max_length=200, description="Item name")
    stars: str = Field(default="", max_length=50, description="Star count")
    forks: str = Field(default="", max_length=50, description="Fork count")
    growth: str = Field(default="", max_length=100, description="Growth rate")
    category: str = Field(default="", max_length=100, description="Category")
    desc: str = Field(default="", description="Description")
    count: str = Field(default="", max_length=100, description="Item count")
    url: str = Field(default="", max_length=500, description="URL")
    is_active: bool = Field(default=True)


class TrendingItemUpdate(BaseModel):
    item_type: Optional[str] = Field(None, pattern=r"^(repo|topic)$")
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    stars: Optional[str] = Field(None, max_length=50)
    forks: Optional[str] = Field(None, max_length=50)
    growth: Optional[str] = Field(None, max_length=100)
    category: Optional[str] = Field(None, max_length=100)
    desc: Optional[str] = None
    count: Optional[str] = Field(None, max_length=100)
    url: Optional[str] = Field(None, max_length=500)
    is_active: Optional[bool] = None


class DashboardMetricCreate(BaseModel):
    metric_name: str = Field(..., min_length=1, max_length=100, description="Unique metric name")
    metric_type: str = Field(..., pattern=r"^(sparkline|line|donut|kpi)$", description="Metric type")
    label: str = Field(default="", max_length=200, description="Display label")
    value: int = Field(default=0, ge=0, description="Numeric value")
    color: str = Field(default="#6366f1", max_length=20, description="Hex color")
    is_active: bool = Field(default=True)


class DashboardMetricUpdate(BaseModel):
    metric_type: Optional[str] = Field(None, pattern=r"^(sparkline|line|donut|kpi)$")
    label: Optional[str] = Field(None, max_length=200)
    value: Optional[int] = Field(None, ge=0)
    color: Optional[str] = Field(None, max_length=20)
    is_active: Optional[bool] = None


class SystemConfigCreate(BaseModel):
    config_key: str = Field(..., min_length=1, max_length=100, description="Unique config key")
    config_value: str = Field(default="", description="Config value")
    config_type: str = Field(default="string", max_length=50, description="Value type")
    description: str = Field(default="", description="Human-readable description")
    is_active: bool = Field(default=True)


class SystemConfigUpdate(BaseModel):
    config_value: Optional[str] = None
    config_type: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None
    is_active: Optional[bool] = None


class FrameworkCreate(BaseModel):
    framework_id: str = Field(..., min_length=1, max_length=100, description="Unique framework identifier")
    category: str = Field(..., min_length=1, max_length=100, description="Category")
    name: str = Field(..., min_length=1, max_length=200, description="Framework name")
    framework: str = Field(default="", max_length=200, description="Underlying framework")
    runtime: str = Field(default="", max_length=200, description="Runtime")
    maturity: str = Field(default="", max_length=100, description="Maturity level")
    maturity_color: str = Field(default="#6366f1", max_length=20, description="Hex color")
    tagline: str = Field(default="", description="Tagline")
    key_features: List[str] = Field(default_factory=list, description="Key features")
    best_for: str = Field(default="", description="Best fit use case")
    docs_url: str = Field(default="", max_length=500, description="Documentation URL")
    is_active: bool = Field(default=True)


class FrameworkUpdate(BaseModel):
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    framework: Optional[str] = Field(None, max_length=200)
    runtime: Optional[str] = Field(None, max_length=200)
    maturity: Optional[str] = Field(None, max_length=100)
    maturity_color: Optional[str] = Field(None, max_length=20)
    tagline: Optional[str] = None
    key_features: Optional[List[str]] = None
    best_for: Optional[str] = None
    docs_url: Optional[str] = Field(None, max_length=500)
    is_active: Optional[bool] = None

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

    "FrameworkItem",

    "FrameworksResponse",

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

    "StartupOpportunityResponse",

    "StartupOpportunityListResponse",

    "UpdateOpportunityStatusRequest",

    "WeeklyBriefingResponse",

    "WeeklyBriefingListResponse",

    "ProductBlueprintResponse",

    "ProductBlueprintListResponse",

    "CreateProductBlueprintRequest",

    "FounderProfileResponse",

    "UpdateFounderProfileRequest",

    "SkillAssessmentResponse",

    "SkillAssessmentListResponse",

    "UpdateSkillRequest",

    "IdeaVaultItemResponse",

    "IdeaVaultItemListResponse",

    "CreateIdeaRequest",

    "UpdateIdeaRequest",

    "GlobalProblemResponse",

    "GlobalProblemListResponse",

    "CreateProblemRequest",

    "UpdateProblemRequest",

    "TechResourceItem",

    "TechResourceListResponse",

    "TrendingItemResponse",

    "TrendingItemListResponse",

    "DashboardMetricItem",

    "DashboardMetricListResponse",

    "ProblemCategoriesResponse",

    "ProblemSourcesResponse",

    "TechResourceCreate",

    "TechResourceUpdate",

    "TrendingItemCreate",

    "TrendingItemUpdate",

    "DashboardMetricCreate",

    "DashboardMetricUpdate",

    "SystemConfigCreate",

    "SystemConfigUpdate",

    "FrameworkCreate",

    "FrameworkUpdate",

]
