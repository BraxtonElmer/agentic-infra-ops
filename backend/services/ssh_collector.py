"""
Collects local server metrics via psutil (no SSH needed - runs on this server).
For remote servers, paramiko SSH is used.
"""
import psutil
import time
import platform
from datetime import datetime, timezone


def _format_bytes(n: float) -> str:
    if n >= 1024 ** 3:
        return f"{n / 1024 ** 3:.1f} GB/s"
    if n >= 1024 ** 2:
        return f"{n / 1024 ** 2:.1f} MB/s"
    return f"{n / 1024:.1f} KB/s"


def _uptime_str() -> str:
    boot = psutil.boot_time()
    delta = time.time() - boot
    days = int(delta // 86400)
    hours = int((delta % 86400) // 3600)
    return f"{days}d {hours}h"


def collect_local() -> dict:
    """Collect metrics from the local machine using psutil."""
    cpu = psutil.cpu_percent(interval=1)
    mem = psutil.virtual_memory()
    disk_root = psutil.disk_usage("/")

    # Net I/O rates — sample over 1 second
    net_before = psutil.net_io_counters()
    time.sleep(1)
    net_after = psutil.net_io_counters()
    bytes_in = net_after.bytes_recv - net_before.bytes_recv
    bytes_out = net_after.bytes_sent - net_before.bytes_sent

    ram_pct = mem.percent
    disk_pct = disk_root.percent

    critical = cpu > 90 or ram_pct > 90

    return {
        "cpu": round(cpu, 1),
        "ram": round(ram_pct, 1),
        "disk": round(disk_pct, 1),
        "net_in": _format_bytes(max(bytes_in, 0)),
        "net_out": _format_bytes(max(bytes_out, 0)),
        "uptime": _uptime_str(),
        "critical": critical,
    }


def collect_remote(host: str, username: str, key_path: str | None = None, password: str | None = None) -> dict | None:
    """Collect metrics from a remote server via SSH using paramiko."""
    try:
        import paramiko
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        connect_kwargs = {"hostname": host, "username": username, "timeout": 10}
        if key_path:
            connect_kwargs["key_filename"] = key_path
        elif password:
            connect_kwargs["password"] = password
        client.connect(**connect_kwargs)

        def run(cmd):
            _, stdout, _ = client.exec_command(cmd)
            return stdout.read().decode().strip()

        # CPU (1-second sample)
        cpu_out = run("top -bn2 -d1 | grep 'Cpu(s)' | tail -1")
        cpu = 0.0
        for part in cpu_out.split(","):
            if "id" in part:
                try:
                    cpu = round(100.0 - float(part.strip().split()[0]), 1)
                except Exception:
                    pass

        # Memory
        mem_out = run("free | grep Mem")
        parts = mem_out.split()
        total, used = int(parts[1]), int(parts[2])
        ram = round(used / total * 100, 1) if total else 0.0

        # Disk
        disk_out = run("df / | tail -1")
        disk_parts = disk_out.split()
        disk = float(disk_parts[4].replace("%", "")) if len(disk_parts) >= 5 else 0.0

        # Uptime
        uptime = run("uptime -p").replace("up ", "")

        client.close()
        return {
            "cpu": cpu,
            "ram": ram,
            "disk": disk,
            "net_in": "N/A",
            "net_out": "N/A",
            "uptime": uptime,
            "critical": cpu > 90 or ram > 90,
        }
    except Exception as e:
        print(f"[ssh_collector] Failed to collect from {host}: {e}")
        return None
