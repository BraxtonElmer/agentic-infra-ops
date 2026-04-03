"""
GET /api/sidebar-counts  — live badge counts for sidebar nav
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db, Alert, Pipeline, AgentLogEntry, ContainerMetric

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

    # Compute real finops waste from idle containers
    containers_raw = (
        db.query(ContainerMetric)
        .order_by(ContainerMetric.collected_at.desc())
        .limit(30)
        .all()
    )
    seen: set = set()
    idle_count = 0
    for c in containers_raw:
        if c.container_id not in seen:
            seen.add(c.container_id)
            if c.status in ("idle", "zombie"):
                idle_count += 1

    waste_inr = round(idle_count * 0.84 * 730)
    if waste_inr >= 1000:
        finops_waste = f"₹{waste_inr / 1000:.1f}k"
    elif waste_inr > 0:
        finops_waste = f"₹{waste_inr}"
    else:
        finops_waste = "₹0"

    return {
        "pipelinesFailed": pipelines_failed,
        "infraCritical": infra_critical,
        "finopsWaste": finops_waste,
        "alertsActive": alerts_active,
        "agentState": agent_state,
    }
