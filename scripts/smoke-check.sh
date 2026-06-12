#!/usr/bin/env bash
# Smoke tests post-déploiement — usage :
#   API_BASE=https://api.yunicity.fr WEB_BASE=https://yunicity.fr bash scripts/smoke-check.sh
set -euo pipefail

API_BASE="${API_BASE:-http://localhost:8000}"
WEB_BASE="${WEB_BASE:-http://localhost:3000}"
ADMIN_BASE="${ADMIN_BASE:-http://localhost:3001}"

pass() { echo "OK  $1"; }
fail() { echo "FAIL $1"; exit 1; }

check_http() {
  local url="$1"
  local label="$2"
  local code
  code="$(curl -sS -o /dev/null -w "%{http_code}" "$url")"
  if [[ "$code" =~ ^2 ]]; then
    pass "$label ($code)"
  else
    fail "$label ($code) — $url"
  fi
}

echo "=== Yunicity smoke check ==="
echo "API_BASE=$API_BASE"
echo "WEB_BASE=$WEB_BASE"
echo ""

health="$(curl -fsS "${API_BASE}/api/v1/health")"
echo "$health" | grep -q '"status":"ok"' || fail "health payload"
pass "/api/v1/health"

ready="$(curl -fsS "${API_BASE}/api/v1/ready")"
echo "$ready" | grep -q '"status":"ready"' || fail "ready not ready: $ready"
pass "/api/v1/ready"

docs_code="$(curl -sS -o /dev/null -w "%{http_code}" "${API_BASE}/docs" || true)"
if [[ "$docs_code" == "404" ]]; then
  pass "/docs hidden (prod-safe)"
elif [[ "$docs_code" =~ ^2 ]]; then
  pass "/docs available (non-prod)"
else
  fail "/docs unexpected status $docs_code"
fi

check_http "${WEB_BASE}/" "web home"
check_http "${WEB_BASE}/robots.txt" "web robots.txt"
check_http "${WEB_BASE}/sitemap.xml" "web sitemap.xml"
check_http "${WEB_BASE}/sortir" "web /sortir"
check_http "${WEB_BASE}/places" "web /places"
check_http "${ADMIN_BASE}/login" "admin login"

echo ""
echo "Smoke check completed."
