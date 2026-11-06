"""Phase 6.1 — FastAPI API routes.

Exposes the research agent, workflows, orchestrator, knowledge base,
and evaluation as REST endpoints.
"""

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
    DocumentsResponse,
    DocumentSummary,
    EvaluationResponse,
    HealthResponse,
    KbSearchRequest,
    KbSearchResponse,
    KbStatsResponse,
    KbSearchResult,
    OrchestrateRunRequest,
    OrchestrateRunResponse,
    WorkflowRunRequest,
    WorkflowRunResponse,
)
from app.config import settings
from app.database.db import SessionLocal
from app.knowledge_base.refresh import KnowledgeRefresher
from app.knowledge_base.storage import KnowledgeBaseStore
from app.monitoring import Evaluator, TestCase
from app.llm.ollama_client import OllamaClient

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


__all__ = ["router"]
