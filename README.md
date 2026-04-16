# Personas

An interactive tool to create AI-powered personas, chat with them, and watch them debate each other.

## Features

- **Custom personas** — describe any personality and bring it to life
- **Famous person lookup** — type any real public figure's name; the LLM verifies them and Tavily fetches a live biography so the persona has genuine context
- **Chat** — have a one-on-one conversation with any saved persona
- **Arena** — pick two personas and watch them debate a topic automatically
- **Persistent** — personas are stored in a local SQLite database

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
│   ├── models.py        # ORM models (Persona)
│   ├── schemas.py       # Pydantic request/response schemas
│   ├── llm.py           # Provider-agnostic LLM abstraction + verification
│   ├── search.py        # Tavily web-search integration
│   ├── routers/
│   │   ├── personas.py  # CRUD endpoints + POST /personas/famous
│   │   └── chat.py      # Chat + Arena endpoints
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── app/
    │   ├── layout.tsx        # Root layout with sidebar
    │   ├── page.tsx          # Dashboard (persona grid)
    │   ├── create/page.tsx   # Create persona (custom or famous lookup)
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

| Method | Path                | Description                                        |
|--------|---------------------|----------------------------------------------------|
| GET    | `/personas`         | List all personas                                  |
| POST   | `/personas`         | Create a custom persona                            |
| POST   | `/personas/famous`  | Verify a famous person, fetch bio, create persona  |
| GET    | `/personas/{id}`    | Get a single persona                               |
| DELETE | `/personas/{id}`    | Delete a persona                                   |
| POST   | `/chat/{id}`        | Send a message to a persona                        |
| POST   | `/arena`            | Run one arena turn between two personas            |
| GET    | `/health`           | Health check                                       |

Full interactive docs available at `http://localhost:8000/docs` when the backend is running.
