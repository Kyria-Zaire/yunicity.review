#!/usr/bin/env bash
# DEV ONLY — creates isolated pytest database (PLATFORM-TEST-DB-SAFETY-01)
set -euo pipefail

psql -v ON_ERROR_STOP=1 --username "${POSTGRES_USER}" --dbname "${POSTGRES_DB}" <<-EOSQL
    SELECT 'CREATE DATABASE yunicity_test OWNER ${POSTGRES_USER}'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'yunicity_test')\gexec
EOSQL
