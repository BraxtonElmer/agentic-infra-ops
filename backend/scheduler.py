"""
Background scheduler:
  - Every 60s: collect local server metrics + Docker container metrics → DB
  - Every 60s: run alert engine against latest metrics (no LLM, just threshold checks)
  - Every 10min: run LLM infra analysis (to respect Groq free tier)
  - Every 5min: pull GitHub Actions runs (if token is configured)
"""
import uuid
import asyncio
from datetime import datetime, timezone
from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session
from database import SessionLocal, ServerMetric, ContainerMetric, AgentLogEntry, AppSettings, Pipeline
from services import ssh_collector, docker_collector, alert_engine, llm_service
from config import get_settings

cfg = get_settings()

scheduler = BackgroundScheduler(timezone="UTC")


def _get_settings_value(db: Session, key: str, default):
    row = db.query(AppSettings).filter(AppSettings.key == key).first()
    if row and row.value:
        return row.value
    return default


# ── Metrics Collection ──────────────────────────────────────────────────────────

def collect_metrics():
    db = SessionLocal()
    try:
        # Always collect local server metrics
        local = ssh_collector.collect_local()
        server_id = f"local-{cfg.local_server_name}"
        db.add(ServerMetric(
            server_id=server_id,
            name=cfg.local_server_name,
            cpu=local["cpu"],
            ram=local["ram"],
            disk=local["disk"],
            net_in=local["net_in"],
            net_out=local["net_out"],
            uptime=local["uptime"],
            instance_type="oracle-a1.flex",
            region="ap-mumbai-1",
            critical=local["critical"],
        ))

        # Collect for any remote servers configured in settings
        integrations = _get_settings_value(db, "integrations", {})
        for srv in integrations.get("servers", []):
            host = srv.get("host")
            username = srv.get("username", "ubuntu")
            key_path = srv.get("keyPath")
            name = srv.get("name", host)
            if not host:
                continue
            remote = ssh_collector.collect_remote(host, username, key_path)
            if remote:
                db.add(ServerMetric(
                    server_id=f"remote-{host}",
                    name=name,
                    cpu=remote["cpu"],
                    ram=remote["ram"],
                    disk=remote["disk"],
                    net_in=remote.get("net_in", "N/A"),
                    net_out=remote.get("net_out", "N/A"),
                    uptime=remote["uptime"],
                    instance_type=srv.get("instanceType", "vps"),
                    region=srv.get("region", "remote"),
                    critical=remote["critical"],
                ))

        db.commit()

        # Prune old server metrics (keep last 7 days worth)
        from datetime import timedelta
        cutoff = datetime.now(timezone.utc) - timedelta(days=7)
        db.query(ServerMetric).filter(ServerMetric.collected_at < cutoff).delete()
        db.commit()

        # Collect Docker containers
        containers = docker_collector.collect_containers()
        # Purge current container rows before inserting fresh snapshot
        db.query(ContainerMetric).delete()
        db.commit()
        for c in containers:
            # Compute idle_days for non-running containers from uptime string
            idle_days = None
            if c["status"] == "idle":
                uptime = c.get("uptime", "")
                if "stopped" in uptime and "d" in uptime:
                    try:
                        idle_days = int(uptime.split("stopped")[1].split("d")[0].strip())
                    except (ValueError, IndexError):
                        idle_days = None
            db.add(ContainerMetric(
                container_id=c["container_id"],
                name=c["name"],
                image=c["image"],
                cpu=c["cpu"],
                ram=c["ram"],
                net_io=c["net_io"],
                uptime=c["uptime"],
                status=c["status"],
                idle_days=idle_days,
            ))
        db.commit()

        # Run threshold-based alert engine (fast, no LLM)
        latest_server = db.query(ServerMetric).filter(ServerMetric.server_id == server_id).order_by(ServerMetric.collected_at.desc()).first()
        if latest_server:
            alert_engine.evaluate_server_metrics(db, latest_server.name, latest_server.cpu, latest_server.ram, latest_server.disk)
        alert_engine.evaluate_containers(db, containers)

    except Exception as e:
        print(f"[scheduler] collect_metrics error: {e}")
    finally:
        db.close()


# ── LLM Analysis ────────────────────────────────────────────────────────────────

