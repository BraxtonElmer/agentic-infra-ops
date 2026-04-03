"""
GET /api/overview  — aggregated dashboard data
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db, Alert, Pipeline, AgentLogEntry, ServerMetric, ContainerMetric
from datetime import datetime, timezone, timedelta

router = APIRouter()


@router.get("/api/overview")
def get_overview(db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # Active alerts
    active_alerts = (
        db.query(Alert)
        .filter(Alert.status == "active")
        .order_by(Alert.created_at.desc())
        .limit(5)
        .all()
    )
    alerts_count = len(active_alerts)
    critical_count = sum(1 for a in active_alerts if a.severity == "critical")

    # Agent actions today
    actions_today = (
        db.query(AgentLogEntry)
        .filter(AgentLogEntry.timestamp >= today)
        .count()
    )

    # Latest server metrics
    servers_raw = db.query(ServerMetric).order_by(ServerMetric.collected_at.desc()).limit(20).all()
    seen = set()
    servers = []
    for s in servers_raw:
        if s.server_id not in seen:
            seen.add(s.server_id)
            servers.append({
                "id": s.server_id,
                "name": s.name,
                "cpu": s.cpu,
                "ram": s.ram,
                "disk": s.disk,
            })

    # Health score: penalise critical/warning alerts and server load
    health_score = 100
    health_score -= critical_count * 15
    warning_count = sum(1 for a in active_alerts if a.severity == "warning")
    health_score -= warning_count * 5
    for s in servers:
        if s["cpu"] > 90 or s["ram"] > 90:
            health_score -= 10
    health_score = max(0, health_score)

    if health_score >= 80:
        health_status = "green"
    elif health_score >= 50:
        health_status = "amber"
    else:
        health_status = "red"

    # Recent agent log
    log_entries = (
        db.query(AgentLogEntry)
        .order_by(AgentLogEntry.timestamp.desc())
        .limit(6)
        .all()
    )

    def fmt_log(e):
        ts = e.timestamp
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        return {
            "id": e.entry_id,
            "timestamp": ts.strftime("%H:%M:%S"),
            "type": e.type,
            "target": e.target,
            "message": e.message,
        }

    # Recent pipelines
    recent_pipelines = (
        db.query(Pipeline)
        .order_by(Pipeline.triggered_at.desc())
        .limit(5)
        .all()
    )

    def fmt_pipeline(p):
        ts = p.triggered_at
        if ts and ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        return {
            "id": p.run_id,
            "repo": p.repo,
            "branch": p.branch,
            "status": p.status,
            "error": p.error,
            "duration": p.duration,
            "time": ts.strftime("%H:%M") if ts else "—",
            "insight": p.diagnosis.get("recommendation", "") if p.diagnosis else None,
        }

    return {
        "healthScore": health_score,
        "healthStatus": health_status,
        "monthlyWaste": "N/A",
        "activeIncidents": alerts_count,
        "agentActionsToday": actions_today,
        "alerts": [
            {
                "id": a.alert_id,
                "severity": a.severity,
                "title": a.title,
                "detail": a.assessment,
                "resource": a.resource,
            }
            for a in active_alerts
        ],
        "pipelines": [fmt_pipeline(p) for p in recent_pipelines],
        "agentLog": [fmt_log(e) for e in log_entries],
        "servers": servers,
        "finops": {
            "totalCost": "N/A",
            "totalWaste": "N/A",
            "services": [],
            "agentSavings": "N/A",
        },
    }
