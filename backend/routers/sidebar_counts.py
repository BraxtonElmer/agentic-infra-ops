"""
GET /api/sidebar-counts  — live badge counts for sidebar nav
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db, Alert, Pipeline, AgentLogEntry

router = APIRouter()


@router.get("/api/sidebar-counts")
def sidebar_counts(db: Session = Depends(get_db)):
    alerts_active = db.query(Alert).filter(Alert.status == "active").count()
    pipelines_failed = db.query(Pipeline).filter(Pipeline.status == "fail").count()
    infra_critical = db.query(Alert).filter(
        Alert.status == "active",
        Alert.severity == "critical",
    ).count()

    last_agent = (
        db.query(AgentLogEntry)
        .order_by(AgentLogEntry.timestamp.desc())
        .first()
    )
    agent_state = "scanning" if last_agent else "healthy"

    return {
        "pipelinesFailed": pipelines_failed,
        "infraCritical": infra_critical,
        "finopsWaste": "N/A",
        "alertsActive": alerts_active,
        "agentState": agent_state,
    }
