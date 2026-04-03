"""
GET /api/infrastructure  — latest server + container metrics from DB
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db, ServerMetric, ContainerMetric, AppSettings
from config import get_settings

router = APIRouter()
cfg = get_settings()


@router.get("/api/infrastructure")
def get_infrastructure(db: Session = Depends(get_db)):
    # Latest metric per server_id
    servers_raw = (
        db.query(ServerMetric)
        .order_by(ServerMetric.collected_at.desc())
        .all()
    )
    seen_ids = set()
    servers = []
    for s in servers_raw:
        if s.server_id not in seen_ids:
            seen_ids.add(s.server_id)
            servers.append({
                "id": s.server_id,
                "name": s.name,
                "instanceType": s.instance_type,
                "region": s.region,
                "uptime": s.uptime,
                "cpu": s.cpu,
                "ram": s.ram,
                "disk": s.disk,
                "netIn": s.net_in,
                "netOut": s.net_out,
                "critical": s.critical,
            })

    # Latest metric per container_id
    containers_raw = (
        db.query(ContainerMetric)
        .order_by(ContainerMetric.collected_at.desc())
        .all()
    )
    seen_cids = set()
    containers = []
    for c in containers_raw:
        if c.container_id not in seen_cids:
            seen_cids.add(c.container_id)
            row = {
                "id": c.container_id,
                "name": c.name,
                "image": c.image,
                "cpu": c.cpu,
                "ram": c.ram,
                "netIO": c.net_io,
                "uptime": c.uptime,
                "status": c.status,
            }
            if c.idle_days is not None:
                row["idleDays"] = c.idle_days
            containers.append(row)

    # Stale resources from containers
    stale = []
    for c in containers:
        if c["status"] in ("idle", "zombie"):
            if c.get("idleDays"):
                last_active = f"{c['idleDays']} days ago"
            elif "stopped" in c.get("uptime", ""):
                last_active = c["uptime"]  # e.g. "stopped 5d ago"
            else:
                last_active = "inactive"
            stale.append({
                "id": c["id"],
                "type": "zombie" if c["status"] == "zombie" else "container",
                "name": c["name"],
                "lastActive": last_active,
                "costPerMonth": "N/A",
            })

    return {
        "servers": servers,
        "containers": containers,
        "staleResources": stale,
    }
