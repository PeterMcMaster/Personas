"""
Provider-agnostic LLM abstraction.

Set LLM_PROVIDER in .env to "openai" or "anthropic".
The corresponding API key must also be set.
When no key is configured the stub implementation is used.
"""

import os
from typing import TypedDict
from dotenv import load_dotenv

load_dotenv()

PROVIDER = os.getenv("LLM_PROVIDER", "stub").lower()
OPENAI_KEY = os.getenv("OPENAI_API_KEY", "")
ANTHROPIC_KEY = os.getenv("ANTHROPIC_API_KEY", "")


class Message(TypedDict):
    role: str   # "system" | "user" | "assistant"
    content: str


async def chat(messages: list[Message]) -> str:
    """Send a list of messages to the configured LLM and return the reply."""
    if PROVIDER == "openai" and OPENAI_KEY:
        return await _openai_chat(messages)
    if PROVIDER == "anthropic" and ANTHROPIC_KEY:
        return await _anthropic_chat(messages)
    return _stub_chat(messages)


async def _openai_chat(messages: list[Message]) -> str:
    from openai import AsyncOpenAI

    client = AsyncOpenAI(api_key=OPENAI_KEY)
    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=messages,  # type: ignore[arg-type]
        max_tokens=512,
    )
    return response.choices[0].message.content or ""


async def _anthropic_chat(messages: list[Message]) -> str:
    import anthropic

    system_messages = [m["content"] for m in messages if m["role"] == "system"]
    conversation = [m for m in messages if m["role"] != "system"]

    client = anthropic.AsyncAnthropic(api_key=ANTHROPIC_KEY)
    response = await client.messages.create(
        model="claude-opus-4-5",
        max_tokens=512,
        system="\n".join(system_messages) if system_messages else anthropic.NOT_GIVEN,
        messages=conversation,  # type: ignore[arg-type]
    )
    block = response.content[0]
    return block.text if hasattr(block, "text") else ""


def _stub_chat(messages: list[Message]) -> str:
    """Fallback when no LLM provider is configured."""
    last_user = next(
        (m["content"] for m in reversed(messages) if m["role"] == "user"), ""
    )
    return (
        f"[Stub response] I received your message: \"{last_user}\". "
        "Configure LLM_PROVIDER and the corresponding API key in backend/.env to enable real responses."
    )


def build_persona_system_prompt(name: str, description: str) -> str:
    return (
        f"You are {name}. {description}\n\n"
        "Stay fully in character. Respond naturally as this persona would, "
        "using their distinctive voice, knowledge, and mannerisms. "
        "Keep responses concise (2-4 sentences) unless a longer answer is clearly warranted."
    )
