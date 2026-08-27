#!/usr/bin/env sh
# Suite backend d'integration DEPUIS L'HOTE (C3-BACKEND-BASELINE-R2).
#
# Pourquoi ce wrapper existe
# --------------------------
# La procedure canonique documentee executait pytest DANS le conteneur `backend-qa`,
# qui porte l'environnement inline de `docker-compose.qa.yml`. Une invocation depuis
# l'hote heritait donc de rien : mesure C3-BASELINE-R0, 19 echecs sur 1314 tests,
# tous imputables a deux variables absentes — `REDIS_URL` (18) et
# `REFRESH_TOKEN_PEPPER` (1). Aucun defaut produit. Ces 19 rouges ont ete
# diagnostiques deux fois comme une dette backend inexistante.
#
# Ce script ne reimplemente RIEN : il pose les endpoints joignables depuis l'hote et
# les valeurs test-only manquantes, puis delegue a `scripts/run_backend_tests.py` —
# le runner canonique deja utilise par `docker-ci.yml`. Garde fail-closed, cycle de
# vie de la base jetable, PostGIS et nettoyage Redis restent implementes une seule
# fois, la-bas.
#
# Usage :
#   sh scripts/qa-backend-pytest-host.sh                          # suite complete
#   sh scripts/qa-backend-pytest-host.sh tests/test_weather.py    # un fichier
#   sh scripts/qa-backend-pytest-host.sh -k interest_count -q     # selection
#   sh scripts/qa-backend-pytest-host.sh tests/test_feed.py::test_x
#
# Tout argument est transmis tel quel a pytest. Le code de sortie de pytest est
# propage. La base jetable est creee puis supprimee par le runner a chaque execution.
#
# Ne vise JAMAIS `yunicity_qa` (baseline Playwright et revue manuelle), ni dev, ni
# prod : le garde `app.qa.guard` n'accepte qu'un nom prefixe `yunicity_test_` sur un
# hote local autorise. Ne vide JAMAIS la db Redis 0.
set -eu

REPO_ROOT=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)
cd "$REPO_ROOT/backend"

# --------------------------------------------------------------------------- #
# Endpoints QA joignables depuis l'hote
#
# `docker-compose.qa.yml` publie postgres sur 127.0.0.1:5455 et redis sur
# 127.0.0.1:6399. Les noms de service `postgres-qa` / `redis-qa` n'existent que
# dans le reseau Docker. `(127.0.0.1, 5455)` figure dans l'allowlist du garde.
# --------------------------------------------------------------------------- #
BACKEND_TEST_DB_HOST="${BACKEND_TEST_DB_HOST:-127.0.0.1}"
BACKEND_TEST_DB_PORT="${BACKEND_TEST_DB_PORT:-5455}"
# Index Redis >= 1 impose : la suite fait `flushdb`, et la db 0 porte la baseline QA.
BACKEND_TEST_REDIS_URL="${BACKEND_TEST_REDIS_URL:-redis://127.0.0.1:6399/1}"
export BACKEND_TEST_DB_HOST BACKEND_TEST_DB_PORT BACKEND_TEST_REDIS_URL

# --------------------------------------------------------------------------- #
# Marqueur de run QA — exige par `app.qa.guard`, sans lequel rien ne demarre.
# --------------------------------------------------------------------------- #
YUNICITY_QA_MODE=1
YUNICITY_QA_RUN_TOKEN="${YUNICITY_QA_RUN_TOKEN:-host-pytest-$$}"
export YUNICITY_QA_MODE YUNICITY_QA_RUN_TOKEN

# --------------------------------------------------------------------------- #
# Valeurs TEST-ONLY — jamais destinees a un environnement reel
#
# Elles reproduisent l'environnement inline de `docker-compose.qa.yml`. Ce ne sont
# pas des secrets : aucune ne donne acces a quoi que ce soit hors de cette suite,
# et la garde refuse toute cible non jetable meme avec ces valeurs. Elles restent
# surchargeables pour un poste dont la configuration differe.
# --------------------------------------------------------------------------- #
JWT_SECRET_KEY="${JWT_SECRET_KEY:-test-only-jwt-secret-at-least-32-characters!!}"
REFRESH_TOKEN_PEPPER="${REFRESH_TOKEN_PEPPER:-test-only-pepper-32-chars-minimum!!}"
EMAIL_PROVIDER="${EMAIL_PROVIDER:-console}"
EXPO_PUSH_ENABLED="${EXPO_PUSH_ENABLED:-false}"
LOCAL_VIDEO_STORAGE_BACKEND="${LOCAL_VIDEO_STORAGE_BACKEND:-filesystem}"
export JWT_SECRET_KEY REFRESH_TOKEN_PEPPER EMAIL_PROVIDER EXPO_PUSH_ENABLED
export LOCAL_VIDEO_STORAGE_BACKEND

# `DATABASE_URL` heritee ferait echouer `pytest_sessionstart` (politique destructive :
# aucun repli sur une base non validee). Le runner pose lui-meme `TEST_DATABASE_URL`.
unset DATABASE_URL || true

# Endpoints affiches sans identifiants : le runner imprime deja hote/port/base.
echo "postgres QA (hote) : ${BACKEND_TEST_DB_HOST}:${BACKEND_TEST_DB_PORT}"
echo "redis    QA (hote) : $(printf '%s' "$BACKEND_TEST_REDIS_URL" | sed 's#//[^@]*@#//#')"

exec python -m scripts.run_backend_tests "$@"
