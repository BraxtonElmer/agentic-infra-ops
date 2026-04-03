"""
Groq LLM service for agent analysis.
Runs only when metrics change significantly to stay within free tier limits.
"""
import json
import uuid
from datetime import datetime, timezone
from groq import Groq
from config import get_settings

settings = get_settings()
_client: Groq | None = None


def _get_client() -> Groq:
    global _client
    if _client is None:
        _client = Groq(api_key=settings.groq_api_key)
    return _client


def _call(prompt: str, system: str, max_tokens: int = 1024) -> str | None:
    try:
        client = _get_client()
        response = client.chat.completions.create(
            model=settings.groq_model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
            max_tokens=max_tokens,
            temperature=0.3,
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"[llm_service] Groq call failed: {e}")
        return None


# ── Infrastructure Analysis ────────────────────────────────────────────────────

SYSTEM_INFRA = """You are an expert DevOps agent analyzing server and container metrics.
Respond ONLY with a JSON array of findings. Each finding must have:
  type: "scan"|"flag"|"recommend"|"diagnose"
  target: string (resource name)
  message: string (one-line summary, max 120 chars)
  reasoning: string (detailed explanation, 2-4 sentences)
  severity: "critical"|"warning"|"info"
If nothing is notable, return an empty array [].
"""


def analyze_infrastructure(server_metrics: list[dict], containers: list[dict]) -> list[dict]:
    prompt = f"""Server metrics snapshot:
{json.dumps(server_metrics, indent=2)}

Container metrics snapshot:
{json.dumps(containers, indent=2)}

Identify any performance issues, idle resources, or security concerns.
"""
    raw = _call(prompt, SYSTEM_INFRA, max_tokens=1500)
    if not raw:
        return []
    try:
        # Extract JSON from response (handle markdown code blocks)
        text = raw.strip()
        if "```" in text:
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        findings = json.loads(text.strip())
        return findings if isinstance(findings, list) else []
    except Exception as e:
        print(f"[llm_service] Failed to parse infra analysis: {e}\nRaw: {raw[:300]}")
        return []


# ── Pipeline Failure Diagnosis ─────────────────────────────────────────────────

SYSTEM_PIPELINE = """You are a CI/CD expert diagnosing pipeline failures.
Respond ONLY with a JSON object:
{
  "rootCause": "one-line root cause",
  "affectedFile": "file or config that needs to change",
  "recommendation": "specific fix recommendation"
}
"""


def diagnose_pipeline_failure(repo: str, branch: str, error_code: str | None, log: str | None) -> dict | None:
    if not log and not error_code:
        return None
    prompt = f"""Pipeline failure in {repo} (branch: {branch})
Error code: {error_code or 'unknown'}
Build log (last portion):
{log or 'No log available'}

Diagnose the root cause and provide a fix recommendation.
"""
    raw = _call(prompt, SYSTEM_PIPELINE, max_tokens=512)
    if not raw:
        return None
    try:
        text = raw.strip()
        if "```" in text:
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        return json.loads(text.strip())
    except Exception as e:
        print(f"[llm_service] Failed to parse pipeline diagnosis: {e}")
        return None


# ── FinOps Analysis ─────────────────────────────────────────────────────────────

SYSTEM_FINOPS = """You are a FinOps expert analyzing server and container resource usage.
Respond ONLY with a JSON array of waste items:
[{
  "name": "resource name",
  "type": "Container|Volume|Process|Service",
  "recommendation": "specific cost-saving action (2-3 sentences)"
}]
If nothing is wasteful, return [].
"""


def analyze_finops(containers: list[dict], server_metrics: list[dict]) -> list[dict]:
    prompt = f"""Current containers:
{json.dumps(containers, indent=2)}

Server metrics:
{json.dumps(server_metrics, indent=2)}

Identify idle, oversized, or wasteful resources.
"""
    raw = _call(prompt, SYSTEM_FINOPS, max_tokens=1024)
    if not raw:
        return []
    try:
        text = raw.strip()
        if "```" in text:
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        result = json.loads(text.strip())
        return result if isinstance(result, list) else []
    except Exception as e:
        print(f"[llm_service] Failed to parse finops analysis: {e}")
        return []


# ── Build AgentLogEntry dict ───────────────────────────────────────────────────

def make_log_entry(finding: dict) -> dict:
    return {
        "entry_id": str(uuid.uuid4()),
        "timestamp": datetime.now(timezone.utc),
        "type": finding.get("type", "scan"),
        "target": finding.get("target", "unknown"),
        "message": finding.get("message", ""),
        "reasoning": finding.get("reasoning", ""),
        "extra": {k: v for k, v in finding.items() if k not in ("type", "target", "message", "reasoning")},
    }
