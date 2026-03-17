#!/usr/bin/env bash
# Sub-Five dev startup script
# Starts both backend (Flask-SocketIO) and frontend (Vite) for development.
#
# Usage:
#   ./dev.sh          — start both servers
#   ./dev.sh backend  — start only the backend
#   ./dev.sh frontend — start only the frontend
#   ./dev.sh install  — install all dependencies
#
# Once running:
#   Frontend:  http://localhost:5173
#   Backend:   http://localhost:8080
#   Quick game with bots (no login needed):
#     curl -X POST http://localhost:8080/api/dev/quick-game \
#       -H 'Content-Type: application/json' \
#       -d '{"bots": 2, "name": "Dev"}'

set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

cleanup() {
  echo ""
  echo -e "${YELLOW}Shutting down...${NC}"
  kill $BACKEND_PID 2>/dev/null || true
  kill $FRONTEND_PID 2>/dev/null || true
  wait 2>/dev/null
  echo -e "${GREEN}Done.${NC}"
}

install_deps() {
  echo -e "${CYAN}=== Installing backend dependencies ===${NC}"
  if [ ! -d ".venv" ]; then
    python3 -m .venv .venv
  fi
  source .venv/bin/activate
  pip install -q -r requirements.txt
  pip install -q pytest

  echo -e "${CYAN}=== Installing frontend dependencies ===${NC}"
  cd frontend
  npm install
  cd ..

  echo -e "${GREEN}All dependencies installed.${NC}"
}

start_backend() {
  echo -e "${CYAN}Starting backend on :8080...${NC}"
  source .venv/bin/activate
  export FLASK_ENV=development
  export PYTHONPATH="$ROOT_DIR"
  python backend/wsgi.py &
  BACKEND_PID=$!
  echo -e "${GREEN}Backend PID: $BACKEND_PID${NC}"
}

start_frontend() {
  echo -e "${CYAN}Starting frontend on :5173...${NC}"
  cd frontend
  npx vite --host &
  FRONTEND_PID=$!
  cd ..
  echo -e "${GREEN}Frontend PID: $FRONTEND_PID${NC}"
}

case "${1:-all}" in
  install)
    install_deps
    exit 0
    ;;
  backend)
    trap cleanup EXIT
    start_backend
    wait
    ;;
  frontend)
    trap cleanup EXIT
    start_frontend
    wait
    ;;
  all)
    trap cleanup EXIT

    # Check dependencies
    if [ ! -d ".venv" ]; then
      echo -e "${YELLOW}No .venv found. Running install first...${NC}"
      install_deps
    fi
    if [ ! -d "frontend/node_modules" ]; then
      echo -e "${YELLOW}No node_modules found. Running install first...${NC}"
      install_deps
    fi

    start_backend
    sleep 1
    start_frontend

    echo ""
    echo -e "${GREEN}════════════════════════════════════════${NC}"
    echo -e "${GREEN}  Sub-Five dev servers running!${NC}"
    echo -e "${GREEN}════════════════════════════════════════${NC}"
    echo -e "  Frontend:  ${CYAN}http://localhost:5173${NC}"
    echo -e "  Backend:   ${CYAN}http://localhost:8080${NC}"
    echo ""
    echo -e "  ${YELLOW}Quick start (no login needed):${NC}"
    echo -e "  1. Open ${CYAN}http://localhost:5173${NC}"
    echo -e "  2. Click 'Quick Play' to start as a guest"
    echo -e "  3. Or use the dev API directly:"
    echo -e "     ${CYAN}curl -s -X POST http://localhost:8080/api/dev/quick-game \\${NC}"
    echo -e "     ${CYAN}  -H 'Content-Type: application/json' \\${NC}"
    echo -e "     ${CYAN}  -d '{\"bots\": 2, \"name\": \"Dev\"}'${NC}"
    echo -e "     Then open: ${CYAN}http://localhost:5173/#/game/<CODE>${NC}"
    echo ""
    echo -e "  Press ${YELLOW}Ctrl+C${NC} to stop both servers."
    echo -e "${GREEN}════════════════════════════════════════${NC}"

    wait
    ;;
  *)
    echo "Usage: ./dev.sh [all|backend|frontend|install]"
    exit 1
    ;;
esac
