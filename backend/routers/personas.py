from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Persona, PersonaType
from schemas import FamousPersonRequest, PersonaCreate, PersonaOut
from llm import verify_famous_person
from search import search_famous_person

router = APIRouter(prefix="/personas", tags=["personas"])


@router.get("", response_model=list[PersonaOut])
def list_personas(db: Session = Depends(get_db)):
    return db.query(Persona).order_by(Persona.created_at.desc()).all()


@router.post("", response_model=PersonaOut, status_code=201)
def create_persona(payload: PersonaCreate, db: Session = Depends(get_db)):
    persona = Persona(**payload.model_dump())
    db.add(persona)
    db.commit()
    db.refresh(persona)
    return persona


@router.post("/famous", response_model=PersonaOut, status_code=201)
async def create_famous_persona(payload: FamousPersonRequest, db: Session = Depends(get_db)):
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="Name must not be empty.")

    # Step 1: verify the name is a real public figure
    verification = await verify_famous_person(name)
    if not verification.get("verified"):
        raise HTTPException(
            status_code=422,
            detail=f'"{name}" could not be recognised as a real public figure. Please try a different name.',
        )

    canonical_name: str = verification.get("canonical_name") or name
    brief: str = verification.get("brief") or ""

    # Step 2: fetch biographical context from Tavily
    bio_context = await search_famous_person(canonical_name)

    # Step 3: assemble description — brief from LLM + rich web context
    parts = [p for p in [brief, bio_context] if p]
    description = "\n\n".join(parts) if parts else f"{canonical_name} is a famous public figure."

    # Step 4: pick a deterministic avatar colour from the name
    _COLORS = [
        "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
        "#f97316", "#eab308", "#22c55e", "#14b8a6", "#3b82f6",
    ]
    avatar_color = _COLORS[sum(ord(c) for c in canonical_name) % len(_COLORS)]

    persona = Persona(
        name=canonical_name,
        description=description,
        type=PersonaType.famous,
        avatar_color=avatar_color,
    )
    db.add(persona)
    db.commit()
    db.refresh(persona)
    return persona


@router.get("/{persona_id}", response_model=PersonaOut)
def get_persona(persona_id: int, db: Session = Depends(get_db)):
    persona = db.get(Persona, persona_id)
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")
    return persona


@router.delete("/{persona_id}", status_code=204)
def delete_persona(persona_id: int, db: Session = Depends(get_db)):
    persona = db.get(Persona, persona_id)
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found")
    db.delete(persona)
    db.commit()
