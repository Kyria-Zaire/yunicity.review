#!/usr/bin/env bash
# Applique les migrations Alembic sur la base configurée dans backend/.env
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT/backend"

if command -v uv >/dev/null 2>&1; then
  uv run alembic upgrade head
  uv run alembic current
else
  alembic upgrade head
  alembic current
fi
