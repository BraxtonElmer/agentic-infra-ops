"""
Auto-generates alerts from threshold breaches and LLM findings.
Deduplicates: does not create a new alert if one with the same resource+title
already exists in an active, acknowledged, or dismissed state within the last 24 hours.
"""
import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from database import Alert


def _get_setting(db: Session, key: str, default):
    from database import AppSettings
    row = db.query(AppSettings).filter(AppSettings.key == key).first()
    if row and row.value is not None:
        return row.value
    return default


def _alert_exists(db: Session, title: str, resource: str) -> bool:
    """Suppress duplicate creation for active/acknowledged/dismissed alerts within 24h.
    Resolved alerts (auto-fixed) are allowed to respawn so the demo reset works."""
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    return db.query(Alert).filter(
        Alert.title == title,
        Alert.resource == resource,
        Alert.status.in_(["active", "acknowledged", "dismissed"]),
        Alert.created_at >= cutoff,
    ).first() is not None


def _create(db: Session, severity: str, title: str, resource: str, assessment: str, recommendation: str):
    if _alert_exists(db, title, resource):
        return
    alert = Alert(
        alert_id=str(uuid.uuid4()),
        severity=severity,
        title=title,
        resource=resource,
        assessment=assessment,
        recommendation=recommendation,
        status="active",
    )
    db.add(alert)
    db.commit()


def evaluate_server_metrics(db: Session, server_name: str, cpu: float, ram: float, disk: float):
    thresholds = _get_setting(db, "thresholds", {
        "cpuWarning": 70, "cpuCritical": 90,
        "ramWarning": 75, "ramCritical": 90,
        "diskWarning": 80,
    })

    if cpu >= thresholds.get("cpuCritical", 90):
        _create(db, "critical", "Critical CPU usage", server_name,
                f"CPU at {cpu}% exceeds critical threshold of {thresholds['cpuCritical']}%.",
                "Investigate top processes and consider scaling.")
    elif cpu >= thresholds.get("cpuWarning", 70):
        _create(db, "warning", "High CPU usage", server_name,
                f"CPU at {cpu}% exceeds warning threshold of {thresholds['cpuWarning']}%.",
                "Monitor for sustained load; consider scaling.")

    if ram >= thresholds.get("ramCritical", 90):
        _create(db, "critical", "Critical memory usage", server_name,
                f"RAM at {ram}% — OOMKill risk.",
                "Identify memory-hungry processes and restart or scale.")
    elif ram >= thresholds.get("ramWarning", 75):
        _create(db, "warning", "High memory usage", server_name,
                f"RAM at {ram}% exceeds warning threshold.",
                "Review application memory limits.")

    if disk >= thresholds.get("diskWarning", 80):
        _create(db, "warning", "High disk usage", server_name,
                f"Disk at {disk}% — approaching full.",
                "Clean up logs, container images, and temporary files.")


def evaluate_containers(db: Session, containers: list[dict]):
    for c in containers:
        if c.get("status") == "idle" and c.get("cpu", 0) < 0.5:
            _create(db, "info", "Idle container detected", c["name"],
                    f"Container {c['name']} is running but has had near-zero CPU/RAM utilization.",
                    "Consider stopping or removing this container to free resources.")


def create_from_llm_finding(db: Session, finding: dict):
    severity = finding.get("severity", "info")
    _create(
        db,
        severity,
        finding.get("message", "Agent finding")[:200],
        finding.get("target", "unknown"),
        finding.get("reasoning", "")[:1000],
        "Review agent log for details.",
    )
