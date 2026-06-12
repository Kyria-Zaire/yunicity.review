#!/usr/bin/env bash
# PostgreSQL restore — Yunicity (QA-05B)
#
# Usage (recette / preprod only — NEVER prod without maintenance window):
#   DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/yunicity_recette \
#     ./scripts/restore.sh backups/postgres/daily/yunicity-20260612T030000Z.sql.gz
#
# Steps:
#   1. Stop API workers writing to the target database.
#   2. Run this script against recette/preprod.
#   3. Run: cd backend && uv run alembic current
#   4. Run: API_BASE=... WEB_BASE=... bash scripts/smoke-check.sh
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: DATABASE_URL=... $0 <backup.sql.gz>" >&2
  exit 1
fi

BACKUP_FILE="$1"

if [[ ! -f "${BACKUP_FILE}" ]]; then
  echo "ERROR: backup file not found: ${BACKUP_FILE}" >&2
  exit 1
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL is required" >&2
  exit 1
fi

if [[ "${APP_ENV:-}" == "prod" ]]; then
  echo "ERROR: refuse restore when APP_ENV=prod — use recette/preprod only" >&2
  exit 1
fi

PG_URL="${DATABASE_URL/postgresql+asyncpg/postgresql}"
PG_URL="${PG_URL/postgresql+psycopg/postgresql}"

echo "WARNING: this will overwrite data in the target database."
echo "Target: ${PG_URL}"
echo "Backup: ${BACKUP_FILE}"
read -r -p "Type RESTORE to continue: " CONFIRM
if [[ "${CONFIRM}" != "RESTORE" ]]; then
  echo "Aborted."
  exit 1
fi

echo "[restore] applying backup..."
gunzip -c "${BACKUP_FILE}" | psql "${PG_URL}" --set ON_ERROR_STOP=on --single-transaction

echo "[restore] done. Run alembic current and smoke-check.sh next."
