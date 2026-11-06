"""Phase 6.1 — FastAPI API routes.

Exposes the research agent, workflows, orchestrator, knowledge base,
and evaluation as REST endpoints.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException

from app.agent.agent import AutonomousAgent
from app.agent.orchestration import Orchestrator
from app.agent.workflows import (
    FrameworkComparisonWorkflow,
    TechnologyDiscoveryWorkflow,
)
from app.api.schemas import (
    AgentRunRequest,
    AgentRunResponse,
    AutonomousStartResponse,
    AutonomousStatusResponse,
    CyclesResponse,
    CycleResponse,
    DiscoveriesResponse,
    DiscoveryItemResponse,
    DocumentsResponse,
    DocumentSummary,
    EvaluationResponse,
    HealthResponse,
    JobResponse,
    KbSearchRequest,
    KbSearchResponse,
    KbStatsResponse,
    KbSearchResult,
    OrchestrateRunRequest,
    OrchestrateRunResponse,
    ProcessJobResponse,
    RecommendationsResponse,
    RecommendationItemResponse,
    WorkflowRunRequest,
    WorkflowRunResponse,
    FrameworkItem,
    FrameworksResponse,
    StartupOpportunityResponse,
    StartupOpportunityListResponse,
    UpdateOpportunityStatusRequest,
    WeeklyBriefingResponse,
    WeeklyBriefingListResponse,
    ProductBlueprintResponse,
    ProductBlueprintListResponse,
    CreateProductBlueprintRequest,
    FounderProfileResponse,
    UpdateFounderProfileRequest,
    SkillAssessmentResponse,
    SkillAssessmentListResponse,
    UpdateSkillRequest,
)
from app.config import settings
from app.database.db import SessionLocal
from app.database.models import (
    StartupOpportunity,
    WeeklyBriefing,
    ProductBlueprint,
    FounderProfile,
    SkillAssessment,
)
from app.services.startup_intelligence import StartupIntelligenceService
from app.data.tech_frameworks import list_categories, list_frameworks
from app.knowledge_base.refresh import KnowledgeRefresher
from app.knowledge_base.storage import KnowledgeBaseStore
from app.monitoring import Evaluator, TestCase
from app.llm.ollama_client import OllamaClient
from app.autonomous.job_queue import JobQueue
from app.autonomous.scheduler import AutonomousScheduler
from app.autonomous.worker import JobWorker
from app.autonomous.discovery_manager import DiscoveryManager
from app.autonomous.recommendation import RecommendationEngine
from app.autonomous.coordinator import DiscoveryCoordinator

# Module-level singleton scheduler (started via /autonomous/start)

_scheduler: Optional[AutonomousScheduler] = None


def _get_scheduler() -> AutonomousScheduler:

    global _scheduler

    if _scheduler is None:

        _scheduler = AutonomousScheduler()

    return _scheduler


def _get_worker() -> JobWorker:

    return JobWorker()

router = APIRouter()

WORKFLOW_MAP = {
    "technology_discovery": TechnologyDiscoveryWorkflow,
    "framework_comparison": FrameworkComparisonWorkflow,
}


# ---- Health ----------------------------------------------------------

@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:

    client = OllamaClient(model=settings.OLLAMA_MODEL)

    return HealthResponse(

        status="ok",

        ollama_available=client.is_available(),

        ollama_model=settings.OLLAMA_MODEL,

        ollama_base_url=settings.OLLAMA_BASE_URL,

    )


# ---- Frameworks --------------------------------------------------------

@router.get("/frameworks", response_model=FrameworksResponse)
def list_tech_frameworks() -> FrameworksResponse:

    frameworks = list_frameworks()

    return FrameworksResponse(

        frameworks=[FrameworkItem(**f) for f in frameworks],

        categories=list_categories(),

        count=len(frameworks),

    )


# ---- Agent -----------------------------------------------------------

@router.post("/agent/run", response_model=AgentRunResponse)
def run_agent(request: AgentRunRequest) -> AgentRunResponse:

    agent = AutonomousAgent()

    result = agent.run(objective=request.objective)

    sources = list(result.sources or [])

    return AgentRunResponse(

        objective=result.objective,

        status=result.status.value,

        total_steps=result.total_steps,

        sources=len(sources),

        final_answer=result.final_answer or "",

        completed_at=result.completed_at,

    )


# ---- Workflow --------------------------------------------------------

@router.post("/workflow/run", response_model=WorkflowRunResponse)
def run_workflow(request: WorkflowRunRequest) -> WorkflowRunResponse:

    workflow_cls = WORKFLOW_MAP.get(request.workflow_type)

    if not workflow_cls:

        raise HTTPException(

            status_code=400,

            detail=f"Unknown workflow type: {request.workflow_type}",

        )

    context: Dict[str, Any] = {}

    if request.criteria:

        context["criteria"] = request.criteria

    agent = AutonomousAgent()

    workflow = workflow_cls(agent=agent)

    result = workflow.run(objective=request.objective, context=context)

    return WorkflowRunResponse(

        objective=result.objective,

        workflow_type=result.workflow_type,

        steps_completed=len(result.steps),

        sources=len(result.sources or []),

        final_answer=result.final_answer or "",

        created_at=result.created_at,

    )


# ---- Orchestration ---------------------------------------------------

@router.post("/orchestrate/run", response_model=OrchestrateRunResponse)
def run_orchestrate(request: OrchestrateRunRequest) -> OrchestrateRunResponse:

    specialist_types: Optional[List[str]] = None

    if request.specialists:

        specialist_types = [

            s.strip() for s in request.specialists.split(",") if s.strip()

        ]

    orchestrator = Orchestrator()

    result = orchestrator.run(

        objective=request.objective,

        specialist_types=specialist_types,

        parallel=request.parallel,

    )

    return OrchestrateRunResponse(

        objective=result.objective,

        specialists=len(result.specialist_results),

        total_tasks=result.total_tasks,

        completed_tasks=result.completed_tasks,

        failed_tasks=result.failed_tasks,

        duration_seconds=result.duration_seconds,

        sources=len(result.all_sources or []),

        final_answer=result.final_answer,

        created_at=result.created_at,

    )


# ---- Knowledge Base --------------------------------------------------

@router.post("/kb/search", response_model=KbSearchResponse)
def kb_search(request: KbSearchRequest) -> KbSearchResponse:

    from app.knowledge_base.embeddings import OllamaEmbeddingProvider
    from app.knowledge_base.retrieval import HybridRetriever
    from app.knowledge_base.reranker import CrossEncoderReranker

    store = KnowledgeBaseStore()

    try:

        embedder = OllamaEmbeddingProvider()

        query_embedding = embedder.embed(request.query)

        retriever = HybridRetriever(store)

        results = retriever.retrieve(

            query=request.query,

            query_embedding=query_embedding,

            top_k=request.top_k,

            category=request.category,

        )

        reranker = CrossEncoderReranker()

        results = reranker.rerank(request.query, results, top_k=request.top_k)

        search_results = [

            KbSearchResult(

                chunk_id=r.get("chunk_id", 0),

                document_id=r.get("document_id", 0),

                chunk_index=r.get("chunk_index", 0),

                content=r.get("content", ""),

                title=r.get("title", "Unknown"),

                source_url=r.get("source_url"),

                category=r.get("category"),

                run_type=r.get("run_type"),

                rrf_score=r.get("rrf_score"),

                bm25_score=r.get("bm25_score"),

                vector_similarity=r.get("vector_similarity"),

            )

            for r in results

        ]

        return KbSearchResponse(

            query=request.query,

            results=search_results,

            count=len(search_results),

        )

    finally:

        store.close()


@router.get("/kb/stats", response_model=KbStatsResponse)
def kb_stats() -> KbStatsResponse:

    store = KnowledgeBaseStore()

    try:

        refresher = KnowledgeRefresher(store)

        summary = refresher.summary()

        return KbStatsResponse(

            total_documents=summary["total_documents"],

            total_chunks=summary["total_chunks"],

            embedded_chunks=summary["embedded_chunks"],

            embedding_coverage=summary["embedding_coverage"],

            stale_documents=summary["stale_document_count"],

        )

    finally:

        store.close()


@router.get("/kb/documents", response_model=DocumentsResponse)
def kb_documents(limit: int = 50) -> DocumentsResponse:

    store = KnowledgeBaseStore()

    try:

        docs = store.list_documents(limit=limit)

        return DocumentsResponse(

            documents=[

                DocumentSummary(

                    id=d.id,

                    title=d.title,

                    category=d.category,

                    run_type=d.run_type,

                    created_at=d.created_at.isoformat() if d.created_at else None,

                    source_url=d.source_url,

                )

                for d in docs

            ],

            count=len(docs),

        )

    finally:

        store.close()


# ---- Evaluation ------------------------------------------------------

@router.post("/evaluate/run", response_model=EvaluationResponse)
def run_evaluate() -> EvaluationResponse:

    evaluator = Evaluator(agent=AutonomousAgent())

    cases = [

        TestCase(

            name="latest_ai_llm_discoveries",

            objective="Find the latest AI and LLM-related research items in my database. Summarize the five most relevant discoveries.",

            mode="agent",

            expected_min_sources=1,

        ),

        TestCase(

            name="agentic_ai_vs_ai_llm_comparison",

            objective="Compare the research available in Agentic AI and AI/LLM categories. Identify three common technologies and three differences.",

            mode="workflow",

            workflow_type="framework_comparison",

            criteria="architecture, tool-calling capabilities, memory support, deployment suitability",

            expected_min_sources=1,

        ),

        TestCase(

            name="local_ai_agent_frameworks",

            objective="Research local AI agent frameworks from my database. Compare their architecture, tool-calling capabilities, memory support, and suitability for Ollama deployment.",

            mode="workflow",

            workflow_type="technology_discovery",

            expected_min_sources=1,

        ),

    ]

    results = evaluator.run_suite(cases)

    report = evaluator.report(results)

    # parse report into structured results

    eval_results: List[Dict[str, Any]] = []

    total = 0

    passed = 0

    scores: List[float] = []

    for line in report.splitlines():

        if line.startswith("[PASS]") or line.startswith("[FAIL]"):

            total += 1

            status = "PASS" if line.startswith("[PASS]") else "FAIL"

            if status == "PASS":

                passed += 1

            # extract test name and score

            parts = line.strip("[]").split("] ", 1)

            test_name = parts[1] if len(parts) > 1 else line

            score = 0.0

            if "(score:" in test_name:

                name_part, score_part = test_name.rsplit("(score:", 1)

                try:

                    score = float(score_part.rstrip(")"))

                except ValueError:

                    score = 0.0

                test_name = name_part.strip()

            scores.append(score)

            eval_results.append(

                {"test": test_name, "status": status, "score": score}

            )

        elif line.startswith("    ") and ": " in line:

            # check detail line - attach to last result

            check, ok = line.strip().split(": ", 1)

            if eval_results:

                eval_results[-1].setdefault("checks", []).append(

                    {"check": check, "ok": ok == "ok"}

                )

    average_score = round(sum(scores) / len(scores), 2) if scores else 0.0

    return EvaluationResponse(

        total_tests=total,

        passed=passed,

        failed=total - passed,

        average_score=average_score,

        results=eval_results,

    )


# ---- Autonomous ------------------------------------------------------

@router.post("/autonomous/start", response_model=AutonomousStartResponse)
def autonomous_start() -> AutonomousStartResponse:

    scheduler = _get_scheduler()

    if scheduler.is_running():

        return AutonomousStartResponse(

            started=False,

            interval_seconds=scheduler.interval_seconds,

        )

    scheduler.start()

    return AutonomousStartResponse(

        started=True,

        interval_seconds=scheduler.interval_seconds,

    )


@router.post("/autonomous/stop", response_model=AutonomousStartResponse)
def autonomous_stop() -> AutonomousStartResponse:

    scheduler = _get_scheduler()

    was_running = scheduler.is_running()

    scheduler.stop()

    return AutonomousStartResponse(

        started=was_running,

        interval_seconds=scheduler.interval_seconds,

    )


@router.get("/autonomous/status", response_model=AutonomousStatusResponse)
def autonomous_status() -> AutonomousStatusResponse:

    scheduler = _get_scheduler()

    jq = JobQueue()

    return AutonomousStatusResponse(

        running=scheduler.is_running(),

        interval_seconds=scheduler.interval_seconds,

        job_counts=jq.count_by_status(),

    )


@router.get("/autonomous/jobs", response_model=List[JobResponse])
def autonomous_jobs(

    status: Optional[str] = None,

    worker_type: Optional[str] = None,

    limit: int = 50,

) -> List[JobResponse]:

    jq = JobQueue()

    jobs = jq.list_jobs(status=status, worker_type=worker_type, limit=limit)

    return [JobResponse(**j) for j in jobs]


@router.post("/autonomous/process", response_model=ProcessJobResponse)
def autonomous_process() -> ProcessJobResponse:

    worker = _get_worker()

    processed = worker.process_next()

    job = None

    if processed:

        recent = worker.job_queue.list_jobs(limit=1)

        if recent:

            job = JobResponse(**recent[0])

    return ProcessJobResponse(processed=processed, job=job)


@router.get("/autonomous/discoveries", response_model=DiscoveriesResponse)
def autonomous_discoveries(

    limit: int = 20,

    min_score: float = 0.0,

) -> DiscoveriesResponse:

    dm = DiscoveryManager()

    items = dm.get_top_items(limit=limit, min_score=min_score)

    return DiscoveriesResponse(

        items=[DiscoveryItemResponse(**i) for i in items],

        count=len(items),

    )


@router.get("/autonomous/recommendations", response_model=RecommendationsResponse)
def autonomous_recommendations(

    level: Optional[str] = None,

    limit: int = 50,

) -> RecommendationsResponse:

    engine = RecommendationEngine()

    items = engine.get_recommendations(level=level, limit=limit)

    return RecommendationsResponse(

        items=[RecommendationItemResponse(**i) for i in items],

        count=len(items),

    )


@router.get("/autonomous/cycles", response_model=CyclesResponse)
def autonomous_cycles(limit: int = 20) -> CyclesResponse:

    coordinator = DiscoveryCoordinator(JobQueue())

    cycles = coordinator.get_cycle_history(limit=limit)

    return CyclesResponse(
        cycles=[CycleResponse(**c) for c in cycles],
        count=len(cycles),
    )


# ======================================================================
# Phase 7 & 8: Founder OS — Startup Intelligence & Growth Endpoints
# ======================================================================

def _opp_to_response(opp: StartupOpportunity) -> StartupOpportunityResponse:
    return StartupOpportunityResponse(
        id=opp.id,
        research_item_id=opp.research_item_id,
        title=opp.title,
        tagline=opp.tagline or "",
        problem_statement=opp.problem_statement,
        proposed_solution=opp.proposed_solution,
        target_audience=opp.target_audience or "",
        business_model=opp.business_model or "B2B SaaS",
        technical_feasibility=opp.technical_feasibility,
        market_opportunity=opp.market_opportunity,
        cost_feasibility=opp.cost_feasibility,
        differentiation=opp.differentiation,
        overall_score=opp.overall_score,
        technologies=opp.technologies or [],
        competitors=opp.competitors or [],
        mvp_features=opp.mvp_features or [],
        status=opp.status,
        notes=opp.notes,
        metadata_json=opp.metadata_json or {},
        created_at=opp.created_at.isoformat() if opp.created_at else None,
        updated_at=opp.updated_at.isoformat() if opp.updated_at else None,
    )


def _briefing_to_response(b: WeeklyBriefing) -> WeeklyBriefingResponse:
    return WeeklyBriefingResponse(
        id=b.id,
        week_identifier=b.week_identifier,
        title=b.title,
        summary=b.summary,
        top_technologies=b.top_technologies or [],
        top_opportunities=b.top_opportunities or [],
        recommended_mvp=b.recommended_mvp or {},
        skill_focus=b.skill_focus or {},
        generated_at=b.generated_at.isoformat() if b.generated_at else None,
        is_read=b.is_read,
        metadata_json=b.metadata_json or {},
    )


def _blueprint_to_response(bp: ProductBlueprint) -> ProductBlueprintResponse:
    return ProductBlueprintResponse(
        id=bp.id,
        opportunity_id=bp.opportunity_id,
        name=bp.name,
        tagline=bp.tagline or "",
        architecture_summary=bp.architecture_summary or "",
        tech_stack=bp.tech_stack or {},
        system_components=bp.system_components or [],
        api_spec_outline=bp.api_spec_outline or [],
        mvp_roadmap=bp.mvp_roadmap or [],
        status=bp.status,
        metadata_json=bp.metadata_json or {},
        created_at=bp.created_at.isoformat() if bp.created_at else None,
        updated_at=bp.updated_at.isoformat() if bp.updated_at else None,
    )


# ---- Startup Opportunities -------------------------------------------

@router.get("/startup/opportunities", response_model=StartupOpportunityListResponse)
def get_startup_opportunities(
    status: Optional[str] = None,
    min_score: int = 0,
    limit: int = 50,
) -> StartupOpportunityListResponse:
    with SessionLocal() as db:
        query = db.query(StartupOpportunity)
        if status:
            query = query.filter(StartupOpportunity.status == status)
        if min_score > 0:
            query = query.filter(StartupOpportunity.overall_score >= min_score)
        
        opps = query.order_by(StartupOpportunity.overall_score.desc()).limit(limit).all()
        return StartupOpportunityListResponse(
            items=[_opp_to_response(o) for o in opps],
            total=len(opps),
        )


@router.post("/startup/opportunities/scan", response_model=StartupOpportunityListResponse)
def scan_startup_opportunities(
    limit: int = 10,
    min_score: int = 65,
) -> StartupOpportunityListResponse:
    with SessionLocal() as db:
        service = StartupIntelligenceService()
        opps = service.scan_research_for_opportunities(db, limit=limit, min_score=min_score)
        return StartupOpportunityListResponse(
            items=[_opp_to_response(o) for o in opps],
            total=len(opps),
        )


@router.get("/startup/opportunities/{opp_id}", response_model=StartupOpportunityResponse)
def get_startup_opportunity(opp_id: int) -> StartupOpportunityResponse:
    with SessionLocal() as db:
        opp = db.query(StartupOpportunity).filter(StartupOpportunity.id == opp_id).first()
        if not opp:
            raise HTTPException(status_code=404, detail="Startup opportunity not found")
        return _opp_to_response(opp)


@router.patch("/startup/opportunities/{opp_id}/status", response_model=StartupOpportunityResponse)
def update_startup_opportunity_status(
    opp_id: int,
    req: UpdateOpportunityStatusRequest,
) -> StartupOpportunityResponse:
    with SessionLocal() as db:
        opp = db.query(StartupOpportunity).filter(StartupOpportunity.id == opp_id).first()
        if not opp:
            raise HTTPException(status_code=404, detail="Startup opportunity not found")
        opp.status = req.status
        if req.notes is not None:
            opp.notes = req.notes
        db.commit()
        db.refresh(opp)
        return _opp_to_response(opp)


# ---- Weekly Briefings ------------------------------------------------

@router.get("/startup/briefings", response_model=WeeklyBriefingListResponse)
def get_weekly_briefings(limit: int = 10) -> WeeklyBriefingListResponse:
    with SessionLocal() as db:
        briefings = (
            db.query(WeeklyBriefing)
            .order_by(WeeklyBriefing.generated_at.desc())
            .limit(limit)
            .all()
        )
        return WeeklyBriefingListResponse(
            briefings=[_briefing_to_response(b) for b in briefings],
            total=len(briefings),
        )


@router.get("/startup/briefings/latest", response_model=Optional[WeeklyBriefingResponse])
def get_latest_weekly_briefing() -> Optional[WeeklyBriefingResponse]:
    with SessionLocal() as db:
        briefing = (
            db.query(WeeklyBriefing)
            .order_by(WeeklyBriefing.generated_at.desc())
            .first()
        )
        if not briefing:
            # Generate automatically if none exists yet
            service = StartupIntelligenceService()
            service.seed_initial_founder_data(db)
            briefing = service.generate_weekly_briefing(db)
        return _briefing_to_response(briefing)


@router.post("/startup/briefings/generate", response_model=WeeklyBriefingResponse)
def generate_weekly_briefing(force_new: bool = True) -> WeeklyBriefingResponse:
    with SessionLocal() as db:
        service = StartupIntelligenceService()
        service.seed_initial_founder_data(db)
        briefing = service.generate_weekly_briefing(db, force_new=force_new)
        return _briefing_to_response(briefing)


# ---- Product Blueprints ---------------------------------------------

@router.get("/product/blueprints", response_model=ProductBlueprintListResponse)
def get_product_blueprints(limit: int = 20) -> ProductBlueprintListResponse:
    with SessionLocal() as db:
        blueprints = (
            db.query(ProductBlueprint)
            .order_by(ProductBlueprint.created_at.desc())
            .limit(limit)
            .all()
        )
        return ProductBlueprintListResponse(
            blueprints=[_blueprint_to_response(bp) for bp in blueprints],
            total=len(blueprints),
        )


@router.post("/product/blueprints", response_model=ProductBlueprintResponse)
def create_product_blueprint(req: CreateProductBlueprintRequest) -> ProductBlueprintResponse:
    with SessionLocal() as db:
        bp = ProductBlueprint(
            opportunity_id=req.opportunity_id,
            name=req.name,
            tagline=req.tagline or "",
            architecture_summary=req.architecture_summary or "",
            tech_stack=req.tech_stack or {
                "frontend": "React + Vite",
                "backend": "FastAPI",
                "database": "PostgreSQL",
                "ai": "Ollama / local LLM",
            },
            mvp_roadmap=req.mvp_roadmap or [
                "1. Database schema and core data pipeline",
                "2. REST API endpoints and validation",
                "3. Frontend UI interactive prototype",
                "4. Evaluation test suite and deployment",
            ],
            status="draft",
        )
        db.add(bp)
        db.commit()
        db.refresh(bp)
        return _blueprint_to_response(bp)


@router.get("/product/blueprints/{blueprint_id}", response_model=ProductBlueprintResponse)
def get_product_blueprint(blueprint_id: int) -> ProductBlueprintResponse:
    with SessionLocal() as db:
        bp = db.query(ProductBlueprint).filter(ProductBlueprint.id == blueprint_id).first()
        if not bp:
            raise HTTPException(status_code=404, detail="Product blueprint not found")
        return _blueprint_to_response(bp)


# ---- Founder Profile & Growth Intelligence --------------------------

@router.get("/growth/profile", response_model=FounderProfileResponse)
def get_founder_profile() -> FounderProfileResponse:
    with SessionLocal() as db:
        service = StartupIntelligenceService()
        service.seed_initial_founder_data(db)
        profile = db.query(FounderProfile).first()
        return FounderProfileResponse(
            id=profile.id,
            name=profile.name,
            title=profile.title,
            bio=profile.bio,
            target_domains=profile.target_domains or [],
            primary_goals=profile.primary_goals or [],
            weekly_hours=profile.weekly_hours,
            created_at=profile.created_at.isoformat() if profile.created_at else None,
            updated_at=profile.updated_at.isoformat() if profile.updated_at else None,
        )


@router.put("/growth/profile", response_model=FounderProfileResponse)
def update_founder_profile(req: UpdateFounderProfileRequest) -> FounderProfileResponse:
    with SessionLocal() as db:
        profile = db.query(FounderProfile).first()
        if not profile:
            profile = FounderProfile()
            db.add(profile)
        
        if req.name is not None:
            profile.name = req.name
        if req.title is not None:
            profile.title = req.title
        if req.bio is not None:
            profile.bio = req.bio
        if req.target_domains is not None:
            profile.target_domains = req.target_domains
        if req.primary_goals is not None:
            profile.primary_goals = req.primary_goals
        if req.weekly_hours is not None:
            profile.weekly_hours = req.weekly_hours
        
        db.commit()
        db.refresh(profile)
        return FounderProfileResponse(
            id=profile.id,
            name=profile.name,
            title=profile.title,
            bio=profile.bio,
            target_domains=profile.target_domains or [],
            primary_goals=profile.primary_goals or [],
            weekly_hours=profile.weekly_hours,
            created_at=profile.created_at.isoformat() if profile.created_at else None,
            updated_at=profile.updated_at.isoformat() if profile.updated_at else None,
        )


@router.get("/growth/skills", response_model=SkillAssessmentListResponse)
def get_skill_matrix() -> SkillAssessmentListResponse:
    with SessionLocal() as db:
        service = StartupIntelligenceService()
        service.seed_initial_founder_data(db)
        skills = db.query(SkillAssessment).order_by(SkillAssessment.category, SkillAssessment.proficiency_level.desc()).all()
        return SkillAssessmentListResponse(
            skills=[
                SkillAssessmentResponse(
                    id=s.id,
                    category=s.category,
                    skill_name=s.skill_name,
                    proficiency_level=s.proficiency_level,
                    target_level=s.target_level,
                    notes=s.notes or "",
                    actionable_recommendations=s.actionable_recommendations or [],
                    last_assessed_at=s.last_assessed_at.isoformat() if s.last_assessed_at else None,
                )
                for s in skills
            ],
            total=len(skills),
        )


@router.patch("/growth/skills/{skill_id}", response_model=SkillAssessmentResponse)
def update_skill_assessment(
    skill_id: int,
    req: UpdateSkillRequest,
) -> SkillAssessmentResponse:
    with SessionLocal() as db:
        skill = db.query(SkillAssessment).filter(SkillAssessment.id == skill_id).first()
        if not skill:
            raise HTTPException(status_code=404, detail="Skill assessment not found")
        
        if req.proficiency_level is not None:
            skill.proficiency_level = req.proficiency_level
        if req.target_level is not None:
            skill.target_level = req.target_level
        if req.notes is not None:
            skill.notes = req.notes
        
        db.commit()
        db.refresh(skill)
        return SkillAssessmentResponse(
            id=skill.id,
            category=skill.category,
            skill_name=skill.skill_name,
            proficiency_level=skill.proficiency_level,
            target_level=skill.target_level,
            notes=skill.notes or "",
            actionable_recommendations=skill.actionable_recommendations or [],
            last_assessed_at=skill.last_assessed_at.isoformat() if skill.last_assessed_at else None,
        )


__all__ = ["router"]

