#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MEDNEXUS_ROOT="$(cd "$ROOT/.." && pwd)"
cd "$ROOT"

echo "==> Clinical Diagnosis MVP"
echo "    Web:     http://localhost:3001/diagnosis"
echo "    Backend: http://localhost:8001/docs"
echo ""

if [ ! -f backend/.env ] && [ -f backend/.env.example ]; then
  cp backend/.env.example backend/.env
  echo "Created backend/.env from example"
fi

if [ ! -f web/.env.local ] && [ -f web/.env.local.example ]; then
  cp web/.env.local.example web/.env.local
  echo "Created web/.env.local from example"
fi

# Backend
(
  cd backend
  if [ ! -d .venv ]; then
    python3 -m venv .venv
    .venv/bin/pip install -r requirements.txt -q
  fi
  if ! lsof -i :8001 >/dev/null 2>&1; then
    .venv/bin/uvicorn app.main:app --reload --port 8001 &
    echo $! > /tmp/clinical-diagnosis-backend.pid
    echo "Backend started on :8001"
  else
    echo "Backend already running on :8001"
  fi
)

# Web — 优先复用 MedNexus 主项目 node_modules，避免重复 npm install
(
  cd web
  if [ ! -e node_modules/next ]; then
    if [ -d "$MEDNEXUS_ROOT/frontend/node_modules/next" ]; then
      ln -sf ../../frontend/node_modules node_modules
      echo "Linked node_modules from MedNexus frontend"
    else
      echo "Installing web dependencies..."
      npm install
    fi
  fi
  NEXT_BIN="$ROOT/web/node_modules/.bin/next"
  if [ ! -x "$NEXT_BIN" ] && [ -x "$MEDNEXUS_ROOT/frontend/node_modules/.bin/next" ]; then
    NEXT_BIN="$MEDNEXUS_ROOT/frontend/node_modules/.bin/next"
  fi
  if ! lsof -i :3001 >/dev/null 2>&1; then
    "$NEXT_BIN" dev -p 3001 &
    echo $! > /tmp/clinical-diagnosis-web.pid
    echo "Web started on :3001"
  else
    echo "Web already running on :3001"
  fi
)

echo ""
echo "Ready — open http://localhost:3001/diagnosis"
echo "Press Ctrl+C to stop."
wait
