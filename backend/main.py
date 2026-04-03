"""
Axiom backend — FastAPI app entry point.
Runs on port 8000.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine
from routers import settings, infrastructure, agent_log, alerts, pipelines, finops, sidebar_counts, overview
from scheduler import start_scheduler
import contextlib


@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all DB tables on startup
    Base.metadata.create_all(bind=engine)
    # Start background scheduler
    start_scheduler()
    yield


app = FastAPI(title="Axiom Backend", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3010", "http://127.0.0.1:3010", "https://ops.akariyu.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(overview.router)
app.include_router(infrastructure.router)
app.include_router(agent_log.router)
app.include_router(alerts.router)
app.include_router(pipelines.router)
app.include_router(finops.router)
app.include_router(sidebar_counts.router)
app.include_router(settings.router)


@app.get("/health")
def health():
    return {"status": "ok"}
