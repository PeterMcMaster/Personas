from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Persona
from schemas import ChatRequest, ChatResponse, ArenaRequest, ArenaResponse
from llm import build_persona_system_prompt, chat

router = APIRouter(tags=["chat"])


@router.post("/chat/{persona_id}", response_model=ChatResponse)
async def chat_with_persona(
    persona_id: int,
    payload: ChatRequest,
    db: Session = Depends(get_db),
):
    persona = db.get(Persona, persona_id)
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")

    system_prompt = build_persona_system_prompt(persona.name, persona.description)
    messages = [{"role": "system", "content": system_prompt}]
    for msg in payload.history:
        messages.append({"role": msg.role, "content": msg.content})
    messages.append({"role": "user", "content": payload.message})

    reply = await chat(messages)
    return ChatResponse(reply=reply)


@router.post("/arena", response_model=ArenaResponse)
async def arena_turn(payload: ArenaRequest, db: Session = Depends(get_db)):
    persona_a = db.get(Persona, payload.persona_a_id)
    persona_b = db.get(Persona, payload.persona_b_id)
    if not persona_a or not persona_b:
        raise HTTPException(status_code=404, detail="One or both personas not found")

    # Determine whose turn it is
    if payload.next_speaker == "a":
        speaker, listener = persona_a, persona_b
    else:
        speaker, listener = persona_b, persona_a

    system_prompt = (
        build_persona_system_prompt(speaker.name, speaker.description)
        + f"\n\nYou are in a conversation with {listener.name}. "
        "Respond directly to them. Keep your reply to 2-3 sentences."
    )

    messages: list[dict] = [{"role": "system", "content": system_prompt}]

    if payload.topic and not payload.history:
        messages.append(
            {"role": "user", "content": f"The topic of conversation is: {payload.topic}. Start talking."}
        )
    else:
        for msg in payload.history:
            messages.append({"role": msg.role, "content": msg.content})

    reply = await chat(messages)
    return ArenaResponse(
        speaker_id=speaker.id,
        speaker_name=speaker.name,
        reply=reply,
    )
