"""
GET /api/finops  — resource usage and LLM-identified waste from current server/containers
No cloud billing API needed — derives cost estimates from actual resource consumption.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db, ServerMetric, ContainerMetric, AgentLogEntry
from datetime import datetime, timezone, timedelta

router = APIRouter()

# Rough cost rates (Oracle Cloud free tier is $0, but for paid ARM shapes):
# A1.Flex: ~$0.01/OCPU-hour, ~$0.006/GB-hour
# We use a simple per-container/per-server heuristic for "Estimated Cost"
_CONTAINER_COST_PER_HOUR = 0.01   # USD — placeholder
_SERVER_COST_PER_HOUR = 0.05      # USD — placeholder for the server


def _rupees(usd: float) -> str:
    inr = usd * 83.5
    if inr >= 1000:
        return f"₹{inr:,.0f}"
    return f"₹{inr:.0f}"


@router.get("/api/finops")
def get_finops(db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    since_30d = now - timedelta(days=30)

    # Latest containers
    containers_raw = (
        db.query(ContainerMetric)
        .order_by(ContainerMetric.collected_at.desc())
        .limit(50)
        .all()
    )
    seen = set()
    containers = []
    for c in containers_raw:
        if c.container_id not in seen:
            seen.add(c.container_id)
            containers.append(c)

    # Compute per-container estimated monthly cost
    hours_per_month = 730
    container_monthly = len(containers) * _CONTAINER_COST_PER_HOUR * hours_per_month
    server_monthly = _SERVER_COST_PER_HOUR * hours_per_month

    total_cost_usd = server_monthly + container_monthly
    total_cost = _rupees(total_cost_usd)

    # Identify waste: idle containers
    waste_items = []
    waste_usd = 0.0
    for c in containers:
        if c.status == "idle" or c.cpu < 0.5:
            idle_cost = _CONTAINER_COST_PER_HOUR * hours_per_month
            waste_usd += idle_cost
            waste_items.append({
                "id": c.container_id,
                "name": c.name,
                "type": "Container",
                "costPerMonth": _rupees(idle_cost),
                "recommendation": f"Container {c.name} has {c.cpu}% CPU and {c.ram}% RAM. Consider stopping it to save resources.",
            })

    total_waste = _rupees(waste_usd)
    potential_savings = _rupees(waste_usd * 0.8)

    # Breakdown by type
    breakdown = [
        {"service": "Server (Compute)", "cost": round(server_monthly * 83.5), "waste": 0},
        {"service": "Containers", "cost": round(container_monthly * 83.5), "waste": round(waste_usd * 83.5)},
    ]

    # 30-day trend: flat estimate (real data would need continuous collection)
    trend = []
    for i in range(30):
        day = since_30d + timedelta(days=i)
        trend.append({
            "day": day.strftime("%b %d"),
            "cost": round(total_cost_usd / 30 * 83.5),
        })

    # Actions log from agent log entries
    actions_log = []
    agent_entries = (
        db.query(AgentLogEntry)
        .filter(AgentLogEntry.type.in_(["fix", "flag", "recommend"]))
        .filter(AgentLogEntry.timestamp >= since_30d)
        .order_by(AgentLogEntry.timestamp.desc())
        .limit(10)
        .all()
    )
    for e in agent_entries:
        ts = e.timestamp
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        actions_log.append({
            "id": e.entry_id,
            "action": e.message[:80],
            "resource": e.target,
            "saving": "N/A",
            "timestamp": ts.isoformat(),
            "status": "completed" if e.type == "fix" else "pending",
        })

    return {
        "totalCost": total_cost,
        "totalWaste": total_waste,
        "potentialSavings": potential_savings,
        "breakdown": breakdown,
        "trend": trend,
        "wasteItems": waste_items,
        "actionsLog": actions_log,
    }
