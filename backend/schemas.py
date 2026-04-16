from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel


# ---------------------------------------------------------------------------
# Persona schemas
# ---------------------------------------------------------------------------

class FamousPersonRequest(BaseModel):
    name: str


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


# ---------------------------------------------------------------------------
# Persona chat schemas
# ---------------------------------------------------------------------------

class CreateChatRequest(BaseModel):
    persona_id: int


class MessageOut(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatOut(BaseModel):
    id: int
    persona_id: int
    created_at: datetime
    message_count: int
    last_message: Optional[str] = None

    model_config = {"from_attributes": True}


class ChatDetailOut(BaseModel):
    id: int
    persona_id: int
    created_at: datetime
    messages: list[MessageOut]

    model_config = {"from_attributes": True}


class SendMessageRequest(BaseModel):
    content: str


class SendMessageResponse(BaseModel):
    user_message: MessageOut
    assistant_message: MessageOut


# ---------------------------------------------------------------------------
# Arena schemas
# ---------------------------------------------------------------------------

class CreateArenaSessionRequest(BaseModel):
    persona_a_id: int
    persona_b_id: int
    topic: str = ""


class ArenaMsgOut(BaseModel):
    id: int
    session_id: int
    speaker_id: int
    speaker_name: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ArenaSessionOut(BaseModel):
    id: int
    persona_a_id: int
    persona_b_id: int
    topic: str
    created_at: datetime
    message_count: int

    model_config = {"from_attributes": True}


class ArenaSessionDetailOut(BaseModel):
    id: int
    persona_a_id: int
    persona_b_id: int
    topic: str
    created_at: datetime
    messages: list[ArenaMsgOut]

    model_config = {"from_attributes": True}


class RunArenaTurnRequest(BaseModel):
    next_speaker: Literal["a", "b"]


class SaveArenaUserMessageRequest(BaseModel):
    content: str


# ---------------------------------------------------------------------------
# Legacy — kept for internal LLM helpers only
# ---------------------------------------------------------------------------

class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str
