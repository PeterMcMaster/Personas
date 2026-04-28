from fastapi import FastAPI
import os
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine
from routers import personas, chat
from routers import arena

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Personas API", version="0.1.0")

origins = [
    "http://localhost:3000",
]

frontend_url = os.getenv("FRONTEND_URL")
if frontend_url == "*":
    origins = ["*"]
elif frontend_url:
    origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=frontend_url != "*",
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(personas.router)
app.include_router(chat.router)
app.include_router(arena.router)


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
