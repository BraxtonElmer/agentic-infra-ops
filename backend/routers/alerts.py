"""
GET /api/alerts                      — active + history
PUT /api/alerts/{alert_id}/acknowledge
DELETE /api/alerts/{alert_id}        — dismiss
POST /api/alerts/{alert_id}/auto-fix — agent stops container + resolves alert
"""
import uuid
import docker
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db, Alert, AgentLogEntry, ContainerMetric
from datetime import datetime, timezone

router = APIRouter()


def _fmt_active(a: Alert) -> dict:
    return {
        "id": a.alert_id,
        "severity": a.severity,
        "title": a.title,
        "resource": a.resource,
        "timestamp": a.created_at.isoformat() if a.created_at else None,
        "assessment": a.assessment,
        "recommendation": a.recommendation,
    }


def _fmt_history(a: Alert) -> dict:
    return {
        "id": a.alert_id,
        "title": a.title,
        "severity": a.severity,
        "resolvedAt": a.resolved_at.isoformat() if a.resolved_at else None,
        "resolvedBy": a.resolved_by or "agent",
        "action": a.resolve_action or "Resolved.",
    }


@router.get("/api/alerts")
def get_alerts(db: Session = Depends(get_db)):
    active = db.query(Alert).filter(Alert.status == "active").order_by(Alert.created_at.desc()).all()
    history = db.query(Alert).filter(Alert.status != "active").order_by(Alert.resolved_at.desc()).limit(20).all()
    return {
        "active": [_fmt_active(a) for a in active],
        "history": [_fmt_history(a) for a in history],
    }


@router.put("/api/alerts/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: str, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status = "acknowledged"
    alert.resolved_at = datetime.now(timezone.utc)
    alert.resolved_by = "manual"
    alert.resolve_action = "Acknowledged by user."
    db.commit()
    return {"status": "acknowledged"}


@router.delete("/api/alerts/{alert_id}")
def dismiss_alert(alert_id: str, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status = "dismissed"
    alert.resolved_at = datetime.now(timezone.utc)
    alert.resolved_by = "manual"
    alert.resolve_action = "Dismissed by user."
    db.commit()
    return {"status": "dismissed"}


@router.post("/api/alerts/{alert_id}/auto-fix")
def auto_fix_alert(alert_id: str, db: Session = Depends(get_db)):
    """Agentic auto-fix: stops the idle container referenced by the alert."""
    alert = db.query(Alert).filter(Alert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    if alert.status != "active":
        raise HTTPException(status_code=400, detail="Alert is already resolved")

    container_name = alert.resource
    action_detail = ""

    # Attempt to stop the container via Docker
    try:
        client = docker.from_env()
        matches = [c for c in client.containers.list(all=True) if c.name == container_name]
        if not matches:
            raise HTTPException(status_code=404, detail=f"Container '{container_name}' not found")
        container = matches[0]
        if container.status == "running":
            container.stop(timeout=10)
            action_detail = f"Stopped running container '{container_name}'."
        else:
            action_detail = f"Container '{container_name}' was already stopped (status: {container.status})."
    except docker.errors.APIError as e:
        raise HTTPException(status_code=500, detail=f"Docker error: {e.explanation}")

    # Resolve the alert
    alert.status = "resolved"
    alert.resolved_at = datetime.now(timezone.utc)
    alert.resolved_by = "agent"
    alert.resolve_action = f"Auto-fixed: {action_detail}"

    # Create agent log entry
    log_entry = AgentLogEntry(
        entry_id=str(uuid.uuid4()),
        timestamp=datetime.now(timezone.utc),
        type="fix",
        target=container_name,
        message=f"Auto-fix applied: {action_detail}",
        reasoning=f"Alert '{alert.title}' flagged resource '{container_name}'. "
                  f"Agent determined the container could be safely stopped to free resources and reduce waste.",
    )
    db.add(log_entry)

    # Immediately update ContainerMetric so the infrastructure page reflects
    # the stopped state on the next SWR poll without waiting for the scheduler
    cm = db.query(ContainerMetric).filter(ContainerMetric.name == container_name).first()
    if cm:
        cm.status = "stopped"
        cm.cpu = 0.0

    db.commit()

    return {
        "status": "resolved",
        "action": action_detail,
        "alertId": alert_id,
        "container": container_name,
    }
