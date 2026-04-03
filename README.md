# Axiom — Agentic Infrastructure Operations

> An autonomous DevOps and FinOps dashboard that monitors a self-hosted server in real time, runs LLM-powered analysis every 10 minutes, raises alerts for detected problems, and executes remediations — including stopping abandoned containers — without manual intervention.

---

## The Idea

Most infrastructure dashboards are passive: they show you a problem and wait for you to act. Axiom adds an agentic layer — a scheduled AI agent that reads your server and container metrics, reasons about what is wrong, decides what to do, and acts.

The prototype runs against a real Oracle Cloud VPS. Every minute a scheduler collects CPU, RAM, disk and Docker container stats. Every 10 minutes a Groq LLM analyses the state and writes findings to an agent log. When a container sits idle for too long, the agent raises an alert. When you click **Auto-fix**, the agent stops the container, marks the alert resolved, and logs exactly what it did and why.

---

## Tech Stack

### Frontend

![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![SWR](https://img.shields.io/badge/SWR-000000?style=for-the-badge&logo=vercel&logoColor=white)

### Backend

![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python_3.10-3776AB?style=for-the-badge&logo=python&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

### AI / LLM

![Groq](https://img.shields.io/badge/Groq-F55036?style=for-the-badge&logo=groq&logoColor=white)
![LLaMA](https://img.shields.io/badge/LLaMA_3.3_70B-0467DF?style=for-the-badge&logo=meta&logoColor=white)

### Infrastructure

![Oracle Cloud](https://img.shields.io/badge/Oracle_Cloud-F80000?style=for-the-badge&logo=oracle&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white)
![PM2](https://img.shields.io/badge/PM2-2B037A?style=for-the-badge&logo=pm2&logoColor=white)

---

## System Architecture

```
Browser
  └── ops.akariyu.com  (Nginx + SSL)
        └── Next.js  :3010  (PM2)
              └── /api/* proxy routes  (force-dynamic, server-side only)
                    └── FastAPI  :8000  (PM2)
                          ├── APScheduler
                          │     ├── collect_metrics()     every 60 s
                          │     │     ├── psutil  — CPU, RAM, disk, net I/O
                          │     │     ├── docker-py  — per-container stats
                          │     │     └── alert_engine  — threshold rules
                          │     ├── run_llm_analysis()    every 10 min
                          │     │     └── Groq API → llama-3.3-70b-versatile
                          │     └── sync_pipelines()      every 5 min
                          │           └── GitHub Actions API (token required)
                          └── SQLite  axiom.db
                                server_metrics · container_metrics
                                agent_log · alerts · pipelines · app_settings
```

All Next.js API routes are tagged `export const dynamic = 'force-dynamic'` so they execute at request time and never serve a cached build snapshot.

---

## How the Agent Works

**Threshold layer (every 60 s)**  
The scheduler reads psutil and Docker stats, writes them to SQLite, then runs rule-based checks — CPU above 90%, disk above 80%, a container running with zero CPU and under 10 kB lifetime net I/O. Each violation creates a deduplicated alert.

**LLM layer (every 10 min)**  
The scheduler sends the latest server and container snapshot to Groq llama-3.3-70b-versatile with a structured prompt. The model returns a JSON array of findings which are written to the agent log. Findings at warning or critical severity also create alerts.

**CPU % calculation**  
Container CPU is expressed as a percentage of total server capacity — not per-core. Formula: `(container_cpu_delta / system_cpu_delta) × 100`. A container using one full core on a 4-core server reads as 25%, not 100%.

**Idle detection**  
A running container is considered idle when its measured CPU is 0.0% and its cumulative network I/O is under 10 kB. The byte threshold is needed because a postgres database can read 0% CPU in a point-in-time sample yet has accumulated 60+ MB of traffic — correctly kept as running.

**Auto-fix**  
When the user clicks Auto-fix on an idle container alert, the backend calls `container.stop()` via the Docker socket, marks the alert resolved with `resolved_by = agent`, and writes a fix entry to the agent log with full reasoning.

---

## Features

| Area | What works |
|---|---|
| Server metrics | Real-time CPU, RAM, disk, net I/O via psutil — collected every 60 s |
| Container metrics | Per-container CPU, RAM, net I/O, uptime, idle/running status |
| Threshold alerts | CPU / RAM / disk breach + idle container detection |
| LLM analysis | Groq llama-3.3-70b findings every 10 min → agent log + alerts |
| Alert actions | Acknowledge, Dismiss, Auto-fix (stop container + resolve + log) |
| Scan trigger | Manual LLM scan from the Agent Log page |
| FinOps | Monthly cost estimate and waste from idle containers |
| Pipelines | Stored runs with status, error badge, agent diagnosis |
| Settings | Threshold values saved to DB |
| Auto-refresh | All pages poll SWR (12–30 s intervals) |

| Area | Not yet built |
|---|---|
| GitHub token | Pipelines page uses seeded demo data until a token is configured |
| Authentication | Dashboard is open to the network — no login layer |
| Time-series charts | Infrastructure and FinOps show current snapshot only |
| Multi-server SSH | Code exists but no remote servers are configured |
| WebSocket push | Frontend polls; no event-driven real-time channel |

---

## Demo Containers

Three containers were created for the demo alongside the existing production containers (none of which were modified):

| Container | Status | Purpose |
|---|---|---|
| `axiom-demo-web` | running | nginx + CPU workload — shows as active |
| `axiom-demo-api` | running | continuous sha256 loop — shows high CPU |
| `axiom-demo-idle` | idle | `sleep infinity` — the auto-fix target |

Five pipelines are seeded in the database representing realistic CI/CD history for `axiom-demo/web-service`, `axiom-demo/api-service`, and `axiom-demo/infra-config`, including two failing runs with LLM-generated root-cause diagnosis and suggested diffs.

**Auto-fix demo loop**

1. Open **Alerts** — `axiom-demo-idle` shows an active idle container warning
2. Click **Auto-fix** — agent stops the container, resolves the alert, writes a log entry
3. Open **Agent Log** — new `FIX` entry with reasoning
4. Open **Infrastructure** — container now shows `idle` with a stopped timestamp

**Reset the demo**
```bash
sg docker "docker start axiom-demo-idle"
cd /home/ubuntu/websites/agentic-infra-ops/backend
DATABASE_URL="sqlite:///./axiom.db" .venv/bin/python3 -c "
import uuid, os
os.environ['DATABASE_URL'] = 'sqlite:///./axiom.db'
from database import SessionLocal, Alert
db = SessionLocal()
db.query(Alert).filter(Alert.resource == 'axiom-demo-idle').delete(synchronize_session=False)
from database import Alert
db.add(Alert(
    alert_id=str(uuid.uuid4()),
    severity='warning',
    title='Idle container detected',
    resource='axiom-demo-idle',
    assessment='axiom-demo-idle has 0% CPU and no network I/O. Appears to be an abandoned container.',
    recommendation='Stop this container to reclaim reserved compute. Use Auto-fix.',
    status='active',
))
db.commit(); db.close(); print('Demo reset.')
"
```

---

## Project Structure

```
agentic-infra-ops/
|
├── backend/
│   ├── main.py               FastAPI app, CORS, lifespan
│   ├── config.py             Pydantic settings from .env
│   ├── database.py           SQLAlchemy models
│   ├── scheduler.py          APScheduler — metrics, LLM, pipelines
│   ├── routers/
│   │   ├── overview.py       GET /api/overview
│   │   ├── infrastructure.py GET /api/infrastructure
│   │   ├── alerts.py         GET · PUT · DELETE · POST /api/alerts
│   │   ├── agent_log.py      GET · POST /api/agent-log
│   │   ├── pipelines.py      GET /api/pipelines
│   │   ├── finops.py         GET /api/finops
│   │   ├── sidebar_counts.py GET /api/sidebar-counts
│   │   └── settings.py       GET · PUT /api/settings
│   └── services/
│       ├── ssh_collector.py  psutil local metrics
│       ├── docker_collector.py  container stats + idle detection
│       ├── llm_service.py    Groq prompt + response parsing
│       ├── alert_engine.py   threshold rules + LLM alert creation
│       └── github_service.py GitHub Actions API (no token set)
│
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── page.tsx                Overview
│       │   ├── alerts/page.tsx         Alerts
│       │   ├── infrastructure/page.tsx Infrastructure
│       │   ├── pipelines/page.tsx      Pipelines
│       │   ├── finops/page.tsx         FinOps
│       │   ├── agent-log/page.tsx      Agent Log
│       │   ├── settings/page.tsx       Settings
│       │   └── api/*/route.ts          Proxy routes (force-dynamic)
│       ├── components/
│       │   ├── shell/   Sidebar · Topbar · BottomNav · AgentDrawer
│       │   └── ui/      Badge · Button · Card · MetricBar · Skeleton · StatusDot · AgentInsight
│       ├── lib/use-fetch.ts            SWR hook with refreshInterval
│       └── store/use-app-store.ts      Zustand store
│
├── ops.akariyu.com.nginx     Nginx site config
└── README.md
```

---

## Local Setup

**Backend**
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cat > .env << EOF
DATABASE_URL=sqlite:///./axiom.db
GROQ_API_KEY=your_key_here
LOCAL_SERVER_NAME=ops-server
EOF
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Frontend**
```bash
cd frontend
npm install
echo "BACKEND_URL=http://127.0.0.1:8000" > .env.local
npm run dev
```

**Environment variables**

| Variable | Where | Description |
|---|---|---|
| `DATABASE_URL` | backend/.env | `sqlite:///./axiom.db` or a Postgres URL |
| `GROQ_API_KEY` | backend/.env | Groq console key (free tier works) |
| `LOCAL_SERVER_NAME` | backend/.env | Display name for the server card |
| `BACKEND_URL` | frontend/.env.local | Backend base URL for the Next.js proxy |

