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

    # ── FinOps from real container + server data ─────────────────────────────
    containers_raw = db.query(ContainerMetric).order_by(ContainerMetric.collected_at.desc()).limit(30).all()
    seen_c: set = set()
    containers_list = []
    for c in containers_raw:
        if c.container_id not in seen_c:
            seen_c.add(c.container_id)
            containers_list.append(c)

    running_c = [c for c in containers_list if c.status == "running"]
    idle_c = [c for c in containers_list if c.status in ("idle", "zombie")]

    # Rough estimates: Oracle A1.Flex is free-tier but we show resource cost proxies in INR
    # ₹0.84/container/hour × 730h/mo ≈ ₹613/mo per container (rough placeholder)
    HOURS = 730
    CONT_INR_H = 0.84
    SERVER_INR_H = 4.17

    server_mo = round(SERVER_INR_H * HOURS)
    running_mo = round(len(running_c) * CONT_INR_H * HOURS)
    idle_mo = round(len(idle_c) * CONT_INR_H * HOURS)
    total_mo = server_mo + running_mo + idle_mo
    waste_mo = idle_mo

    def _inr(n: int) -> str:
        return f"₹{n:,}" if n >= 1000 else f"₹{n}"

    finops_services = [
        {"name": "Compute (Server)", "cost": server_mo, "waste": 0, "total": server_mo},
    ]
    if running_mo > 0:
        finops_services.append({"name": f"Containers ({len(running_c)} running)", "cost": running_mo, "waste": 0, "total": running_mo})
    if idle_mo > 0:
        finops_services.append({"name": f"Containers ({len(idle_c)} idle)", "cost": idle_mo, "waste": idle_mo, "total": idle_mo})

    if idle_c:
        agent_savings = f"Agent identified {len(idle_c)} idle container(s). Potential saving: {_inr(waste_mo)}/mo."
    else:
        agent_savings = "No idle resources detected."

    return {
        "healthScore": health_score,
        "healthStatus": health_status,
        "monthlyWaste": _inr(waste_mo),
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
            "totalCost": _inr(total_mo),
            "totalWaste": _inr(waste_mo),
            "services": finops_services,
            "agentSavings": agent_savings,
        },
    }