def run_llm_analysis():
    db = SessionLocal()
    try:
        servers_raw = db.query(ServerMetric).order_by(ServerMetric.collected_at.desc()).limit(10).all()
        containers_raw = db.query(ContainerMetric).order_by(ContainerMetric.collected_at.desc()).limit(20).all()

        servers = [{"name": s.name, "cpu": s.cpu, "ram": s.ram, "disk": s.disk} for s in servers_raw]
        containers = [{"name": c.name, "status": c.status, "cpu": c.cpu, "ram": c.ram} for c in containers_raw]

        if not servers and not containers:
            return

        # Summary scan entry
        summary = AgentLogEntry(
            entry_id=str(uuid.uuid4()),
            type="scan",
            target="infrastructure",
            message=f"Scheduled LLM scan — {len(servers)} servers, {len(containers)} containers analyzed.",
            reasoning="Periodic agent scan using Groq LLM to detect issues beyond threshold rules.",
        )
        db.add(summary)
        db.commit()

        findings = llm_service.analyze_infrastructure(servers, containers)
        for f in findings:
            entry_data = llm_service.make_log_entry(f)
            db.add(AgentLogEntry(**entry_data))
            db.commit()
            if f.get("severity") in ("critical", "warning"):
                alert_engine.create_from_llm_finding(db, f)

    except Exception as e:
        print(f"[scheduler] run_llm_analysis error: {e}")
    finally:
        db.close()


# ── GitHub Actions ──────────────────────────────────────────────────────────────

def sync_pipelines():
    if not cfg.github_token:
        return
    db = SessionLocal()
    try:
        integrations = _get_settings_value(db, "integrations", {})
        repos = integrations.get("repos", [])
        if not repos:
            return

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        for repo_cfg in repos:
            url = repo_cfg.get("url", "")
            # url format: github.com/owner/repo  or  owner/repo
            url = url.replace("https://github.com/", "").replace("github.com/", "")
            parts = url.split("/")
            if len(parts) < 2:
                continue
            owner, repo_name = parts[0], parts[1]

            from services.github_service import fetch_runs, fetch_failed_log
            runs = loop.run_until_complete(fetch_runs(owner, repo_name, per_page=5))

            for run in runs:
                existing = db.query(Pipeline).filter(Pipeline.run_id == run["run_id"]).first()
                if existing:
                    existing.status = run["status"]
                    existing.duration = run["duration"]
                    db.commit()
                    continue

                # For new failures: fetch log and run LLM diagnosis
                if run["status"] == "fail":
                    log = loop.run_until_complete(fetch_failed_log(owner, repo_name, run["run_id"]))
                    run["log"] = log
                    if log:
                        diagnosis = llm_service.diagnose_pipeline_failure(repo_name, run["branch"], run["error"], log)
                        run["diagnosis"] = diagnosis

                from datetime import datetime
                triggered_at = run.get("triggered_at")
                if triggered_at:
                    try:
                        triggered_at = datetime.fromisoformat(triggered_at.replace("Z", "+00:00"))
                    except Exception:
                        triggered_at = datetime.now(timezone.utc)
                else:
                    triggered_at = datetime.now(timezone.utc)

                db.add(Pipeline(
                    run_id=run["run_id"],
                    repo=run["repo"],
                    branch=run["branch"],
                    triggered_by=run["triggered_by"],
                    status=run["status"],
                    error=run["error"],
                    duration=run["duration"],
                    log=run.get("log"),
                    diagnosis=run.get("diagnosis"),
                    diff=run.get("diff"),
                    triggered_at=triggered_at,
                ))
                db.commit()

        loop.close()
    except Exception as e:
        print(f"[scheduler] sync_pipelines error: {e}")
    finally:
        db.close()


def start_scheduler():
    scheduler.add_job(collect_metrics, "interval", seconds=60, id="collect_metrics", replace_existing=True)
    scheduler.add_job(run_llm_analysis, "interval", minutes=10, id="llm_analysis", replace_existing=True)
    scheduler.add_job(sync_pipelines, "interval", minutes=5, id="sync_pipelines", replace_existing=True)
    scheduler.start()
    print("[scheduler] Started — metrics every 60s, LLM every 10min, pipelines every 5min")
    # Run once immediately on startup
    collect_metrics()
    run_llm_analysis()
    sync_pipelines()
