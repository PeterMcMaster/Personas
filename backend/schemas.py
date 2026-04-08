from datetime import datetime
from typing import Literal
from pydantic import BaseModel


class PersonaCreate(BaseModel):
    name: str
    description: str
    type: Literal["custom", "famous"] = "custom"
    avatar_color: str = "#6366f1"


class PersonaOut(BaseModel):
    id: int
    name: str
    description: str
    type: str
    avatar_color: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []


class ChatResponse(BaseModel):
    reply: str


class ArenaRequest(BaseModel):
    persona_a_id: int
    persona_b_id: int
    topic: str = ""
    history: list[ChatMessage] = []
    next_speaker: Literal["a", "b"] = "a"


class ArenaResponse(BaseModel):
    speaker_id: int
    speaker_name: str
    reply: str
