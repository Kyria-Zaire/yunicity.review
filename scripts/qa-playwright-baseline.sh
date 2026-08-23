#!/usr/bin/env sh
# Baseline QA canonique pour Playwright (C3.1-R1G).
#
# La mutation de `yunicity_qa` doit rester VISIBLE dans la commande operateur : elle
# n'est jamais declenchee par le chargement d'une spec. `global-setup.ts` se contente
# de VERIFIER que cette preparation a bien eu lieu, sans jamais rien detruire.
#
# Usage :
#   sh scripts/qa-playwright-baseline.sh
#   sh scripts/qa-playwright-baseline.sh --with-playwright   # enchaine la suite
#
# Ne jamais viser dev/recette/preprod/prod : chaque etape passe par le garde
# fail-closed `app.qa.guard`, qui n'autorise que `yunicity_qa` sur un hote local.
set -eu

COMPOSE="docker compose -p yunicity-qa -f docker-compose.qa.yml"
EXEC="$COMPOSE exec -T backend-qa"

echo "== 1/6 garde QA =="
$EXEC python -m app.qa.launcher guard-check

echo "== 2/6 reset (schema) =="
$EXEC python -m app.qa.launcher reset

echo "== 3/6 migrate =="
$EXEC alembic upgrade head

echo "== 4/6 seed =="
$EXEC python -m app.qa.launcher seed

echo "== 5/6 verify =="
$EXEC python -m app.qa.launcher verify

echo "== 6/6 reset-rate-limits (une seule fois) =="
$EXEC python -m app.qa.launcher reset-rate-limits

echo "baseline QA prete."

if [ "${1:-}" = "--with-playwright" ]; then
  echo "== Playwright (workers/retries de la configuration, sans surcharge) =="
  cd frontend/apps/web
  pnpm exec playwright test
fi
