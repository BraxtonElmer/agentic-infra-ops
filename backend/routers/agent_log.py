"""
GET /api/agent-log        — all agent log entries
POST /api/agent-log/scan  — manually trigger an LLM scan
"""
from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from database import get_db, AgentLogEntry, ServerMetric, ContainerMetric
from services import llm_service, alert_engine
import uuid
from datetime import datetime, timezone

router = APIRouter()


def _format_entry(e: AgentLogEntry) -> dict:
    ts = e.timestamp
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)
    entry = {
        "id": e.entry_id,
        "timestamp": ts.strftime("%H:%M:%S"),
        "type": e.type,
        "target": e.target,
        "message": e.message,
        "reasoning": e.reasoning,
    }
    if e.extra:
        entry.update(e.extra)
    return entry


@router.get("/api/agent-log")
def get_agent_log(db: Session = Depends(get_db)):
    entries = (
        db.query(AgentLogEntry)
        .order_by(AgentLogEntry.timestamp.desc())
        .limit(50)
        .all()
    )
    return {"entries": [_format_entry(e) for e in entries]}


def _run_infra_scan(db: Session):
    """Run LLM analysis on latest metrics and persist findings."""
    servers_raw = db.query(ServerMetric).order_by(ServerMetric.collected_at.desc()).limit(10).all()
    containers_raw = db.query(ContainerMetric).order_by(ContainerMetric.collected_at.desc()).limit(20).all()

    servers = [{"name": s.name, "cpu": s.cpu, "ram": s.ram, "disk": s.disk} for s in servers_raw]
    containers = [{"name": c.name, "status": c.status, "cpu": c.cpu, "ram": c.ram} for c in containers_raw]

    # Add a summary entry
    summary = AgentLogEntry(
        entry_id=str(uuid.uuid4()),
        type="scan",
        target="infrastructure",
        message=f"Infrastructure scan initiated — {len(servers)} servers, {len(containers)} containers.",
        reasoning="Manual scan triggered via API.",
    )
    db.add(summary)
    db.commit()

    findings = llm_service.analyze_infrastructure(servers, containers)
    for f in findings:
        entry_data = llm_service.make_log_entry(f)
        entry = AgentLogEntry(**entry_data)
        db.add(entry)
        db.commit()
        if f.get("severity") in ("critical", "warning"):
            alert_engine.create_from_llm_finding(db, f)


@router.post("/api/agent-log/scan")
def trigger_scan(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    background_tasks.add_task(_run_infra_scan, db)
    return {"status": "scan started"}
