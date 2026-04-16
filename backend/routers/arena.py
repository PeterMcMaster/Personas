from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import ArenaChatMessage, ArenaSession, Persona
from schemas import (
    ArenaMsgOut,
    ArenaSessionDetailOut,
    ArenaSessionOut,
    CreateArenaSessionRequest,
    RunArenaTurnRequest,
    SaveArenaUserMessageRequest,
)
from llm import build_persona_system_prompt, chat as llm_chat

router = APIRouter(prefix="/arena", tags=["arena"])


def _session_out(session: ArenaSession) -> ArenaSessionOut:
    return ArenaSessionOut(
        id=session.id,
        persona_a_id=session.persona_a_id,
        persona_b_id=session.persona_b_id,
        topic=session.topic,
        created_at=session.created_at,
        message_count=len(session.messages),
    )


def _msg_out(msg: ArenaChatMessage) -> ArenaMsgOut:
    return ArenaMsgOut(
        id=msg.id,
        session_id=msg.session_id,
        speaker_id=msg.speaker_id,
        speaker_name=msg.speaker_name,
        content=msg.content,
        created_at=msg.created_at,
    )


@router.post("/sessions", response_model=ArenaSessionDetailOut, status_code=201)
def create_session(payload: CreateArenaSessionRequest, db: Session = Depends(get_db)):
    persona_a = db.get(Persona, payload.persona_a_id)
    persona_b = db.get(Persona, payload.persona_b_id)
    if not persona_a or not persona_b:
        raise HTTPException(status_code=404, detail="One or both personas not found")
    if payload.persona_a_id == payload.persona_b_id:
        raise HTTPException(status_code=422, detail="Personas must be different")

    session = ArenaSession(
        persona_a_id=payload.persona_a_id,
        persona_b_id=payload.persona_b_id,
        topic=payload.topic,
        created_at=datetime.now(timezone.utc),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return ArenaSessionDetailOut(
        id=session.id,
        persona_a_id=session.persona_a_id,
        persona_b_id=session.persona_b_id,
        topic=session.topic,
        created_at=session.created_at,
        messages=[],
    )


@router.get("/sessions/{session_id}", response_model=ArenaSessionDetailOut)
def get_session(session_id: int, db: Session = Depends(get_db)):
    session = db.get(ArenaSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Arena session not found")
    return ArenaSessionDetailOut(
        id=session.id,
        persona_a_id=session.persona_a_id,
        persona_b_id=session.persona_b_id,
        topic=session.topic,
        created_at=session.created_at,
        messages=[_msg_out(m) for m in session.messages],
    )


@router.get("/sessions", response_model=list[ArenaSessionOut])
def list_sessions(persona_id: int | None = None, db: Session = Depends(get_db)):
    q = db.query(ArenaSession)
    if persona_id is not None:
        q = q.filter(
            (ArenaSession.persona_a_id == persona_id)
            | (ArenaSession.persona_b_id == persona_id)
        )
    sessions = q.order_by(ArenaSession.created_at.desc()).all()
    return [_session_out(s) for s in sessions]


@router.delete("/sessions/{session_id}", status_code=204)
def delete_session(session_id: int, db: Session = Depends(get_db)):
    session = db.get(ArenaSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Arena session not found")
    db.delete(session)
    db.commit()


@router.post("/sessions/{session_id}/turns", response_model=ArenaMsgOut)
async def run_turn(
    session_id: int, payload: RunArenaTurnRequest, db: Session = Depends(get_db)
):
    session = db.get(ArenaSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Arena session not found")

    persona_a = db.get(Persona, session.persona_a_id)
    persona_b = db.get(Persona, session.persona_b_id)
    if not persona_a or not persona_b:
        raise HTTPException(status_code=404, detail="One or both personas no longer exist")

    speaker = persona_a if payload.next_speaker == "a" else persona_b
    listener = persona_b if payload.next_speaker == "a" else persona_a

    system_prompt = (
        build_persona_system_prompt(speaker.name, speaker.description)
        + f"\n\nYou are in a conversation with {listener.name}. "
        "Respond directly to them. Keep your reply to 2-3 sentences."
    )

    llm_messages: list[dict] = [{"role": "system", "content": system_prompt}]

    if session.topic and not session.messages:
        llm_messages.append(
            {"role": "user", "content": f"The topic of conversation is: {session.topic}. Start talking."}
        )
    else:
        for m in session.messages:
            llm_messages.append({"role": "user", "content": f"{m.speaker_name}: {m.content}"})

    reply_text = await llm_chat(llm_messages)

    msg = ArenaChatMessage(
        session_id=session_id,
        speaker_id=speaker.id,
        speaker_name=speaker.name,
        content=reply_text,
        created_at=datetime.now(timezone.utc),
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return _msg_out(msg)


@router.post("/sessions/{session_id}/user-messages", response_model=ArenaMsgOut)
def save_user_message(
    session_id: int, payload: SaveArenaUserMessageRequest, db: Session = Depends(get_db)
):
    session = db.get(ArenaSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Arena session not found")

    msg = ArenaChatMessage(
        session_id=session_id,
        speaker_id=-2,
        speaker_name="You",
        content=payload.content,
        created_at=datetime.now(timezone.utc),
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return _msg_out(msg)
