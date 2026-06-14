#!/bin/bash
# Start both frontend and backend for development
# Usage: bash dev.sh

set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/apps/backend"
FRONTEND_DIR="$ROOT_DIR/apps/frontend"

cleanup() {
  echo ""
  echo "Shutting down..."
  if [ -n "$BACKEND_PID" ]; then
    kill "$BACKEND_PID" 2>/dev/null || true
    wait "$BACKEND_PID" 2>/dev/null || true
  fi
  if [ -n "$FRONTEND_PID" ]; then
    kill "$FRONTEND_PID" 2>/dev/null || true
    wait "$FRONTEND_PID" 2>/dev/null || true
  fi
  echo "Done."
}

trap cleanup EXIT INT TERM

echo "=== Starting Backend (port 8000) ==="
cd "$BACKEND_DIR"
uv run uvicorn app.main:app --host 127.0.0.1 --port 8001 &
BACKEND_PID=$!

echo "=== Starting Frontend (port 3000) ==="
cd "$FRONTEND_DIR"
npx next dev --turbopack -H 0.0.0.0 &
FRONTEND_PID=$!

echo ""
echo "Backend:  http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "Press Ctrl+C to stop both."
echo ""

wait
