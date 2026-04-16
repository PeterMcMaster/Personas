from datetime import datetime, timezone
from sqlalchemy import ForeignKey, Integer, String, Text, DateTime, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base
import enum


class PersonaType(str, enum.Enum):
    custom = "custom"
    famous = "famous"


class Persona(Base):
    __tablename__ = "personas"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[PersonaType] = mapped_column(
        Enum(PersonaType), default=PersonaType.custom, nullable=False
    )
    avatar_color: Mapped[str] = mapped_column(String(20), nullable=False, default="#6366f1")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    chats: Mapped[list["Chat"]] = relationship(
        "Chat", cascade="all, delete-orphan", back_populates="persona"
    )
    arena_sessions_a: Mapped[list["ArenaSession"]] = relationship(
        "ArenaSession",
        foreign_keys="ArenaSession.persona_a_id",
        cascade="all, delete-orphan",
    )
    arena_sessions_b: Mapped[list["ArenaSession"]] = relationship(
        "ArenaSession",
        foreign_keys="ArenaSession.persona_b_id",
        cascade="all, delete-orphan",
    )


class Chat(Base):
    __tablename__ = "chats"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    persona_id: Mapped[int] = mapped_column(ForeignKey("personas.id"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    persona: Mapped["Persona"] = relationship("Persona", back_populates="chats")
    messages: Mapped[list["ChatMessage"]] = relationship(
        "ChatMessage", cascade="all, delete-orphan", order_by="ChatMessage.id"
    )


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    chat_id: Mapped[int] = mapped_column(ForeignKey("chats.id"), nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    chat: Mapped["Chat"] = relationship("Chat", back_populates="messages")


class ArenaSession(Base):
    __tablename__ = "arena_sessions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    persona_a_id: Mapped[int] = mapped_column(
        ForeignKey("personas.id"), nullable=False, index=True
    )
    persona_b_id: Mapped[int] = mapped_column(
        ForeignKey("personas.id"), nullable=False, index=True
    )
    topic: Mapped[str] = mapped_column(Text, nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    messages: Mapped[list["ArenaChatMessage"]] = relationship(
        "ArenaChatMessage", cascade="all, delete-orphan", order_by="ArenaChatMessage.id"
    )


class ArenaChatMessage(Base):
    __tablename__ = "arena_messages"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    session_id: Mapped[int] = mapped_column(
        ForeignKey("arena_sessions.id"), nullable=False, index=True
    )
    # -2 = user (human), -1 = system error, else persona id
    speaker_id: Mapped[int] = mapped_column(Integer, nullable=False)
    speaker_name: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    session: Mapped["ArenaSession"] = relationship("ArenaSession", back_populates="messages")
