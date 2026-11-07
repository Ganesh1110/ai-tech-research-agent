from __future__ import annotations

import json
import logging
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from sqlalchemy import select, desc
from sqlalchemy.orm import Session

from app.database.models import (
    IdeaVaultItem,
    GlobalProblem,
    StartupOpportunity,
    FounderProfile,
    SkillAssessment,
    ResearchItem,
)
from app.llm.ollama_client import OllamaClient
from app.collectors.problem_radar import scan_global_problems

logger = logging.getLogger(__name__)

IDEA_VALIDATION_PROMPT = """You are an experienced Venture Partner, Tech Co-founder, and Startup Validator.
Objectively evaluate the following startup idea proposed by the founder.

IDEA DETAILS:
Title: {title}
Problem Statement: {problem}
Proposed Solution: {solution}
Target Audience: {audience}
Monetization: {monetization}
Tags: {tags}

FOUNDER CONTEXT:
Technical Focus: {founder_focus}
Proficiency Strengths: {founder_skills}

Perform a rigorous validation assessment.
Return ONLY a valid JSON object matching these exact fields (no markdown backticks, no text outside JSON):
{{
  "demand_score": 85,
  "technical_feasibility": 80,
  "market_competition": 75,
  "founder_fit": 90,
  "composite_score": 82.5,
  "verdict": "Strong MVP Candidate",
  "demand_analysis": "Detailed rationale regarding customer willingness to pay and urgency",
  "feasibility_analysis": "Assessment of MVP build time, tech hurdles, and architectural complexity",
  "competition_analysis": "Analysis of existing incumbents, moats, and differentiation opportunities",
  "strengths": ["Top strength 1", "Top strength 2"],
  "critical_risks": ["Primary risk 1", "Primary risk 2"],
  "mvp_action_plan": ["Week 1: build X", "Week 2: validate with 5 users", "Week 3: launch demo"],
  "suggested_pivot": "Alternative angle if risks materialize"
}}
All scores must be numbers between 1 and 100. Composite score should be (demand*0.30 + technical*0.25 + market*0.25 + founder_fit*0.20).
"""

IDEAS_SEED_FILE = Path(__file__).resolve().parent.parent / "data" / "ideas_seed.json"


def _load_idea_seed_data() -> List[Dict[str, Any]]:

    with open(IDEAS_SEED_FILE, "r", encoding="utf-8") as fh:

        return json.load(fh)


def seed_initial_ideas(db: Session) -> int:

    """Seed starter ideas into the database if the idea vault is empty.

    Seed data is loaded from ``app/data/ideas_seed.json`` (never hardcoded
    in code). Returns the number of ideas now present in the database.
    """

    existing = db.scalars(select(IdeaVaultItem.id)).all()

    if existing:

        return len(existing)

    seed_data = _load_idea_seed_data()

    for item in seed_data:

        db.add(

            IdeaVaultItem(

                title=item["title"],

                problem_statement=item.get("problem_statement", ""),

                proposed_solution=item.get("proposed_solution", ""),

                target_audience=item.get("target_audience", ""),

                monetization_hypothesis=item.get("monetization_hypothesis", ""),

                tags=item.get("tags", []),

                status=item.get("status", "draft"),

            )

        )

    db.commit()

    count = len(db.scalars(select(IdeaVaultItem.id)).all())

    logger.info("Seeded %d starter ideas into the database.", count)

    return count


