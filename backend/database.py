from sqlalchemy import create_engine, Column, String, Integer, Float, Boolean, DateTime, Text, JSON
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime, timezone
from config import get_settings

settings = get_settings()

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False} if "sqlite" in settings.database_url else {},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Models ────────────────────────────────────────────────────────────────────

class ServerMetric(Base):
    __tablename__ = "server_metrics"
    id = Column(Integer, primary_key=True, index=True)
    server_id = Column(String, index=True)
    name = Column(String)
    cpu = Column(Float)
    ram = Column(Float)
    disk = Column(Float)
    net_in = Column(String)
    net_out = Column(String)
    uptime = Column(String)
    instance_type = Column(String, default="oracle-vps")
    region = Column(String, default="ap-mumbai-1")
    critical = Column(Boolean, default=False)
    collected_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class ContainerMetric(Base):
    __tablename__ = "container_metrics"
    id = Column(Integer, primary_key=True, index=True)
    container_id = Column(String, index=True)
    name = Column(String)
    image = Column(String)
    cpu = Column(Float)
    ram = Column(Float)
    net_io = Column(String)
    uptime = Column(String)
    status = Column(String)
    idle_days = Column(Integer, nullable=True)
    collected_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class AgentLogEntry(Base):
    __tablename__ = "agent_log"
    id = Column(Integer, primary_key=True, index=True)
    entry_id = Column(String, unique=True, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    type = Column(String)       # scan | fix | diagnose | recommend | flag
    target = Column(String)
    message = Column(Text)
    reasoning = Column(Text)
    extra = Column(JSON, nullable=True)   # diagnosis / diff etc.


class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(String, unique=True, index=True)
    severity = Column(String)   # critical | warning | info
    title = Column(String)
    resource = Column(String)
    assessment = Column(Text)
    recommendation = Column(Text)
    status = Column(String, default="active")   # active | acknowledged | dismissed
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    resolved_at = Column(DateTime, nullable=True)
    resolved_by = Column(String, nullable=True)
    resolve_action = Column(Text, nullable=True)


class Pipeline(Base):
    __tablename__ = "pipelines"
    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(String, unique=True, index=True)
    repo = Column(String)
    branch = Column(String)
    triggered_by = Column(String)
    status = Column(String)     # pass | fail | running
    error = Column(String, nullable=True)
    duration = Column(String, nullable=True)
    log = Column(Text, nullable=True)
    diagnosis = Column(JSON, nullable=True)
    diff = Column(JSON, nullable=True)
    triggered_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class AppSettings(Base):
    __tablename__ = "app_settings"
    id = Column(Integer, primary_key=True)
    key = Column(String, unique=True, index=True)
    value = Column(JSON)
