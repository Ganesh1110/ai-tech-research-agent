from datetime import datetime, timedelta, timezone

import httpx

from app.config import settings


GITHUB_API = "https://api.github.com/search/repositories"


TOPICS = {
    "react-native": "react-native",
    "ai-llm": "llm OR language-model OR inference",
    "agentic-ai": "ai-agent OR agentic-ai OR multi-agent",
    "automation": "workflow-automation OR automation",
    "mcp-skills": "model-context-protocol OR mcp-server",
    "developer-tools": "developer-tools OR devtools",
    "open-source": "open-source",
}


def get_headers():

    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }

    if settings.GITHUB_TOKEN:
        headers["Authorization"] = (
            f"Bearer {settings.GITHUB_TOKEN}"
        )

    return headers


def fetch_github_repositories():

    results = []

    since = (
        datetime.now(timezone.utc)
        - timedelta(days=settings.RESEARCH_DAYS)
    ).strftime("%Y-%m-%d")

    with httpx.Client(
        timeout=30,
        headers=get_headers()
    ) as client:

        for category, query in TOPICS.items():

            params = {
                "q": f"{query} created:>={since}",
                "sort": "created",
                "order": "desc",
                "per_page": settings.GITHUB_RESULTS_PER_TOPIC,
            }

            try:

                response = client.get(
                    GITHUB_API,
                    params=params
                )

                response.raise_for_status()

                data = response.json()

                for repo in data.get("items", []):

                    results.append({
                        "title": repo["full_name"],

                        "url": repo["html_url"],

                        "description": (
                            repo.get("description") or ""
                        ),

                        "source": "github",

                        "category": category,

                        "published_at": (
                            datetime.fromisoformat(
                                repo["created_at"].replace(
                                    "Z", "+00:00"
                                )
                            )
                        ),

                        "metadata": {
                            "stars": repo["stargazers_count"],
                            "forks": repo["forks_count"],
                            "language": repo.get("language"),
                            "topics": repo.get("topics", []),
                            "owner": repo["owner"]["login"],
                            "updated_at": repo["updated_at"],
                        }
                    })

                print(
                    f"[GITHUB] {category}: "
                    f"{len(data.get('items', []))} repositories"
                )

            except httpx.HTTPError as error:

                print(
                    f"[GITHUB ERROR] {category}: {error}"
                )

    return results