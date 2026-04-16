"""
Tavily web-search integration for fetching famous-person biographies.

Requires TAVILY_API_KEY in the environment (.env).
"""

import os
from dotenv import load_dotenv

load_dotenv()

TAVILY_KEY = os.getenv("TAVILY_API_KEY", "")

# Max characters of Tavily context we pass to the LLM
_MAX_CONTEXT_CHARS = 2000


async def search_famous_person(name: str) -> str:
    """
    Search the web for biographical information about *name* and return a
    compact, LLM-friendly context string (≤ _MAX_CONTEXT_CHARS chars).

    Falls back to an empty string if no API key is configured.
    """
    if not TAVILY_KEY:
        return ""

    from tavily import AsyncTavilyClient

    client = AsyncTavilyClient(api_key=TAVILY_KEY)

    query = f"{name} biography life works major achievements historical significance"
    context: str = await client.get_search_context(
        query=query,
        search_depth="advanced",
        max_tokens=600,  # Tavily token budget for snippets
    )

    # Trim to our character budget to keep the system prompt manageable
    if len(context) > _MAX_CONTEXT_CHARS:
        context = context[:_MAX_CONTEXT_CHARS].rsplit(" ", 1)[0] + "…"

    return context
