from __future__ import annotations

import os
import tempfile
import unittest
from datetime import datetime, timezone

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config import settings

# Point to temporary test database before importing DB models
_test_db_file = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
_test_db_path = _test_db_file.name
_test_db_file.close()

os.environ["DATABASE_URL"] = f"sqlite:///{_test_db_path}"
os.environ["ENVIRONMENT"] = "test"
os.environ["API_KEY"] = ""  # No auth for test isolation
settings.DATABASE_URL = f"sqlite:///{_test_db_path}"
settings.ENVIRONMENT = "test"
settings.API_KEY = ""

# Re-bind engine & SessionLocal to test DB
import app.database.db as db_module
db_module.engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False},
)
db_module.SessionLocal = sessionmaker(
    bind=db_module.engine,
    autoflush=False,
    expire_on_commit=False,
)

from app.database.db import Base, SessionLocal, create_tables
from app.database.models import (
    IdeaVaultItem,
    GlobalProblem,
    StartupOpportunity,
    FounderProfile,
    SkillAssessment,
)
from app.services.idea_validation import IdeaValidationService
from app.api.server import app


class TestIdeaValidationAndProblemRadar(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        db_module.engine = create_engine(
            settings.DATABASE_URL,
            connect_args={"check_same_thread": False},
        )
        db_module.SessionLocal = sessionmaker(
            bind=db_module.engine,
            autoflush=False,
            expire_on_commit=False,
        )
        import app.api.routes as routes_module
        routes_module.SessionLocal = db_module.SessionLocal

        create_tables()
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        db_module.engine.dispose()
        if os.path.exists(_test_db_path):
            try:
                os.remove(_test_db_path)
            except OSError:
                pass

    def setUp(self):
        with SessionLocal() as db:
            db.query(IdeaVaultItem).delete()
            db.query(GlobalProblem).delete()
            db.query(StartupOpportunity).delete()
            db.commit()

    def test_seed_and_get_ideas(self):
        with SessionLocal() as db:
            service = IdeaValidationService()
            ideas = service.get_or_seed_ideas(db)
            self.assertGreaterEqual(len(ideas), 2)
            self.assertEqual(ideas[0].status, "draft")

    def test_scan_and_sync_problems(self):
        with SessionLocal() as db:
            service = IdeaValidationService()
            problems = service.scan_and_sync_problems(db, limit=5)
            self.assertGreaterEqual(len(problems), 3)
            self.assertGreater(problems[0].composite_pain_score, 0)
            self.assertIn("HackerNews", [p.source for p in problems] + [p.source for p in problems])

    def test_idea_validation_pipeline(self):
        with SessionLocal() as db:
            service = IdeaValidationService()
            # Seed problem radar first so matcher finds signals
            service.scan_and_sync_problems(db, limit=5)

            new_idea = IdeaVaultItem(
                title="AI Agentic Context Window Watcher",
                problem_statement="Engineers lose LLM context or get massive token bills in long agent loops.",
                proposed_solution="FastAPI SQLite proxy that logs token usage and catches loops.",
                target_audience="Developers and startup founders",
                monetization_hypothesis="Open-source core with paid cloud sync",
                tags=["AI Agents", "Observability", "DevTools"],
                status="draft",
            )
            db.add(new_idea)
            db.commit()
            db.refresh(new_idea)

            validated = service.validate_idea(db, new_idea.id)
            self.assertIsNotNone(validated)
            self.assertEqual(validated.status, "validated")
            self.assertGreaterEqual(validated.validation_score, 50.0)
            self.assertIn("verdict", validated.validation_feedback)
            self.assertIn("mvp_action_plan", validated.validation_feedback)

    def test_promote_idea_to_opportunity(self):
        with SessionLocal() as db:
            service = IdeaValidationService()
            idea = IdeaVaultItem(
                title="Continuous Competitor Pain-Point Radar",
                problem_statement="Solo founders lack time to read 1-star reviews.",
                proposed_solution="Scraper that turns bad reviews into product features.",
                target_audience="Indie Hackers",
                monetization_hypothesis="$39/mo subscription",
                tags=["Market Intelligence", "SaaS"],
                status="draft",
            )
            db.add(idea)
            db.commit()
            db.refresh(idea)

            opp = service.promote_to_startup_opportunity(db, idea.id)
            self.assertIsNotNone(opp)
            self.assertEqual(opp.title, idea.title)
            self.assertEqual(idea.status, "promoted")

    def test_api_idea_endpoints(self):
        # 1. GET /api/ideas
        resp = self.client.get("/api/ideas")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("ideas", data)
        self.assertGreaterEqual(data["total"], 2)

        # 2. POST /api/ideas
        create_resp = self.client.post("/api/ideas", json={
            "title": "Voice Agent for Dental Clinics",
            "problem_statement": "Clinics miss 35% of after-hours appointment calls.",
            "proposed_solution": "Low latency voice agent hooked to clinic CRM.",
            "target_audience": "Dental practice owners",
            "monetization_hypothesis": "$199/mo per practice",
            "tags": ["Voice AI", "Healthcare", "CRM"]
        })
        self.assertEqual(create_resp.status_code, 200)
        created_id = create_resp.json()["id"]

        # 3. POST /api/ideas/{id}/validate
        val_resp = self.client.post(f"/api/ideas/{created_id}/validate")
        self.assertEqual(val_resp.status_code, 200)
        val_data = val_resp.json()
        self.assertEqual(val_data["status"], "validated")
        self.assertGreater(val_data["validation_score"], 0)

        # 4. POST /api/ideas/{id}/promote
        prom_resp = self.client.post(f"/api/ideas/{created_id}/promote")
        self.assertEqual(prom_resp.status_code, 200)
        self.assertEqual(prom_resp.json()["title"], "Voice Agent for Dental Clinics")

    def test_api_problem_endpoints(self):
        # 1. GET /api/problems
        resp = self.client.get("/api/problems")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("problems", data)

        # 2. POST /api/problems (manual)
        manual_resp = self.client.post("/api/problems", json={
            "title": "High churn on recurring invoice reconciliation",
            "description": "Accountants manually match Stripe payouts against bank deposits.",
            "category": "Fintech",
            "source": "Manual",
            "severity_score": 8.0,
            "frequency_score": 7.5,
            "commercial_viability": 9.0
        })
        self.assertEqual(manual_resp.status_code, 200)
        prob = manual_resp.json()
        self.assertGreater(prob["composite_pain_score"], 70)


if __name__ == "__main__":
    unittest.main()
