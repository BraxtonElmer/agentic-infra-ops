"""
Collects Docker container metrics from the local Docker socket.
"""
import docker
from datetime import datetime, timezone


def _cpu_pct(stats: dict) -> float:
    """
    Returns CPU as a percentage of total server capacity (0–100%).
    cpu_delta / sys_delta already accounts for all cores because sys_delta
    is the sum of all CPU time across every core, so no num_cpus multiplication.
    """
    try:
        cpu_delta = stats["cpu_stats"]["cpu_usage"]["total_usage"] - stats["precpu_stats"]["cpu_usage"]["total_usage"]
        sys_delta = stats["cpu_stats"]["system_cpu_usage"] - stats["precpu_stats"]["system_cpu_usage"]
        if sys_delta <= 0 or cpu_delta < 0:
            return 0.0
        return round(min((cpu_delta / sys_delta) * 100.0, 100.0), 1)
    except Exception:
        return 0.0


def _ram_pct(stats: dict) -> float:
    try:
        used = stats["memory_stats"]["usage"] - stats["memory_stats"].get("stats", {}).get("cache", 0)
        limit = stats["memory_stats"]["limit"]
        return round(used / limit * 100, 1) if limit else 0.0
    except Exception:
        return 0.0


def _net_bytes(stats: dict) -> tuple[int, int]:
    """Returns (rx_bytes, tx_bytes) as raw ints."""
    try:
        networks = stats.get("networks", {})
        rx = sum(v["rx_bytes"] for v in networks.values())
        tx = sum(v["tx_bytes"] for v in networks.values())
        return rx, tx
    except Exception:
        return 0, 0


def _net_io(stats: dict) -> str:
    try:
        networks = stats.get("networks", {})
        rx = sum(v["rx_bytes"] for v in networks.values()) / (1024 * 1024)
        tx = sum(v["tx_bytes"] for v in networks.values()) / (1024 * 1024)
        return f"{rx:.1f}/{tx:.1f} MB"
    except Exception:
        return "0/0 MB"


def _parse_docker_ts(ts_str: str) -> datetime | None:
    """Parse Docker timestamp, handling nanosecond precision that Python can't parse natively."""
    try:
        # Truncate nanoseconds to microseconds (6 digits max)
        import re
        ts_str = re.sub(r'\.(\d{6})\d*', r'.\1', ts_str)
        ts_str = ts_str.replace("Z", "+00:00")
        dt = datetime.fromisoformat(ts_str)
        if dt.year < 2000:  # Docker zero value: 0001-01-01T00:00:00Z
            return None
        return dt
    except Exception:
        return None


def _uptime_str(started_at: str) -> str:
    dt = _parse_docker_ts(started_at)
    if not dt:
        return "just started"
    delta = datetime.now(timezone.utc) - dt
    days = delta.days
    hours = delta.seconds // 3600
    return f"{days}d {hours}h"


def _stopped_str(finished_at: str) -> str:
    dt = _parse_docker_ts(finished_at)
    if not dt:
        return "stopped"
    delta = datetime.now(timezone.utc) - dt
    days = delta.days
    hours = delta.seconds // 3600
    if days > 0:
        return f"stopped {days}d ago"
    return f"stopped {hours}h ago"


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
            if running:
                net_rx, net_tx = _net_bytes(stats)
            else:
                net_rx, net_tx = 0, 0
            net_io = _net_io(stats) if running else "0/0 MB"
            if running:
                uptime = _uptime_str(c.attrs["State"].get("StartedAt", ""))
            else:
                uptime = _stopped_str(c.attrs["State"].get("FinishedAt", ""))

            # Determine status:
            # - Not running (exited/created/paused) → stopped
            # - Running with zero CPU AND minimal net I/O (< 10 kB lifetime) → idle
            # - Running with CPU activity OR significant net I/O → running
            if c.status != "running":
                status = "stopped"
            elif cpu == 0.0 and (net_rx + net_tx) < 10_000:
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
