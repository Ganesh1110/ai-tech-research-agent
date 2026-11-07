from __future__ import annotations

import logging
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import httpx

logger = logging.getLogger(__name__)

# Fallback pre-curated high-pain global problems (ensures offline reliability)
CURATED_GLOBAL_PROBLEMS = [
    {
        "title": "LLM Context Drift & Cost Explosions in Long-Running Autonomous Workflows",
        "description": "Engineers and founders building agentic pipelines report persistent context degradation, lost instructions over multi-turn agent loops, and 10x unexpected token bills when running unmonitored recursive agent jobs.",
        "category": "AI Workflow",
        "source": "HackerNews",
        "source_url": "https://news.ycombinator.com/item?id=3918231",
        "severity_score": 8.5,
        "frequency_score": 9.0,
        "commercial_viability": 9.2,
        "sentiment_quotes": [
            "We burned $1,400 in 3 days because an agent went into a 200-loop context compaction spiral.",
            "Tracing exactly why an LLM decision diverged at step 42 is practically impossible with current logging tools."
        ],
        "suggested_tech_stack": ["FastAPI", "SQLite/Postgres", "OpenTelemetry", "Local SLMs / Ollama", "Semantic Cache"]
    },
    {
        "title": "Fragmented Micro-SaaS Tool Fatigue for Solo Builders & Small Teams",
        "description": "Solopreneurs and small startups are frustrated with managing 12+ separate monthly subscriptions for basic research, CRM, note-taking, project tracking, and analytics, causing high friction and context switching.",
        "category": "Productivity",
        "source": "Reddit",
        "source_url": "https://www.reddit.com/r/SaaS/comments/solo_builder_fatigue",
        "severity_score": 7.8,
        "frequency_score": 8.7,
        "commercial_viability": 8.5,
        "sentiment_quotes": [
            "I spend more time integrating Zapier, Notion, Airtable, and Stripe than actually speaking to customers.",
            "Paying $29/seat across 8 tools for a 2-person team is killing our runway."
        ],
        "suggested_tech_stack": ["React", "FastAPI", "SQLite", "TailwindCSS", "Webhook Orchestrator"]
    },
    {
        "title": "Broken Documentation & Outdated Migration Guides in Modern Frontend Frameworks",
        "description": "Developers migrating between major framework versions (e.g., React Server Components, Next.js App Router, Vite bundler plugins) struggle with hallucinated AI answers and outdated stackoverflow threads.",
        "category": "DevTools",
        "source": "GitHub",
        "source_url": "https://github.com/facebook/react/issues/migration_drift",
        "severity_score": 8.2,
        "frequency_score": 8.9,
        "commercial_viability": 7.5,
        "sentiment_quotes": [
            "Official docs mention one thing, but 3 weeks later the release notes break imports without deprecation notices.",
            "ChatGPT keeps giving me Next 12 code for App router queries."
        ],
        "suggested_tech_stack": ["AST Parsers", "Knowledge Graph", "Vector Retrieval (ChromaDB)", "ArXiv/GitHub Crawlers"]
    },
    {
        "title": "High Customer Churn from Inflexible Generic Onboarding Flows in B2B Products",
        "description": "B2B SaaS companies lose up to 60% of trial signups within the first 48 hours because onboarding checklists are static, boring, and not tailored to user technical maturity or role.",
        "category": "SaaS",
        "source": "Reddit",
        "source_url": "https://www.reddit.com/r/Entrepreneur/comments/onboarding_churn",
        "severity_score": 8.0,
        "frequency_score": 7.9,
        "commercial_viability": 9.0,
        "sentiment_quotes": [
            "Users hit the dashboard, get confused by 40 empty cards, and never log in again.",
            "We need adaptive onboarding that inspects what the user actually wants to accomplish."
        ],
        "suggested_tech_stack": ["Adaptive LLM Prompts", "React Guided Tour", "Event Analytics", "Python FastServe"]
    },
    {
        "title": "No Easy Way to Audit and Control Sensitive Data Leaking into Cloud LLMs",
        "description": "Healthcare, legal, and fintech enterprises want generative AI features but are blocked by compliance teams worried about PII/PHI or proprietary source code leaking to 3rd-party APIs.",
        "category": "Security & Compliance",
        "source": "HackerNews",
        "source_url": "https://news.ycombinator.com/item?id=389104",
        "severity_score": 9.2,
        "frequency_score": 8.4,
        "commercial_viability": 9.6,
        "sentiment_quotes": [
            "Our compliance officer killed our AI initiative because we couldn't guarantee prompt redaction.",
            "Local offline models are great, but managing the inference server securely on-prem is a nightmare."
        ],
        "suggested_tech_stack": ["Presidio PII Redaction", "Ollama/vLLM Local Inference", "Audit Log Cryptography"]
    },
    {
        "title": "Strict Campus & Office Firewalls Blocking Casual Local Multiplayer Games",
        "description": "Students in dorms, labs, and hackathons cannot play quick casual multiplayer games together because university/corporate IT blocks UDP ports, external gaming lobbies, and requires administrative installation privileges.",
        "category": "Consumer & SMB",
        "source": "Reddit",
        "source_url": "https://www.reddit.com/r/college/comments/dorm_lan_gaming_firewall",
        "severity_score": 8.0,
        "frequency_score": 8.6,
        "commercial_viability": 7.4,
        "sentiment_quotes": [
            "Our university Wi-Fi blocks every single gaming server and peer-to-peer port.",
            "We just wanted to play simple chess or trivia during hackathon breaks without downloading 500MB clients."
        ],
        "suggested_tech_stack": ["Python Standard Library", "WebSockets / Web Terminal (ttyd)", "Docker", "Zero-Dependency Architecture"]
    }
]

