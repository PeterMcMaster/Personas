from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Chat, ChatMessage, Persona
from schemas import (
    ChatDetailOut,
    ChatOut,
    CreateChatRequest,
    MessageOut,
    SendMessageRequest,
    SendMessageResponse,
)
from llm import build_persona_system_prompt, chat as llm_chat

router = APIRouter(tags=["chats"])


def _chat_out(chat: Chat) -> ChatOut:
    last = chat.messages[-1].content if chat.messages else None
    return ChatOut(
        id=chat.id,
        persona_id=chat.persona_id,
        created_at=chat.created_at,
        message_count=len(chat.messages),
        last_message=last,
    )


@router.post("/chats", response_model=ChatDetailOut, status_code=201)
def create_chat(payload: CreateChatRequest, db: Session = Depends(get_db)):
    persona = db.get(Persona, payload.persona_id)
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")
    chat = Chat(
        persona_id=payload.persona_id,
        created_at=datetime.now(timezone.utc),
    )
    db.add(chat)
    db.commit()
    db.refresh(chat)
    return ChatDetailOut(
        id=chat.id,
        persona_id=chat.persona_id,
        created_at=chat.created_at,
        messages=[],
    )


@router.get("/personas/{persona_id}/chats", response_model=list[ChatOut])
def list_chats(persona_id: int, db: Session = Depends(get_db)):
    persona = db.get(Persona, persona_id)
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")
    chats = (
        db.query(Chat)
        .filter(Chat.persona_id == persona_id)
        .order_by(Chat.created_at.desc())
        .all()
    )
    return [_chat_out(c) for c in chats]


@router.get("/chats/{chat_id}", response_model=ChatDetailOut)
def get_chat(chat_id: int, db: Session = Depends(get_db)):
    chat = db.get(Chat, chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return ChatDetailOut(
        id=chat.id,
        persona_id=chat.persona_id,
        created_at=chat.created_at,
        messages=[
            MessageOut(
                id=m.id, role=m.role, content=m.content, created_at=m.created_at
            )
            for m in chat.messages
        ],
    )


@router.delete("/chats/{chat_id}", status_code=204)
def delete_chat(chat_id: int, db: Session = Depends(get_db)):
    chat = db.get(Chat, chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    db.delete(chat)
    db.commit()


@router.post("/chats/{chat_id}/messages", response_model=SendMessageResponse)
async def send_message(
    chat_id: int, payload: SendMessageRequest, db: Session = Depends(get_db)
):
    chat = db.get(Chat, chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    persona = db.get(Persona, chat.persona_id)
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")

    now = datetime.now(timezone.utc)

    # Persist user message
    user_msg = ChatMessage(
        chat_id=chat_id, role="user", content=payload.content, created_at=now
    )
    db.add(user_msg)
    db.flush()

    # Build LLM message list from full persisted history
    system_prompt = build_persona_system_prompt(persona.name, persona.description)
    llm_messages = [{"role": "system", "content": system_prompt}]
    for m in chat.messages:
        llm_messages.append({"role": m.role, "content": m.content})

    reply_text = await llm_chat(llm_messages)

    # Persist assistant reply
    assistant_msg = ChatMessage(
        chat_id=chat_id,
        role="assistant",
        content=reply_text,
        created_at=datetime.now(timezone.utc),
    )
    db.add(assistant_msg)
    db.commit()
    db.refresh(user_msg)
    db.refresh(assistant_msg)

    return SendMessageResponse(
        user_message=MessageOut(
            id=user_msg.id,
            role=user_msg.role,
            content=user_msg.content,
            created_at=user_msg.created_at,
        ),
        assistant_message=MessageOut(
            id=assistant_msg.id,
            role=assistant_msg.role,
            content=assistant_msg.content,
            created_at=assistant_msg.created_at,
        ),
    )
