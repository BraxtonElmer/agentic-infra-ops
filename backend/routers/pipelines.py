"""
GET /api/pipelines  — pipeline runs from DB (populated by scheduler from GitHub Actions)
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db, Pipeline
from datetime import datetime, timezone, timedelta
from collections import defaultdict

router = APIRouter()


@router.get("/api/pipelines")
def get_pipelines(db: Session = Depends(get_db)):
    runs = (
        db.query(Pipeline)
        .order_by(Pipeline.triggered_at.desc())
        .limit(50)
        .all()
    )

    pipelines = []
    auto_fix_history = []

    for r in runs:
        ts = r.triggered_at
        if ts and ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)

        entry = {
            "id": r.run_id,
            "repo": r.repo,
            "branch": r.branch,
            "triggeredBy": r.triggered_by,
            "status": r.status,
            "error": r.error,
            "duration": r.duration,
            "timestamp": ts.isoformat() if ts else None,
            "log": r.log,
            "diagnosis": r.diagnosis,
            "diff": r.diff,
        }
        pipelines.append(entry)

        if r.diagnosis:
            auto_fix_history.append({
                "id": r.run_id,
                "title": f"fix: {r.diagnosis.get('recommendation', 'Auto-diagnosis available')}"[:80],
                "repo": r.repo,
                "status": "open",
                "timestamp": ts.isoformat() if ts else None,
            })

    # 7-day trend
    now = datetime.now(timezone.utc)
    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    counts: dict[str, dict] = defaultdict(lambda: {"pass": 0, "fail": 0})

    for r in runs:
        ts = r.triggered_at
        if not ts:
            continue
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        if (now - ts).days <= 7:
            day_label = day_names[ts.weekday()]
            if r.status == "pass":
                counts[day_label]["pass"] += 1
            elif r.status == "fail":
                counts[day_label]["fail"] += 1

    trend = [{"day": d, "pass": counts[d]["pass"], "fail": counts[d]["fail"]} for d in day_names]

    return {
        "pipelines": pipelines,
        "trend": trend,
        "autoFixHistory": auto_fix_history[:10],
    }
