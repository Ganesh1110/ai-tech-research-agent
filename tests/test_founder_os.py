"""Self-contained test suite for Personal AI Founder & Growth OS (Phases 7 & 8).

Runs against an isolated temporary SQLite database with dedicated fixtures,
verifying that all functionality works cleanly on a fresh environment.
"""

from __future__ import annotations

import os
import tempfile
import unittest

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
settings.DATABASE_URL = f"sqlite:///{_test_db_path}"
settings.ENVIRONMENT = "test"

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

from app.api.server import app
from app.database.db import SessionLocal, create_tables
from app.database.models import (
    ResearchItem,
    StartupOpportunity,
    WeeklyBriefing,
    ProductBlueprint,
    FounderProfile,
    SkillAssessment,
)
from app.services.startup_intelligence import StartupIntelligenceService


class TestFounderOS(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        create_tables()
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        if os.path.exists(_test_db_path):
            try:
                os.remove(_test_db_path)
            except OSError:
                pass

    def setUp(self):
        # Reset and seed predictable test fixtures for each test method
        with SessionLocal() as db:
            db.query(WeeklyBriefing).delete()
            db.query(ProductBlueprint).delete()
            db.query(StartupOpportunity).delete()
            db.query(ResearchItem).delete()
            db.query(FounderProfile).delete()
            db.query(SkillAssessment).delete()
            db.commit()

            item1 = ResearchItem(
                title="Real-Time Speech-to-Speech Voice Agent Framework",
                url="https://github.com/example/voice-agent-framework",
                description="Open-source ultra-low latency voice AI pipeline supporting local whisper and piper TTS.",
                source="github",
                category="Agentic AI",
                processing_status="completed",
                relevance_score=94,
                technical_value_score=92,
                metadata_json={
                    "technologies": ["Python", "WebRTC", "Ollama", "Whisper"],
                    "key_topics": ["Voice AI", "Local Inference", "Real-Time Streaming"],
                    "why_it_matters": "Enables completely private, zero-latency phone receptionists for SMBs.",
                },
            )
            item2 = ResearchItem(
                title="Autonomous Multi-Model Computer Use Platform",
                url="https://github.com/example/computer-use-agent",
                description="Autonomous desktop and browser navigation agents with human-in-the-loop approvals.",
                source="github",
                category="Developer Tools",
                processing_status="completed",
                relevance_score=88,
                technical_value_score=85,
                metadata_json={
                    "technologies": ["TypeScript", "Playwright", "FastAPI"],
                    "key_topics": ["GUI Automation", "Agent Workflows"],
                    "why_it_matters": "Automates repetitive enterprise data entry and compliance auditing.",
                },
            )
            db.add_all([item1, item2])
            db.commit()

            service = StartupIntelligenceService()
            service.seed_initial_founder_data(db)
            service.scan_research_for_opportunities(db, limit=5, min_score=60)

    def test_seed_initial_founder_data(self):
        with SessionLocal() as db:
            profile = db.query(FounderProfile).first()
            self.assertIsNotNone(profile)
            self.assertEqual(profile.name, "Founder")
            self.assertTrue(len(profile.target_domains) > 0)

            skills = db.query(SkillAssessment).all()
            self.assertGreaterEqual(len(skills), 5)
            categories = {s.category for s in skills}
            self.assertIn("AI / LLM Engineering", categories)
            self.assertIn("Startup & Business Strategy", categories)

    def test_startup_opportunity_generation(self):
        with SessionLocal() as db:
            all_opps = db.query(StartupOpportunity).all()
            self.assertGreater(len(all_opps), 0)
            lead = all_opps[0]
            self.assertTrue(bool(lead.title))
            self.assertTrue(bool(lead.problem_statement))
            self.assertTrue(bool(lead.proposed_solution))
            self.assertTrue(0 <= lead.overall_score <= 100)
            self.assertTrue(0 <= lead.technical_feasibility <= 100)
            self.assertTrue(0 <= lead.market_opportunity <= 100)
            self.assertTrue(0 <= lead.cost_feasibility <= 100)
            self.assertTrue(0 <= lead.differentiation <= 100)

    def test_weekly_briefing_generation(self):
        with SessionLocal() as db:
            service = StartupIntelligenceService()
            briefing = service.generate_weekly_briefing(db, force_new=True)
            self.assertIsNotNone(briefing)
            self.assertTrue(briefing.title.startswith("AI Founder Weekly Briefing"))
            self.assertGreater(len(briefing.top_opportunities), 0)
            self.assertIn("name", briefing.recommended_mvp)
            self.assertIn("skill_name", briefing.skill_focus)

    def test_api_startup_endpoints(self):
        # 1. Opportunities list
        res = self.client.get("/api/startup/opportunities")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("items", data)
        self.assertIsInstance(data["items"], list)
        self.assertGreater(len(data["items"]), 0)

        opp_id = data["items"][0]["id"]

        # 2. Update status to watchlist
        res_patch = self.client.patch(
            f"/api/startup/opportunities/{opp_id}/status",
            json={"status": "watchlist", "notes": "High priority evaluation"},
        )
        self.assertEqual(res_patch.status_code, 200)
        self.assertEqual(res_patch.json()["status"], "watchlist")
        self.assertEqual(res_patch.json()["notes"], "High priority evaluation")

        # 3. Latest weekly briefing
        res_b = self.client.get("/api/startup/briefings/latest")
        self.assertEqual(res_b.status_code, 200)
        briefing_data = res_b.json()
        self.assertTrue(bool(briefing_data["title"]))
        self.assertIn("top_opportunities", briefing_data)
        self.assertIn("recommended_mvp", briefing_data)
        self.assertIn("skill_focus", briefing_data)

    def test_api_growth_endpoints(self):
        # 1. Founder Profile GET & PUT
        res_p = self.client.get("/api/growth/profile")
        self.assertEqual(res_p.status_code, 200)
        p = res_p.json()
        self.assertEqual(p["name"], "Founder")

        res_put = self.client.put(
            "/api/growth/profile",
            json={"name": "Alex", "weekly_hours": 30},
        )
        self.assertEqual(res_put.status_code, 200)
        self.assertEqual(res_put.json()["name"], "Alex")
        self.assertEqual(res_put.json()["weekly_hours"], 30)

        # 2. Skill Matrix GET & PATCH
        res_s = self.client.get("/api/growth/skills")
        self.assertEqual(res_s.status_code, 200)
        s_data = res_s.json()
        self.assertGreaterEqual(len(s_data["skills"]), 5)

        skill_id = s_data["skills"][0]["id"]
        res_patch_skill = self.client.patch(
            f"/api/growth/skills/{skill_id}",
            json={"proficiency_level": 92},
        )
        self.assertEqual(res_patch_skill.status_code, 200)
        self.assertEqual(res_patch_skill.json()["proficiency_level"], 92)

    def test_api_product_blueprints(self):
        # Create blueprint
        res_create = self.client.post(
            "/api/product/blueprints",
            json={
                "name": "Autonomous SMB Receptionist",
                "tagline": "Private multilingual voice bot",
                "architecture_summary": "FastAPI + WebRTC + local Whisper inference pipeline",
            },
        )
        self.assertEqual(res_create.status_code, 200)
        created = res_create.json()
        self.assertEqual(created["name"], "Autonomous SMB Receptionist")

        # List blueprints
        res_list = self.client.get("/api/product/blueprints")
        self.assertEqual(res_list.status_code, 200)
        self.assertGreater(len(res_list.json()["blueprints"]), 0)

    def test_auth_enforcement_when_configured(self):
        # Test that API Key protection works when enabled
        settings.API_KEY = "super-secret-key"
        try:
            # 1. Calling protected endpoint without key should return 401
            res_unauth = self.client.get("/api/growth/profile")
            self.assertEqual(res_unauth.status_code, 401)

            # 2. Public health endpoint remains accessible
            res_health = self.client.get("/api/health")
            self.assertEqual(res_health.status_code, 200)

            # 3. Calling with X-API-Key succeeds
            res_auth = self.client.get("/api/growth/profile", headers={"X-API-Key": "super-secret-key"})
            self.assertEqual(res_auth.status_code, 200)

            # 4. Calling with Bearer token succeeds
            res_bearer = self.client.get("/api/growth/profile", headers={"Authorization": "Bearer super-secret-key"})
            self.assertEqual(res_bearer.status_code, 200)
        finally:
            settings.API_KEY = ""


if __name__ == "__main__":
    unittest.main()
