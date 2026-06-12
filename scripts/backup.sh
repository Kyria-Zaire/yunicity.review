#!/usr/bin/env bash
# PostgreSQL backup — Yunicity (QA-05B)
#
# Usage:
#   DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/yunicity_prod ./scripts/backup.sh
#
# Optional:
#   BACKUP_DIR=./backups/postgres
#   BACKUP_RETENTION_DAILY=7
#   BACKUP_RETENTION_WEEKLY=4
#   BACKUP_S3_ENDPOINT / BACKUP_S3_BUCKET / AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY
#
# Cron (03:00 UTC daily):
#   0 3 * * * cd /opt/yunicity && DATABASE_URL=... ./scripts/backup.sh >> /var/log/yunicity-backup.log 2>&1
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-${ROOT}/backups/postgres}"
RETENTION_DAILY="${BACKUP_RETENTION_DAILY:-7}"
RETENTION_WEEKLY="${BACKUP_RETENTION_WEEKLY:-4}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
DAILY_DIR="${BACKUP_DIR}/daily"
WEEKLY_DIR="${BACKUP_DIR}/weekly"
ARCHIVE_NAME="yunicity-${TIMESTAMP}.sql.gz"
DAILY_PATH="${DAILY_DIR}/${ARCHIVE_NAME}"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL is required" >&2
  exit 1
fi

# pg_dump expects postgresql:// (sync driver suffix removed)
PG_URL="${DATABASE_URL/postgresql+asyncpg/postgresql}"
PG_URL="${PG_URL/postgresql+psycopg/postgresql}"

mkdir -p "${DAILY_DIR}" "${WEEKLY_DIR}"

echo "[backup] dumping to ${DAILY_PATH}"
pg_dump "${PG_URL}" --no-owner --no-acl --format=plain | gzip -9 > "${DAILY_PATH}"

# Weekly copy on Sunday (UTC)
if [[ "$(date -u +%u)" == "7" ]]; then
  cp "${DAILY_PATH}" "${WEEKLY_DIR}/${ARCHIVE_NAME}"
  echo "[backup] weekly copy saved"
fi

echo "[backup] pruning daily backups older than ${RETENTION_DAILY} days"
find "${DAILY_DIR}" -type f -name 'yunicity-*.sql.gz' -mtime +"${RETENTION_DAILY}" -delete

echo "[backup] pruning weekly backups (keep ${RETENTION_WEEKLY})"
ls -1t "${WEEKLY_DIR}"/yunicity-*.sql.gz 2>/dev/null | tail -n +"$((RETENTION_WEEKLY + 1))" | xargs -r rm -f

if [[ -n "${BACKUP_S3_BUCKET:-}" ]]; then
  if ! command -v aws >/dev/null 2>&1; then
    echo "ERROR: aws CLI required for S3 upload" >&2
    exit 1
  fi
  S3_DEST="s3://${BACKUP_S3_BUCKET}/postgres/daily/${ARCHIVE_NAME}"
  AWS_ARGS=()
  if [[ -n "${BACKUP_S3_ENDPOINT:-}" ]]; then
    AWS_ARGS+=(--endpoint-url "${BACKUP_S3_ENDPOINT}")
  fi
  echo "[backup] uploading to ${S3_DEST}"
  aws s3 cp "${DAILY_PATH}" "${S3_DEST}" "${AWS_ARGS[@]}"
  if [[ -f "${WEEKLY_DIR}/${ARCHIVE_NAME}" ]]; then
    aws s3 cp "${WEEKLY_DIR}/${ARCHIVE_NAME}" \
      "s3://${BACKUP_S3_BUCKET}/postgres/weekly/${ARCHIVE_NAME}" \
      "${AWS_ARGS[@]}"
  fi
fi

echo "[backup] done: ${DAILY_PATH}"
