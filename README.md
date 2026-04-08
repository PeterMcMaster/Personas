# Personas

An interactive tool to create AI-powered personas, chat with them, and watch them debate each other.

## Features

- **Create** custom personas by describing a personality, or choose from famous historical figures
- **Chat** — have a one-on-one conversation with any saved persona
- **Arena** — pick two personas and watch them debate a topic automatically
- **Persistent** — personas are stored in a local SQLite database

## Stack

| Layer    | Tech                                     |
|----------|------------------------------------------|
| Frontend | Next.js (App Router) · TypeScript · Tailwind CSS |
| Backend  | FastAPI · SQLAlchemy · SQLite            |
| LLM      | OpenAI GPT-4o or Anthropic Claude (configurable) |

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

# Configure your LLM provider
cp .env.example .env
# Edit .env and set LLM_PROVIDER + the relevant API key

# Start the server
uvicorn main:app --reload
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

| Variable          | Description                           | Default  |
|-------------------|---------------------------------------|----------|
| `LLM_PROVIDER`    | `openai` or `anthropic`               | `stub`   |
| `OPENAI_API_KEY`  | Your OpenAI API key                   | —        |
| `ANTHROPIC_API_KEY` | Your Anthropic API key              | —        |

If no key is configured the backend runs in **stub mode**, returning placeholder responses so the UI is fully navigable without an API key.

### `frontend/.env.local`

| Variable              | Description             | Default                     |
|-----------------------|-------------------------|-----------------------------|
| `NEXT_PUBLIC_API_URL` | Backend base URL        | `http://localhost:8000`     |

---

## Project Structure

```
Personas/
├── backend/
│   ├── main.py          # FastAPI app entry point
│   ├── database.py      # SQLAlchemy engine + session
│   ├── models.py        # ORM models (Persona)
│   ├── schemas.py       # Pydantic request/response schemas
│   ├── llm.py           # Provider-agnostic LLM abstraction
│   ├── routers/
│   │   ├── personas.py  # CRUD endpoints
│   │   └── chat.py      # Chat + Arena endpoints
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── app/
    │   ├── layout.tsx        # Root layout with sidebar
    │   ├── page.tsx          # Dashboard (persona grid)
    │   ├── create/page.tsx   # Create persona
    │   ├── chat/[id]/page.tsx# Chat with a persona
    │   └── arena/page.tsx    # Arena (two personas debate)
    ├── components/
    │   ├── Sidebar.tsx
    │   ├── PersonaCard.tsx
    │   └── ChatBubble.tsx
    ├── lib/
    │   └── api.ts            # Typed API client
    └── .env.local.example
```

## API Reference

| Method | Path               | Description                       |
|--------|--------------------|-----------------------------------|
| GET    | `/personas`        | List all personas                 |
| POST   | `/personas`        | Create a persona                  |
| GET    | `/personas/{id}`   | Get a single persona              |
| DELETE | `/personas/{id}`   | Delete a persona                  |
| POST   | `/chat/{id}`       | Send a message to a persona       |
| POST   | `/arena`           | Run one arena turn between two personas |
| GET    | `/health`          | Health check                      |

Full interactive docs available at `http://localhost:8000/docs` when the backend is running.
