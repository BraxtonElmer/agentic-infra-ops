"""
GitHub Actions pipeline integration.
Requires GITHUB_TOKEN env var.
"""
import httpx
from datetime import datetime, timezone
from config import get_settings

settings = get_settings()

GITHUB_API = "https://api.github.com"


def _headers() -> dict:
    token = settings.github_token
    if not token:
        return {"Accept": "application/vnd.github+json"}
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }


def _map_status(conclusion: str | None, status: str) -> str:
    if status == "in_progress" or status == "queued":
        return "running"
    if conclusion == "success":
        return "pass"
    if conclusion in ("failure", "timed_out", "startup_failure"):
        return "fail"
    return "pass"


def _duration_str(run: dict) -> str | None:
    try:
        start = datetime.fromisoformat(run["run_started_at"].replace("Z", "+00:00"))
        end = datetime.fromisoformat(run["updated_at"].replace("Z", "+00:00"))
        secs = int((end - start).total_seconds())
        if secs < 60:
            return f"{secs}s"
        return f"{secs // 60}m {secs % 60}s"
    except Exception:
        return None


async def fetch_runs(owner: str, repo: str, per_page: int = 10) -> list[dict]:
    """Fetch recent workflow runs for a repo."""
    url = f"{GITHUB_API}/repos/{owner}/{repo}/actions/runs"
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(url, headers=_headers(), params={"per_page": per_page})
            resp.raise_for_status()
            data = resp.json()
            runs = []
            for r in data.get("workflow_runs", []):
                status = _map_status(r.get("conclusion"), r.get("status", ""))
                runs.append({
                    "run_id": str(r["id"]),
                    "repo": repo,
                    "branch": r.get("head_branch", "main"),
                    "triggered_by": r.get("event", "push"),
                    "status": status,
                    "error": None if status != "fail" else (r.get("conclusion") or "failed").upper(),
                    "duration": _duration_str(r) if status != "running" else None,
                    "log": None,
                    "diagnosis": None,
                    "diff": None,
                    "triggered_at": r.get("run_started_at") or r.get("created_at"),
                })
            return runs
    except Exception as e:
        print(f"[github_service] Failed to fetch runs for {owner}/{repo}: {e}")
        return []


async def fetch_failed_log(owner: str, repo: str, run_id: str) -> str | None:
    """Fetch the log snippet from the first failed job in a run."""
    url = f"{GITHUB_API}/repos/{owner}/{repo}/actions/runs/{run_id}/jobs"
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(url, headers=_headers())
            resp.raise_for_status()
            jobs = resp.json().get("jobs", [])
            for job in jobs:
                if job.get("conclusion") == "failure":
                    job_id = job["id"]
                    log_url = f"{GITHUB_API}/repos/{owner}/{repo}/actions/jobs/{job_id}/logs"
                    log_resp = await client.get(log_url, headers=_headers(), follow_redirects=True)
                    if log_resp.status_code == 200:
                        # Return last 3000 chars (most relevant)
                        return log_resp.text[-3000:]
    except Exception as e:
        print(f"[github_service] Failed to fetch log for run {run_id}: {e}")
    return None