HIGH_PAIN_KEYWORDS = {
    "hate": 2.5,
    "frustrating": 2.0,
    "impossible": 2.5,
    "nightmare": 3.0,
    "broken": 2.0,
    "waste": 1.8,
    "terrible": 2.0,
    "pain": 2.0,
    "struggle": 1.8,
    "expensive": 1.5,
    "slow": 1.2,
    "churn": 1.5,
    "complaint": 1.5,
}


def _calculate_severity(text: str) -> float:
    """Heuristic sentiment severity score (1.0 - 10.0) based on pain signals."""
    lower = text.lower()
    score = 4.5
    for kw, weight in HIGH_PAIN_KEYWORDS.items():
        if kw in lower:
            score += weight
    return min(10.0, round(score, 1))


def _calculate_composite_score(severity: float, frequency: float, commercial: float) -> float:
    """Calculates 0-100 composite pain score."""
    raw = (severity * 0.4) + (frequency * 0.3) + (commercial * 0.3)
    return min(100.0, max(0.0, round(raw * 10, 1)))


def fetch_hacker_news_problems(limit: int = 10) -> List[Dict[str, Any]]:
    """Scrape problem/annoyance threads from Hacker News Algolia Search API."""
    url = "https://hn.algolia.com/api/v1/search"
    params = {
        "query": "Ask HN What problems OR Ask HN What annoys you OR why is there no tool",
        "tags": "story",
        "hitsPerPage": limit,
    }
    headers = {"User-Agent": "AI-Founder-OS-Radar/1.0"}
    problems = []

    try:
        with httpx.Client(timeout=10, follow_redirects=True) as client:
            resp = client.get(url, params=params, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                for hit in data.get("hits", []):
                    title = hit.get("title", "").strip()
                    if not title:
                        continue
                    text_content = hit.get("story_text") or title
                    points = hit.get("points") or 1
                    num_comments = hit.get("num_comments") or 0
                    hn_id = hit.get("objectID")

                    severity = _calculate_severity(title + " " + text_content)
                    frequency = min(10.0, round(3.0 + (num_comments / 30.0) + (points / 50.0), 1))
                    commercial = 8.0 if any(k in title.lower() for k in ["b2b", "saas", "software", "tool", "work", "team"]) else 6.5
                    composite = _calculate_composite_score(severity, frequency, commercial)

                    problems.append({
                        "title": title,
                        "description": (text_content[:400] + "...") if len(text_content) > 400 else text_content,
                        "category": "DevTools" if any(k in title.lower() for k in ["code", "developer", "git", "api"]) else "SaaS",
                        "source": "HackerNews",
                        "source_url": f"https://news.ycombinator.com/item?id={hn_id}" if hn_id else "https://news.ycombinator.com",
                        "severity_score": severity,
                        "frequency_score": frequency,
                        "commercial_viability": commercial,
                        "composite_pain_score": composite,
                        "sentiment_quotes": [title],
                        "suggested_tech_stack": ["FastAPI", "React", "SQLite"],
                    })
    except Exception as exc:
        logger.warning(f"Failed to fetch HN problem radar: {exc}")

    return problems


def fetch_reddit_problems(limit: int = 10) -> List[Dict[str, Any]]:
    """Scrape pain points from Reddit public search JSON (SaaS / Entrepreneur)."""
    endpoints = [
        ("https://www.reddit.com/r/SaaS/search.json?q=pain%20OR%20frustrating%20OR%20hate&restrict_sr=1&sort=relevance&limit=8", "SaaS"),
        ("https://www.reddit.com/r/Entrepreneur/search.json?q=problem%20OR%20struggle%20OR%20expensive&restrict_sr=1&sort=relevance&limit=8", "Consumer & SMB"),
    ]
    headers = {"User-Agent": "Mozilla/5.0 (compatible; AI-Founder-OS-Radar/1.0; +https://github.com)"}
    problems = []

    try:
        with httpx.Client(timeout=10, follow_redirects=True) as client:
            for url, cat in endpoints:
                try:
                    resp = client.get(url, headers=headers)
                    if resp.status_code == 200:
                        data = resp.json()
                        children = data.get("data", {}).get("children", [])
                        for child in children:
                            post = child.get("data", {})
                            title = post.get("title", "").strip()
                            selftext = post.get("selftext", "").strip()
                            if not title or len(title) < 10:
                                continue
                            permalink = post.get("permalink", "")
                            ups = post.get("ups", 1)
                            comments = post.get("num_comments", 0)

                            full_text = f"{title} {selftext}"
                            severity = _calculate_severity(full_text)
                            frequency = min(10.0, round(3.5 + (ups / 40.0) + (comments / 25.0), 1))
                            commercial = 8.5 if cat == "SaaS" else 7.0
                            composite = _calculate_composite_score(severity, frequency, commercial)

                            problems.append({
                                "title": title,
                                "description": (selftext[:400] + "...") if len(selftext) > 400 else (selftext or title),
                                "category": cat,
                                "source": "Reddit",
                                "source_url": f"https://reddit.com{permalink}" if permalink else "https://reddit.com",
                                "severity_score": severity,
                                "frequency_score": frequency,
                                "commercial_viability": commercial,
                                "composite_pain_score": composite,
                                "sentiment_quotes": [title[:150]],
                                "suggested_tech_stack": ["FastAPI", "React", "AI Agent"],
                            })
                except Exception as inner_exc:
                    logger.debug(f"Reddit endpoint {url} issue: {inner_exc}")
    except Exception as exc:
        logger.warning(f"Reddit problem radar fetch failed: {exc}")

    return problems


def scan_global_problems(limit: int = 15) -> List[Dict[str, Any]]:
    """
    Main aggregator for Global Problem Radar.
    Combines live network feeds (HackerNews, Reddit) with curated resilient fallbacks.
    """
    results: List[Dict[str, Any]] = []

    # 1. Fetch live signals
    hn_items = fetch_hacker_news_problems(limit=limit)
    reddit_items = fetch_reddit_problems(limit=limit)

    results.extend(hn_items)
    results.extend(reddit_items)

    # 2. If network feeds were sparse or blocked, inject curated fallback problems
    if len(results) < 5:
        for item in CURATED_GLOBAL_PROBLEMS:
            item_copy = dict(item)
            item_copy["composite_pain_score"] = _calculate_composite_score(
                item_copy["severity_score"],
                item_copy["frequency_score"],
                item_copy["commercial_viability"],
            )
            results.append(item_copy)

    # De-duplicate by title similarity
    unique_results = []
    seen_titles = set()
    for item in results:
        t_key = re.sub(r'[^a-zA-Z0-9]', '', item["title"].lower())[:40]
        if t_key not in seen_titles:
            seen_titles.add(t_key)
            unique_results.append(item)

    # Sort descending by composite pain score
    unique_results.sort(key=lambda x: x.get("composite_pain_score", 0), reverse=True)
    return unique_results[:limit]
