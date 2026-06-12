#!/usr/bin/env bash
# DEV ONLY — démarre la stack Docker locale (Postgres, Redis, API).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

docker compose config >/dev/null
docker compose up --build -d
docker compose ps

echo ""
echo "Health:"
echo "  curl http://localhost:8000/api/v1/health"
echo "  curl http://localhost:8000/api/v1/ready"
echo ""
echo "Frontend (hors Docker) :"
echo "  cd frontend && pnpm --filter web dev"
echo "  cd frontend && pnpm --filter admin dev"
