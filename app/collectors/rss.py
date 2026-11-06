import logging
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime

import feedparser
import httpx

logger = logging.getLogger(__name__)


RSS_FEEDS = {
    "react-native": [
        "https://reactnative.dev/blog/rss.xml",
    ],

    "ai-llm": [
        "https://huggingface.co/blog/feed.xml",
    ],

    "agentic-ai": [],

    "automation": [
        "https://blog.n8n.io/rss/",
    ],
}


def parse_published(entry):

    parsed = entry.get("published_parsed")

    if parsed:
        return datetime(
            *parsed[:6],
            tzinfo=timezone.utc
        )

    published = entry.get("published")

    if published:
        try:
            return parsedate_to_datetime(published)
        except (TypeError, ValueError):
            pass

    return None


def fetch_rss_feeds():

    results = []

    with httpx.Client(timeout=30, follow_redirects=True) as client:

        for category, urls in RSS_FEEDS.items():

            for feed_url in urls:

                try:

                    response = client.get(feed_url)
                    response.raise_for_status()

                    feed = feedparser.parse(
                        response.content
                    )

                    for entry in feed.entries:

                        url = entry.get("link")

                        if not url:
                            continue

                        results.append({
                            "title": entry.get(
                                "title", "Untitled"
                            ),

                            "url": url,

                            "description": entry.get(
                                "summary", ""
                            ),

                            "source": "rss",

                            "category": category,

                            "published_at": parse_published(
                                entry
                            ),

                            "metadata": {
                                "feed_url": feed_url,
                                "author": entry.get(
                                    "author", ""
                                )
                            }
                        })

                    logger.info(
                        f"[RSS] {category}: {len(feed.entries)} entries"
                    )

                except Exception as error:

                    logger.warning(
                        f"[RSS ERROR] {feed_url}: {error}"
                    )

    return results