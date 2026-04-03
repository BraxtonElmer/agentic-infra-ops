#!/bin/bash
# Starts the Axiom FastAPI backend on port 8000 using the venv
# Run once: chmod +x start.sh && ./start.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Activate venv
source .venv/bin/activate

# Ensure docker socket is accessible via newgrp trick
if ! docker ps &>/dev/null 2>&1; then
  echo "WARNING: Docker socket not accessible for current session."
  echo "         Container metrics will be limited."
fi

exec sg docker ".venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --workers 1"
