"""
GET /api/alerts                      — active + history
PUT /api/alerts/{alert_id}/acknowledge
DELETE /api/alerts/{alert_id}        — dismiss
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db, Alert
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
