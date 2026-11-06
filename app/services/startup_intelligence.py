"""Personal AI Founder & Growth OS — Startup Intelligence & Weekly Briefing Service.

Continuously converts technology research into actionable business opportunities,
computes 4-axis feasibility/market scores, and generates the Weekly "What Should I Build Next?" briefing.
"""

import json
import logging
import re
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional

from sqlalchemy import select, desc
from sqlalchemy.orm import Session

from app.database.models import (
    ResearchItem,
    StartupOpportunity,
    WeeklyBriefing,
    ProductBlueprint,
    FounderProfile,
    SkillAssessment,
)
from app.llm.ollama_client import OllamaClient
from app.config import settings

logger = logging.getLogger(__name__)


STARTUP_OPPORTUNITY_PROMPT = """You are an elite Startup Co-founder and Technology Strategist.
Analyze the following technology research discovery and extract a high-potential startup or commercial product opportunity.

RESEARCH ITEM:
Title: {title}
Category: {category}
Source: {source}
Description: {description}
AI Summary: {ai_summary}
Technologies: {technologies}
Key Topics: {key_topics}

Generate a commercially viable startup concept based on this technology.
Return ONLY a valid JSON object matching these exact fields (do not include markdown ticks or text outside the JSON):
{{
  "title": "Clear commercial product or startup name",
  "tagline": "Punchy 1-sentence value proposition",
  "problem_statement": "Specific real-world business or consumer problem worth solving",
  "proposed_solution": "How this technology solves the problem as a standalone product",
  "target_audience": "Specific ideal customer profile (e.g., Mid-market legal firms, Next.js developers, E-commerce Shopify stores)",
  "business_model": "Monetization strategy (e.g. B2B SaaS, Usage-based API, Open-core, Per-seat subscription)",
  "technical_feasibility": 85,
  "market_opportunity": 80,
  "cost_feasibility": 90,
  "differentiation": 75,
  "technologies": ["List", "of", "relevant", "tools"],
  "competitors": ["2-3 incumbent competitors or alternatives"],
  "mvp_features": ["3-4 core features essential for MVP"]
}}
Scores must be realistic integers between 1 and 100. Return valid JSON only."""