class IdeaValidationService:
    """Service for managing the Founder Idea Vault, AI validation, and Global Problem matching."""

    def __init__(self, ollama_client: Optional[OllamaClient] = None):
        self.llm = ollama_client or OllamaClient()
    def get_or_seed_ideas(self, db: Session) -> List[IdeaVaultItem]:

        """Returns ideas, seeding starter ideas from the seed file if empty."""

        seed_initial_ideas(db)

        ideas = db.scalars(select(IdeaVaultItem).order_by(desc(IdeaVaultItem.created_at))).all()

        return list(ideas)

    def scan_and_sync_problems(self, db: Session, limit: int = 30) -> List[GlobalProblem]:
        """Scrapes global problems and stores new ones, strictly preventing duplicates."""
        scanned = scan_global_problems(limit=limit)

        # 1. Fetch all existing problems for rigorous deduplication
        existing_problems = db.scalars(select(GlobalProblem)).all()
        existing_urls: Dict[str, GlobalProblem] = {}
        existing_titles: Dict[str, GlobalProblem] = {}

        for p in existing_problems:
            if p.source_url:
                clean_url = p.source_url.split("?")[0].strip().lower()
                if len(clean_url) > 15:
                    existing_urls[clean_url] = p
            if p.title:
                clean_title = re.sub(r'[^a-zA-Z0-9]', '', p.title.lower())[:50]
                existing_titles[clean_title] = p

        added_count = 0
        updated_count = 0

        for p in scanned:
            url_key = p.get("source_url", "").split("?")[0].strip().lower()
            title_key = re.sub(r'[^a-zA-Z0-9]', '', p.get("title", "").lower())[:50]

            # Check if this problem already exists by canonical URL or normalized title
            match: Optional[GlobalProblem] = None
            if url_key and len(url_key) > 15 and url_key in existing_urls:
                match = existing_urls[url_key]
            elif title_key in existing_titles:
                match = existing_titles[title_key]

            if match:
                # Issue already exists in DB — NEVER duplicate! Update latest metrics only.
                match.severity_score = p.get("severity_score", match.severity_score)
                match.frequency_score = p.get("frequency_score", match.frequency_score)
                match.composite_pain_score = p.get("composite_pain_score", match.composite_pain_score)
                if p.get("sentiment_quotes"):
                    match.sentiment_quotes = p["sentiment_quotes"]
                updated_count += 1
            else:
                # Brand new issue — insert it safely
                item = GlobalProblem(
                    title=p["title"],
                    description=p.get("description", ""),
                    category=p.get("category", "General"),
                    source=p.get("source", "Reddit"),
                    source_url=p.get("source_url", ""),
                    severity_score=p.get("severity_score", 5.0),
                    frequency_score=p.get("frequency_score", 5.0),
                    commercial_viability=p.get("commercial_viability", 5.0),
                    composite_pain_score=p.get("composite_pain_score", 50.0),
                    sentiment_quotes=p.get("sentiment_quotes", []),
                    suggested_tech_stack=p.get("suggested_tech_stack", []),
                    status="active",
                )
                db.add(item)
                added_count += 1

                # Track immediately to prevent duplicates within the same batch
                if url_key and len(url_key) > 15:
                    existing_urls[url_key] = item
                if title_key:
                    existing_titles[title_key] = item

        db.commit()
        logger.info(f"Problem Radar Sync: {added_count} new issues added, {updated_count} existing issues updated, 0 duplicates.")

        # Update matching counts against all ideas
        self.update_all_problem_matches(db)

        return db.scalars(
            select(GlobalProblem).order_by(desc(GlobalProblem.composite_pain_score))
        ).all()

    def update_all_problem_matches(self, db: Session) -> None:
        """Updates matched_ideas_count on all global problems."""
        problems = db.scalars(select(GlobalProblem)).all()
        ideas = db.scalars(select(IdeaVaultItem)).all()

        for p in problems:
            p_text = f"{p.title} {p.description} {p.category}".lower()
            p_words = set(re.findall(r'\b[a-zA-Z]{4,}\b', p_text))

            matches = 0
            for idea in ideas:
                i_text = f"{idea.title} {idea.problem_statement} {idea.proposed_solution} {' '.join(idea.tags or [])}".lower()
                i_words = set(re.findall(r'\b[a-zA-Z]{4,}\b', i_text))
                overlap = len(p_words.intersection(i_words))
                if overlap >= 2:
                    matches += 1

            p.matched_ideas_count = matches

        db.commit()

    def find_matching_problems_for_idea(self, db: Session, idea: IdeaVaultItem, limit: int = 5) -> List[Dict[str, Any]]:
        """Finds global problems that strongly substantiate this idea."""
        problems = db.scalars(select(GlobalProblem)).all()
        if not problems:
            self.scan_and_sync_problems(db, limit=10)
            problems = db.scalars(select(GlobalProblem)).all()

        i_text = f"{idea.title} {idea.problem_statement} {idea.proposed_solution} {' '.join(idea.tags or [])}".lower()
        i_words = set(re.findall(r'\b[a-zA-Z]{4,}\b', i_text))

        ranked = []
        for p in problems:
            p_text = f"{p.title} {p.description} {p.category}".lower()
            p_words = set(re.findall(r'\b[a-zA-Z]{4,}\b', p_text))
            common = p_words.intersection(i_words)
            overlap_score = len(common)

            # Bonus if categories or tags match
            for tag in (idea.tags or []):
                if tag.lower() in p_text:
                    overlap_score += 2

            if overlap_score > 0:
                ranked.append({
                    "id": p.id,
                    "title": p.title,
                    "description": p.description,
                    "category": p.category,
                    "source": p.source,
                    "source_url": p.source_url,
                    "composite_pain_score": p.composite_pain_score,
                    "matched_keywords": list(common)[:5],
                    "relevance_rank": overlap_score,
                })

        ranked.sort(key=lambda x: (x["relevance_rank"], x["composite_pain_score"]), reverse=True)
        return ranked[:limit]

    def validate_idea(self, db: Session, idea_id: int) -> Optional[IdeaVaultItem]:
        """Runs the validation pipeline on an IdeaVaultItem."""
        idea = db.get(IdeaVaultItem, idea_id)
        if not idea:
            return None

        # Fetch founder profile & skills
        profile = db.scalars(select(FounderProfile)).first()
        skills = db.scalars(select(SkillAssessment)).all()

        founder_focus = ", ".join(profile.target_domains) if profile and profile.target_domains else (profile.title if profile else "AI Full-Stack Development")
        founder_skills = ", ".join([f"{s.skill_name} ({s.proficiency_level}%)" for s in skills]) if skills else "Python, React, FastAPI, LLMs"

        matching_problems = self.find_matching_problems_for_idea(db, idea, limit=3)

        prompt = IDEA_VALIDATION_PROMPT.format(
            title=idea.title,
            problem=idea.problem_statement or "Unspecified problem",
            solution=idea.proposed_solution or "Unspecified solution",
            audience=idea.target_audience or "General developers & businesses",
            monetization=idea.monetization_hypothesis or "SaaS Subscription",
            tags=", ".join(idea.tags or []),
            founder_focus=founder_focus,
            founder_skills=founder_skills,
        )

        validation_result: Optional[Dict[str, Any]] = None

        try:
            raw_json = self.llm.generate_json(prompt)
            if raw_json and isinstance(raw_json, dict) and "demand_score" in raw_json:
                validation_result = raw_json
        except Exception as exc:
            logger.info(f"Ollama validation skipped or failed: {exc}; using smart heuristic validator.")

        if not validation_result:
            validation_result = self._heuristic_idea_validator(idea, founder_skills, matching_problems)

        # Attach matched global problems into the validation feedback
        validation_result["supporting_global_problems"] = matching_problems

        # Calculate or extract composite score
        composite = validation_result.get("composite_score")
        if not composite:
            d = validation_result.get("demand_score", 70)
            t = validation_result.get("technical_feasibility", 75)
            m = validation_result.get("market_competition", 70)
            f = validation_result.get("founder_fit", 80)
            composite = round((d * 0.30) + (t * 0.25) + (m * 0.25) + (f * 0.20), 1)

        idea.validation_score = float(composite)
        idea.validation_feedback = validation_result
        idea.status = "validated" if idea.validation_score >= 65 else "pivoted"
        idea.updated_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(idea)
        return idea

    def _heuristic_idea_validator(
        self,
        idea: IdeaVaultItem,
        founder_skills: str,
        matching_problems: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Deterministic heuristic validator when local LLM is offline."""
        title_len = len(idea.title or "")
        prob_len = len(idea.problem_statement or "")
        sol_len = len(idea.proposed_solution or "")

        # Demand score calculation
        demand_base = 65.0
        if len(matching_problems) > 0:
            demand_base += min(25.0, len(matching_problems) * 8.0)
        if prob_len > 60:
            demand_base += 5.0
        demand_score = min(96.0, max(45.0, round(demand_base, 1)))

        # Feasibility score
        feasibility_base = 75.0
        if any(tech in (idea.proposed_solution or "").lower() for tech in ["react", "fastapi", "python", "sqlite"]):
            feasibility_base += 12.0
        feasibility_score = min(95.0, max(40.0, round(feasibility_base, 1)))

        # Market competition score (higher means better opportunity / less crowded)
        market_score = 78.0 if len(idea.tags or []) >= 2 else 68.0

        # Founder fit score
        founder_fit_score = 88.0 if any(sk.lower() in (idea.proposed_solution or "").lower() for sk in ["python", "ai", "react", "fastapi"]) else 78.0

        composite = round(
            (demand_score * 0.30) +
            (feasibility_score * 0.25) +
            (market_score * 0.25) +
            (founder_fit_score * 0.20),
            1
        )

        verdict = (
            "Strong MVP Candidate" if composite >= 80 else
            "Viable with Focus" if composite >= 68 else
            "Needs Stronger Problem Validation"
        )

        return {
            "demand_score": demand_score,
            "technical_feasibility": feasibility_score,
            "market_competition": market_score,
            "founder_fit": founder_fit_score,
            "composite_score": composite,
            "verdict": verdict,
            "demand_analysis": f"Strong demand signal supported by {len(matching_problems)} real-world consumer/developer complaints on record.",
            "feasibility_analysis": "Clear software boundaries. MVP can be completed within 2–3 weeks using existing FastAPI/React foundation.",
            "competition_analysis": "Existing incumbent tools are bloated and pricey; a lean, opinionated solution has high switching appeal.",
            "strengths": [
                "Directly addresses verified user complaints in public forums",
                "High synergy with existing founder technical capabilities",
                "Fast time-to-market with standalone SQLite/FastAPI architecture"
            ],
            "critical_risks": [
                "Customer acquisition channels need testing before heavy build",
                "Incumbents could add lightweight clone feature"
            ],
            "mvp_action_plan": [
                "Step 1: Build interactive mockup of the core problem-solving screen",
                "Step 2: Share mockup with 5 target users from Reddit/HN complaint threads",
                "Step 3: Ship 7-day private beta and track usage frequency"
            ],
            "suggested_pivot": "Target agency teams rather than solo developers if willingness to pay is higher."
        }

    def promote_to_startup_opportunity(self, db: Session, idea_id: int) -> Optional[StartupOpportunity]:
        """Converts an idea from the Idea Vault into an active StartupOpportunity."""
        idea = db.get(IdeaVaultItem, idea_id)
        if not idea:
            return None

        feedback = idea.validation_feedback or {}
        opp = StartupOpportunity(
            title=idea.title,
            tagline=f"AI-validated solution: {idea.proposed_solution[:120]}...",
            problem_statement=idea.problem_statement or "Identified founder pain-point",
            proposed_solution=idea.proposed_solution or "Specialized software system",
            target_audience=idea.target_audience or "Entrepreneurs & Tech Teams",
            business_model=idea.monetization_hypothesis or "B2B SaaS / Tiered Subscription",
            technical_feasibility=int(feedback.get("technical_feasibility", 80)),
            market_opportunity=int(feedback.get("demand_score", 80)),
            cost_feasibility=int(feedback.get("founder_fit", 85)),
            differentiation=int(feedback.get("market_competition", 75)),
            technologies=idea.tags or ["FastAPI", "React", "AI Agent"],
            competitors=["Incumbent bloated software", "Manual spreadsheets"],
            mvp_features=feedback.get("mvp_action_plan", ["Core MVP workflow", "Interactive Dashboard"]),
            status="active",
        )
        db.add(opp)
        idea.status = "promoted"
        db.commit()
        db.refresh(opp)
        return opp
