# Personas

An interactive tool to create AI-powered personas, chat with them, and watch them debate each other.

## Features

- **Custom personas** — describe any personality and bring it to life
- **Famous person lookup** — type any real public figure's name; the LLM verifies them and Tavily fetches a live biography so the persona has genuine context
- **Chat** — have a one-on-one conversation with any saved persona; full conversation history is persisted and restored across sessions
- **Arena** — pick two personas and watch them debate a topic; step through turns manually and inject your own messages; past debates are saved and resumable
- **Persistent** — all personas, chats, and arena sessions are stored in a local SQLite database; deleting a persona cascades to all its chats and arena sessions

## Stack

| Layer    | Tech                                     |
|----------|------------------------------------------|
| Frontend | Next.js (App Router) · TypeScript · Tailwind CSS |
| Backend  | FastAPI · SQLAlchemy · SQLite            |
| LLM      | OpenAI GPT-4o or Anthropic Claude (configurable) |
| Search   | Tavily (famous person biography lookup)  |

---

## Quick Start

### 1. Backend

```bash
cd backend

# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure your LLM provider and Tavily
cp .env.example .env
# Edit .env and set LLM_PROVIDER, the relevant API key, and TAVILY_API_KEY

# Start the server
python3 main.py
# → http://localhost:8000
# → Docs: http://localhost:8000/docs
```

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
# → http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

### `backend/.env`

| Variable            | Description                                      | Default  |
|---------------------|--------------------------------------------------|----------|
| `LLM_PROVIDER`      | `openai` or `anthropic`                          | `stub`   |
| `OPENAI_API_KEY`    | Your OpenAI API key                              | —        |
| `ANTHROPIC_API_KEY` | Your Anthropic API key                           | —        |
| `TAVILY_API_KEY`    | Your Tavily API key (for famous person lookup)   | —        |

If no LLM key is configured the backend runs in **stub mode** — placeholder responses are returned so the UI is fully navigable. Famous person lookup still works in stub mode as long as `TAVILY_API_KEY` is set; name verification is skipped and the Tavily bio is used directly.

Get a free Tavily key (1,000 credits/month) at [tavily.com](https://tavily.com).

### `frontend/.env.local`

| Variable              | Description             | Default                     |
|-----------------------|-------------------------|-----------------------------|
| `NEXT_PUBLIC_API_URL` | Backend base URL        | `http://localhost:8000`     |

---

## Famous Person Lookup

When you select the **Famous Person** tab on the Create page:

1. Type any real public figure's name (historical or contemporary).
2. The backend asks the LLM to verify the name and return the canonical form.
3. Tavily searches the web and returns a biographical summary.
4. The bio is stored as the persona's description in the database.
5. Every subsequent chat automatically uses the real biographical context in its system prompt — no extra configuration needed.

If the LLM cannot identify the person as a real public figure, a clear error is shown before anything is saved.

---

## Project Structure

```
Personas/
├── backend/
│   ├── main.py          # FastAPI app entry point
│   ├── database.py      # SQLAlchemy engine + session
│   ├── models.py        # ORM models (Persona, Chat, ArenaSession, …)
│   ├── schemas.py       # Pydantic request/response schemas
│   ├── llm.py           # Provider-agnostic LLM abstraction + verification
│   ├── search.py        # Tavily web-search integration
│   ├── routers/
│   │   ├── personas.py  # Persona CRUD + POST /personas/famous
│   │   ├── chat.py      # Chat session endpoints
│   │   └── arena.py     # Arena session endpoints
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── app/
    │   ├── layout.tsx              # Root layout with sidebar
    │   ├── page.tsx                # Dashboard (persona grid)
    │   ├── create/page.tsx         # Create persona (custom or famous lookup)
    │   ├── chat/[id]/page.tsx      # Chat session list for a persona
    │   ├── chat/[id]/[session_id]/ # Individual chat session view
    │   └── arena/page.tsx          # Arena (debate + history)
    ├── components/
    │   ├── Sidebar.tsx
    │   ├── PersonaCard.tsx
    │   └── ChatBubble.tsx
    ├── lib/
    │   └── api.ts                  # Typed API client
    └── .env.local.example
```

## API Reference

### Personas

| Method | Path                | Description                                       |
|--------|---------------------|---------------------------------------------------|
| GET    | `/personas`         | List all personas                                 |
| POST   | `/personas`         | Create a custom persona                           |
| POST   | `/personas/famous`  | Verify a famous person, fetch bio, create persona |
| GET    | `/personas/{id}`    | Get a single persona                              |
| DELETE | `/personas/{id}`    | Delete persona + all its chats and arena sessions |

### Chat Sessions

| Method | Path                        | Description                                  |
|--------|-----------------------------|----------------------------------------------|
| POST   | `/chats`                    | Create a new chat session                    |
| GET    | `/personas/{id}/chats`      | List chat sessions for a persona             |
| GET    | `/chats/{id}`               | Get a session with full message history      |
| POST   | `/chats/{id}/messages`      | Send a message; LLM reply saved and returned |
| DELETE | `/chats/{id}`               | Delete a chat session and its messages       |

### Arena Sessions

| Method | Path                                    | Description                              |
|--------|-----------------------------------------|------------------------------------------|
| POST   | `/arena/sessions`                       | Create a new arena session               |
| GET    | `/arena/sessions`                       | List all sessions (filter by persona_id) |
| GET    | `/arena/sessions/{id}`                  | Get a session with full message history  |
| DELETE | `/arena/sessions/{id}`                  | Delete a session and its messages        |
| POST   | `/arena/sessions/{id}/turns`            | Run one LLM turn and save it             |
| POST   | `/arena/sessions/{id}/user-messages`    | Save a user-injected message             |

### Other

| Method | Path       | Description  |
|--------|------------|--------------|
| GET    | `/health`  | Health check |

Full interactive docs available at `http://localhost:8000/docs` when the backend is running.