class StartupIntelligenceService:

    """Service to evaluate technology for startup potential and manage Founder OS workflows."""

    def __init__(self, model: Optional[str] = None):
        self.model = model or settings.OLLAMA_MODEL
        self.llm = OllamaClient(model=self.model)

    def scan_research_for_opportunities(
        self,
        db: Session,
        limit: int = 10,
        min_score: int = 65,
    ) -> List[StartupOpportunity]:
        """Scan recent high-value research items and generate StartupOpportunity records."""
        # Find research items that haven't been mapped to opportunities yet
        existing_research_ids = set(
            db.scalars(
                select(StartupOpportunity.research_item_id).where(
                    StartupOpportunity.research_item_id.is_not(None)
                )
            ).all()
        )

        query = (
            select(ResearchItem)
            .where(
                ResearchItem.processing_status == "completed",
                (ResearchItem.relevance_score >= min_score)
                | (ResearchItem.technical_value_score >= min_score),
            )
            .order_by(desc(ResearchItem.technical_value_score))
            .limit(limit * 2)
        )
        candidates = db.scalars(query).all()

        unprocessed = [
            item for item in candidates if item.id not in existing_research_ids
        ][:limit]

        if not unprocessed:
            logger.info("No new unmapped high-scoring research items found for startup analysis.")
            return []

        created_opportunities = []

        for item in unprocessed:
            opportunity = self._generate_opportunity_for_item(db, item)
            if opportunity:
                db.add(opportunity)
                created_opportunities.append(opportunity)

        if created_opportunities:
            db.commit()
            for opp in created_opportunities:
                db.refresh(opp)

        logger.info(f"Generated {len(created_opportunities)} new startup opportunities.")
        return created_opportunities

    def _generate_opportunity_for_item(
        self,
        db: Session,
        item: ResearchItem,
    ) -> Optional[StartupOpportunity]:
        """Generate a single StartupOpportunity using LLM or structured heuristics."""
        metadata = item.metadata_json or {}
        technologies = metadata.get("technologies", [])
        key_topics = metadata.get("key_topics", [])

        prompt = STARTUP_OPPORTUNITY_PROMPT.format(
            title=item.title,
            category=item.ai_category or item.category,
            source=item.source,
            description=(item.description or "")[:800],
            ai_summary=(item.ai_summary or item.description or "")[:600],
            technologies=", ".join(technologies) if technologies else "N/A",
            key_topics=", ".join(key_topics) if key_topics else "N/A",
        )

        data = None
        try:
            # Attempt LLM analysis
            data = self.llm.generate_json(prompt=prompt)
        except Exception as e:
            logger.warning(f"Ollama generation failed or timed out for item {item.id} ({e}); using smart heuristic generator.")
            data = self._heuristic_opportunity_generator(item)

        if not data or not isinstance(data, dict):
            return None

        tech_score = int(data.get("technical_feasibility", 75))
        mkt_score = int(data.get("market_opportunity", 75))
        cost_score = int(data.get("cost_feasibility", 80))
        diff_score = int(data.get("differentiation", 70))

        # Weighted score: 35% market + 30% tech + 20% diff + 15% cost
        overall = int(round(
            (0.35 * mkt_score) + (0.30 * tech_score) + (0.20 * diff_score) + (0.15 * cost_score)
        ))

        opp = StartupOpportunity(
            research_item_id=item.id,
            title=data.get("title", f"AI Application: {item.title[:60]}"),
            tagline=data.get("tagline", "Autonomous technology application for modern workflows"),
            problem_statement=data.get(
                "problem_statement",
                f"Modern teams struggle with operational complexity and fragmentation in {item.category}.",
            ),
            proposed_solution=data.get(
                "proposed_solution",
                f"A specialized autonomous platform leveraging {item.title} to streamline workflows.",
            ),
            target_audience=data.get("target_audience", "AI Engineers, Tech Startups, and Enterprises"),
            business_model=data.get("business_model", "B2B SaaS / Usage-based"),
            technical_feasibility=tech_score,
            market_opportunity=mkt_score,
            cost_feasibility=cost_score,
            differentiation=diff_score,
            overall_score=overall,
            technologies=data.get("technologies", technologies or [item.title]),
            competitors=data.get("competitors", []),
            mvp_features=data.get("mvp_features", ["Core workflow automation", "Dashboard interface", "REST API integration"]),
            status="discovered",
            metadata_json={"source_url": item.url, "source_name": item.source},
        )
        return opp

    def _heuristic_opportunity_generator(self, item: ResearchItem) -> Dict[str, Any]:
        """Generate structured startup opportunity from research metadata without external LLM."""
        title = item.title
        category = item.ai_category or item.category or "AI Software"
        tech_value = item.technical_value_score or 75
        rel_value = item.relevance_score or 75

        clean_name = re.sub(r"[^\w\s-]", "", title).strip()
        words = clean_name.split()[:4]
        subject = " ".join(words)

        return {
            "title": f"Autonomous {subject} Studio",
            "tagline": f"Production-grade {category.lower()} solution for automated engineering workflows",
            "problem_statement": f"Teams building {category} face high engineering overhead, manual tuning, and integration friction when deploying {title}.",
            "proposed_solution": f"A self-hosted, scalable developer platform that packages {title} into ready-to-use APIs, background agents, and analytics.",
            "target_audience": "Developer teams, AI practitioners, and mid-market SaaS companies",
            "business_model": "Usage-based Developer API & Enterprise Self-Hosted License",
            "technical_feasibility": min(95, max(60, tech_value + 5)),
            "market_opportunity": min(92, max(65, rel_value)),
            "cost_feasibility": 85,
            "differentiation": 78,
            "technologies": [title, "FastAPI", "React", "Vector DB", "Docker"],
            "competitors": ["Legacy open-source scripts", "Cloud provider proprietary suites"],
            "mvp_features": [
                "Automated ingestion pipeline",
                "Real-time evaluation & telemetry",
                "Plug-and-play REST endpoints",
                "Custom domain configuration",
            ],
        }

    def generate_weekly_briefing(
        self,
        db: Session,
        force_new: bool = False,
    ) -> WeeklyBriefing:
        """Generate or retrieve the weekly 'What Should I Build Next?' opportunity briefing."""
        now = datetime.now(timezone.utc)
        week_id = now.strftime("%Y-W%W")

        if not force_new:
            existing = db.scalar(
                select(WeeklyBriefing)
                .where(WeeklyBriefing.week_identifier == week_id)
                .order_by(desc(WeeklyBriefing.generated_at))
            )
            if existing:
                return existing

        # Ensure we have active opportunities scanned
        opps = db.scalars(
            select(StartupOpportunity)
            .order_by(desc(StartupOpportunity.overall_score))
            .limit(10)
        ).all()

        if len(opps) < 3:
            # Trigger fresh scan from research items
            self.scan_research_for_opportunities(db, limit=8, min_score=60)
            opps = db.scalars(
                select(StartupOpportunity)
                .order_by(desc(StartupOpportunity.overall_score))
                .limit(10)
            ).all()

        # Gather top 3 technologies to explore
        top_tech_items = db.scalars(
            select(ResearchItem)
            .where(ResearchItem.processing_status == "completed")
            .order_by(desc(ResearchItem.technical_value_score), desc(ResearchItem.relevance_score))
            .limit(3)
        ).all()

        top_technologies = []
        for item in top_tech_items:
            meta = item.metadata_json or {}
            top_technologies.append({
                "name": item.title,
                "category": item.ai_category or item.category,
                "score": item.technical_value_score or 80,
                "why_it_matters": meta.get("why_it_matters") or item.ai_summary or item.description[:200],
                "url": item.url,
            })

        # Top 3 startup opportunities
        top_opportunities = []
        for opp in opps[:3]:
            top_opportunities.append({
                "id": opp.id,
                "title": opp.title,
                "tagline": opp.tagline,
                "problem": opp.problem_statement,
                "solution": opp.proposed_solution,
                "target_audience": opp.target_audience,
                "business_model": opp.business_model,
                "overall_score": opp.overall_score,
                "feasibility": {
                    "technical": opp.technical_feasibility,
                    "market": opp.market_opportunity,
                    "cost": opp.cost_feasibility,
                    "differentiation": opp.differentiation,
                },
                "technologies": opp.technologies,
            })

        # 1 Recommended MVP Blueprint
        lead_opp = opps[0] if opps else None
        if lead_opp:
            recommended_mvp = {
                "opportunity_id": lead_opp.id,
                "name": lead_opp.title,
                "tagline": lead_opp.tagline,
                "architecture_summary": (
                    f"A microservices-ready personal/commercial platform combining local inference "
                    f"with high-throughput async processing for {lead_opp.target_audience}."
                ),
                "tech_stack": {
                    "frontend": "React + Vite + Tailwind CSS",
                    "backend": "FastAPI (Python 3.11+) + Pydantic v2",
                    "ai_engine": "Ollama (qwen2.5:14b / llama3.1:8b) + LangChain / LiteLLM",
                    "database": "PostgreSQL / SQLite + pgvector / ChromaDB",
                    "infra": "Docker Compose + Caddy Reverse Proxy",
                },
                "mvp_epics": [
                    "Epic 1: Ingestion & Adapter Service for real-time data inputs",
                    "Epic 2: Core Analysis & Transformation Agent pipeline",
                    "Epic 3: Founder / User Management & Stripe Usage Metering",
                    "Epic 4: Webhook Dispatch & Embeddable React Widget",
                ],
                "time_to_mvp_weeks": 2,
            }
        else:
            recommended_mvp = {
                "name": "Autonomous AI Agent Workflow Platform",
                "tagline": "Turn local LLMs into coordinated background business automations",
                "architecture_summary": "FastAPI + React + SQLite queue orchestrating background task workers.",
                "tech_stack": {"backend": "FastAPI", "frontend": "React", "db": "SQLite"},
                "mvp_epics": ["Core Engine", "Queue Worker", "Dashboard"],
                "time_to_mvp_weeks": 2,
            }

        # 1 High-Leverage Skill Focus
        skill_focus = {
            "skill_name": "Multi-Agent Orchestration & Async Task Queues",
            "category": "Agentic AI & Distributed Systems",
            "current_proficiency": 72,
            "target_proficiency": 90,
            "why_critical": (
                "Essential for making the recommended MVP autonomous, resilient to timeouts, "
                "and capable of running persistent background tasks."
            ),
            "micro_learning_exercises": [
                "1. Implement a 3-agent pipeline with shared context and handoff state.",
                "2. Add backpressure handling and worker restart recovery with SQLite / Redis.",
                "3. Benchmark token consumption vs execution time with local Ollama models.",
            ],
            "estimated_hours": 4,
        }

        briefing = WeeklyBriefing(
            week_identifier=week_id,
            title=f"AI Founder Weekly Briefing — Week {now.strftime('%W')}, {now.year}",
            summary=(
                f"Strategic intelligence synthesis for week {now.strftime('%W')}. "
                f"Evaluated latest technical breakthroughs and identified {len(top_opportunities)} high-scoring "
                f"startup opportunities. Recommended MVP focus: {recommended_mvp['name']}."
            ),
            top_technologies=top_technologies,
            top_opportunities=top_opportunities,
            recommended_mvp=recommended_mvp,
            skill_focus=skill_focus,
            generated_at=now,
            is_read=False,
            metadata_json={"generated_by": "Personal AI Founder OS Coordinator"},
        )

        db.add(briefing)
        db.commit()
        db.refresh(briefing)
        logger.info(f"Generated new WeeklyBriefing #{briefing.id} for {week_id}.")
        return briefing

    def seed_initial_founder_data(self, db: Session) -> None:
        """Seed initial founder profile and skill matrix if database is empty."""
        profile = db.scalar(select(FounderProfile).limit(1))
        if not profile:
            profile = FounderProfile(
                name="Founder",
                title="AI Systems Architect & Technical Founder",
                bio="Building intelligent autonomous systems, micro-SaaS platforms, and full-stack AI applications.",
                target_domains=["Agentic AI", "Developer Tools", "B2B Automation", "Local LLM Systems"],
                primary_goals=[
                    "Launch 1 profitable autonomous micro-SaaS within 60 days",
                    "Master multi-agent orchestration and local hybrid RAG architectures",
                    "Maintain continuous discovery of high-velocity open-source tech",
                ],
                weekly_hours=25,
            )
            db.add(profile)

        existing_skills = db.scalars(select(SkillAssessment)).all()
        if not existing_skills:
            initial_skills = [
                SkillAssessment(
                    category="AI / LLM Engineering",
                    skill_name="Local LLM Inference & Optimization (Ollama/vLLM)",
                    proficiency_level=86,
                    target_level=95,
                    notes="Solid local inference experience; focus on KV cache tuning and quantization.",
                    actionable_recommendations=[
                        "Benchmark vLLM throughput against Ollama for concurrent user requests.",
                        "Experiment with 4-bit AWQ vs GGUF Q4_K_M for latency-critical tasks.",
                    ],
                ),
                SkillAssessment(
                    category="Agentic AI",
                    skill_name="Multi-Agent Orchestration & Supervisor Patterns",
                    proficiency_level=75,
                    target_level=90,
                    notes="Strong agent coordination foundation; expand dynamic routing and memory replay.",
                    actionable_recommendations=[
                        "Implement dynamic specialist spawning based on task complexity.",
                        "Add self-reflection and automatic recovery upon tool execution errors.",
                    ],
                ),
                SkillAssessment(
                    category="Backend Systems",
                    skill_name="Async Python (FastAPI, APScheduler, SQLAlchemy 2.0)",
                    proficiency_level=88,
                    target_level=95,
                    notes="Proficient with async routing, connection pooling, and job queues.",
                    actionable_recommendations=[
                        "Optimize SQLite WAL mode concurrency and prepare PostgreSQL Docker migration path.",
                    ],
                ),
                SkillAssessment(
                    category="Frontend & UI",
                    skill_name="React, Vite, Real-Time Dashboards & UI Plugin Architecture",
                    proficiency_level=80,
                    target_level=90,
                    notes="Clean component design with CSS variables and responsive dark telemetry themes.",
                    actionable_recommendations=[
                        "Add interactive Gantt and multi-axis radar charts for opportunity evaluation.",
                    ],
                ),
                SkillAssessment(
                    category="Startup & Business Strategy",
                    skill_name="Idea Validation, Lean Canvas & SaaS Pricing Modeling",
                    proficiency_level=55,
                    target_level=85,
                    notes="High-leverage growth area: transition technical prototypes into customer-validated products.",
                    actionable_recommendations=[
                        "Conduct 5 customer problem interviews before writing MVP code.",
                        "Structure tiered value-metric pricing (seat + usage hybrid).",
                    ],
                ),
            ]
            for s in initial_skills:
                db.add(s)

        db.commit()
