"""
Collects Docker container metrics from the local Docker socket.
"""
import docker
from datetime import datetime, timezone


def _cpu_pct(stats: dict) -> float:
    try:
        cpu_delta = stats["cpu_stats"]["cpu_usage"]["total_usage"] - stats["precpu_stats"]["cpu_usage"]["total_usage"]
        sys_delta = stats["cpu_stats"]["system_cpu_usage"] - stats["precpu_stats"]["system_cpu_usage"]
        num_cpus = len(stats["cpu_stats"]["cpu_usage"].get("percpu_usage") or []) or stats["cpu_stats"].get("online_cpus", 1)
        return round((cpu_delta / sys_delta) * num_cpus * 100.0, 1) if sys_delta > 0 else 0.0
    except Exception:
        return 0.0


def _ram_pct(stats: dict) -> float:
    try:
        used = stats["memory_stats"]["usage"] - stats["memory_stats"].get("stats", {}).get("cache", 0)
        limit = stats["memory_stats"]["limit"]
        return round(used / limit * 100, 1) if limit else 0.0
    except Exception:
        return 0.0


def _net_io(stats: dict) -> str:
    try:
        networks = stats.get("networks", {})
        rx = sum(v["rx_bytes"] for v in networks.values()) / (1024 * 1024)
        tx = sum(v["tx_bytes"] for v in networks.values()) / (1024 * 1024)
        return f"{rx:.1f}/{tx:.1f} MB"
    except Exception:
        return "0/0 MB"


def _uptime_str(started_at: str) -> str:
    try:
        from datetime import datetime, timezone
        start = datetime.fromisoformat(started_at.replace("Z", "+00:00"))
        delta = datetime.now(timezone.utc) - start
        days = delta.days
        hours = delta.seconds // 3600
        return f"{days}d {hours}h"
    except Exception:
        return "unknown"


def collect_containers() -> list[dict]:
    try:
        client = docker.from_env()
        containers = client.containers.list(all=True)
        results = []
        for c in containers:
            running = c.status == "running"
            stats = c.stats(stream=False) if running else {}

            cpu = _cpu_pct(stats) if running else 0.0
            ram = _ram_pct(stats) if running else 0.0
            net_io = _net_io(stats) if running else "0/0 MB"
            uptime = _uptime_str(c.attrs["State"].get("StartedAt", "")) if running else "stopped"

            # Determine status
            if c.status != "running":
                status = "idle"
            elif cpu < 0.5 and ram < 1.0:
                status = "idle"
            else:
                status = "running"

            results.append({
                "container_id": c.short_id,
                "name": c.name,
                "image": c.image.tags[0] if c.image.tags else c.image.short_id,
                "cpu": cpu,
                "ram": ram,
                "net_io": net_io,
                "uptime": uptime,
                "status": status,
            })
        return results
    except Exception as e:
        print(f"[docker_collector] Failed: {e}")
        return []


def get_stale_containers(containers: list[dict], idle_threshold_days: int = 3) -> list[dict]:
    """Return containers that appear idle (zombie or long-running with zero activity)."""
    return [c for c in containers if c["status"] in ("idle",) and c["cpu"] < 0.5]
