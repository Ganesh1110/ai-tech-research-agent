"""Tests for Personal AI Founder & Growth OS features (Phases 7 & 8)."""

import unittest
from fastapi.testclient import TestClient

from app.api.server import app
from app.database.db import SessionLocal
from app.database.models import (
    StartupOpportunity,
    WeeklyBriefing,
    ProductBlueprint,
    FounderProfile,
    SkillAssessment,
)
from app.services.startup_intelligence import StartupIntelligenceService


class TestFounderOS(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(app)

    def test_seed_initial_founder_data(self):
        with SessionLocal() as db:
            service = StartupIntelligenceService()
            service.seed_initial_founder_data(db)

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
            service = StartupIntelligenceService()
            opps = service.scan_research_for_opportunities(db, limit=3, min_score=50)
            all_opps = db.query(StartupOpportunity).all()
            self.assertGreater(len(all_opps), 0)
            lead = all_opps[0]
            self.assertTrue(bool(lead.title))
            self.assertTrue(bool(lead.problem_statement))
            self.assertTrue(bool(lead.proposed_solution))
            self.assertTrue(0 <= lead.overall_score <= 100)
            self.assertTrue(0 <= lead.technical_feasibility <= 100)
            self.assertTrue(0 <= lead.market_opportunity <= 100)

    def test_weekly_briefing_generation(self):
        with SessionLocal() as db:
            service = StartupIntelligenceService()
            briefing = service.generate_weekly_briefing(db, force_new=False)
            self.assertIsNotNone(briefing)
            self.assertTrue(briefing.title.startswith("AI Founder Weekly Briefing"))
            self.assertGreater(len(briefing.top_opportunities), 0)
            self.assertIn("name", briefing.recommended_mvp)
            self.assertIn("skill_name", briefing.skill_focus)

    def test_api_startup_endpoints(self):
        # Opportunities list
        res = self.client.get("/api/startup/opportunities")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("items", data)
        self.assertIsInstance(data["items"], list)

        # Latest weekly briefing
        res_b = self.client.get("/api/startup/briefings/latest")
        self.assertEqual(res_b.status_code, 200)
        briefing_data = res_b.json()
        self.assertTrue(bool(briefing_data["title"]))
        self.assertIn("top_opportunities", briefing_data)
        self.assertIn("recommended_mvp", briefing_data)
        self.assertIn("skill_focus", briefing_data)

    def test_api_growth_endpoints(self):
        # Founder Profile
        res_p = self.client.get("/api/growth/profile")
        self.assertEqual(res_p.status_code, 200)
        p = res_p.json()
        self.assertEqual(p["name"], "Founder")

        # Skill Matrix
        res_s = self.client.get("/api/growth/skills")
        self.assertEqual(res_s.status_code, 200)
        s_data = res_s.json()
        self.assertGreaterEqual(len(s_data["skills"]), 5)

    def test_api_product_blueprints(self):
        # Create blueprint
        res_create = self.client.post(
            "/api/product/blueprints",
            json={
                "name": "Test Autonomous Bot",
                "tagline": "A test blueprint",
                "architecture_summary": "FastAPI + React test architecture",
            },
        )
        self.assertEqual(res_create.status_code, 200)
        created = res_create.json()
        self.assertEqual(created["name"], "Test Autonomous Bot")

        # List blueprints
        res_list = self.client.get("/api/product/blueprints")
        self.assertEqual(res_list.status_code, 200)
        self.assertGreater(len(res_list.json()["blueprints"]), 0)


if __name__ == "__main__":
    unittest.main()
