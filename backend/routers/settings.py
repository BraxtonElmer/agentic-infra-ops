"""
GET /api/settings  — read persisted settings (with defaults)
PUT /api/settings  — save settings to DB
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db, AppSettings

router = APIRouter()

DEFAULTS = {
    "integrations": {
        "repos": [],
        "servers": [],
    },
    "llm": {
        "provider": "groq",
        "model": "llama-3.3-70b-versatile",
        "models": {
            "groq": ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"],
            "ollama": ["llama3.2", "codellama", "mistral"],
            "gemini": ["gemini-2.5-pro", "gemini-2.0-flash"],
        },
    },
    "thresholds": {
        "cpuWarning": 70,
        "cpuCritical": 90,
        "ramWarning": 75,
        "ramCritical": 90,
        "diskWarning": 80,
    },
    "agentBehavior": {
        "mode": "suggest",
        "autoOpenPRs": False,
        "autoTerminateStale": False,
        "webhookUrl": "",
    },
}

KEYS = ["integrations", "llm", "thresholds", "agentBehavior"]


def _read_all(db: Session) -> dict:
    rows = {r.key: r.value for r in db.query(AppSettings).all()}
    return {k: rows.get(k, DEFAULTS[k]) for k in KEYS}


def _upsert(db: Session, key: str, value):
    row = db.query(AppSettings).filter(AppSettings.key == key).first()
    if row:
        row.value = value
    else:
        db.add(AppSettings(key=key, value=value))
    db.commit()


@router.get("/api/settings")
def get_settings(db: Session = Depends(get_db)):
    return _read_all(db)


@router.put("/api/settings")
def save_settings(body: dict, db: Session = Depends(get_db)):
    for key in KEYS:
        if key in body:
            _upsert(db, key, body[key])
    return _read_all(db)
