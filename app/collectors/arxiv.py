from datetime import datetime, timezone

import feedparser
import httpx


ARXIV_API = "https://export.arxiv.org/api/query"

SEARCH_QUERIES = {
    "ai-llm": (
        "cat:cs.AI OR cat:cs.CL OR cat:cs.LG"
    ),

    "agentic-ai": (
        'all:"AI agents" OR all:"multi-agent systems"'
    ),

    "automation": (
        'all:"workflow automation" OR all:"task planning"'
    ),

    "developer-tools": (
        "cat:cs.SE"
    ),
}


def parse_arxiv_date(value):

    if not value:
        return None

    try:
        return datetime.fromisoformat(
            value.replace("Z", "+00:00")
        )
    except ValueError:
        return None


def fetch_arxiv_papers():

    results = []

    with httpx.Client(timeout=45) as client:

        for category, query in SEARCH_QUERIES.items():

            try:

                response = client.get(
                    ARXIV_API,
                    params={
                        "search_query": query,
                        "start": 0,
                        "max_results": 15,
                        "sortBy": "submittedDate",
                        "sortOrder": "descending",
                    }
                )

                response.raise_for_status()

                feed = feedparser.parse(
                    response.content
                )

                for entry in feed.entries:

                    authors = [
                        author.name
                        for author in entry.get(
                            "authors", []
                        )
                    ]

                    results.append({

                        "title": entry.title.replace(
                            "\n", " "
                        ).strip(),

                        "url": entry.link,

                        "description": entry.get(
                            "summary", ""
                        ).strip(),

                        "source": "arxiv",

                        "category": category,

                        "published_at": parse_arxiv_date(
                            entry.get("published")
                        ),

                        "metadata": {
                            "authors": authors,
                            "paper_id": entry.get("id"),
                            "updated": entry.get("updated"),
                        }
                    })

                print(
                    f"[ARXIV] {category}: "
                    f"{len(feed.entries)} papers"
                )

            except Exception as error:

                print(
                    f"[ARXIV ERROR] {category}: {error}"
                )

    return results