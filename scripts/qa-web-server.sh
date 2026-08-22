#!/usr/bin/env sh
# Serveur web QA production-like pour Playwright (C3.1-R1I).
#
# Remplace `next dev` comme support de preuve : le serveur de développement
# recompile à la demande et son cache croît sans borne (mesuré : 2,1 Go de RSS et
# `/feed` à 11,6 s après une suite longue, contre 0,87 s à froid), ce qui a produit
# des rouges non reproductibles et une caractérisation produit erronée sur /passport.
#
# Topologie montée ici :
#
#     navigateur → :3002 (façade) ─┬─ /api/v1/*  → 127.0.0.1:8010  (API QA)
#                                  └─ le reste   → 127.0.0.1:3003  (next start)
#
# Le navigateur ne voit qu'une seule origine : le contrat same-origin est conservé
# sans relâcher la garde de production du proxy applicatif.
#
# Ce script NE TOUCHE PAS à la base : aucun reset, aucun seed. La préparation QA
# reste `scripts/qa-playwright-baseline.sh`, commande opérateur distincte et visible.
#
# Usage :
#   sh scripts/qa-web-server.sh          # démarre (arrête d'abord le serveur du worktree)
#   sh scripts/qa-web-server.sh --stop   # arrête uniquement les serveurs de ce worktree
set -eu

WEB_DIR="frontend/apps/web"
PROXY_PORT=3002
NEXT_PORT=3003
LOG_DIR="${TMPDIR:-/tmp}/yunicity-e2e-server"
NEXT_LOG="$LOG_DIR/next-start.log"
PROXY_LOG="$LOG_DIR/reverse-proxy.log"
PID_DIR="$LOG_DIR/pids"

mkdir -p "$LOG_DIR" "$PID_DIR"

port_owner() {
  netstat -ano 2>/dev/null | grep ":$1 " | grep LISTENING | awk '{print $NF}' | sort -u | head -1
}

# Les PID enregistres sont les PROPRIETAIRES DE PORT releves par netstat, jamais `$!` :
# sous Git Bash, `$!` renvoie un identifiant de job, que `taskkill` n'accepte pas — le
# serveur survivait alors a l'arret (constate en C3.1-R1I).
record_port_owner() {
  owner=$(port_owner "$1")
  if [ -n "$owner" ]; then
    echo "$owner" > "$PID_DIR/$2.pid"
  fi
}

stop_recorded() {
  for pidfile in "$PID_DIR"/*.pid; do
    [ -e "$pidfile" ] || continue
    pid=$(cat "$pidfile" 2>/dev/null || echo "")
    if [ -n "$pid" ]; then
      echo "arrêt du processus $pid ($(basename "$pidfile" .pid))"
      taskkill //PID "$pid" //T //F >/dev/null 2>&1 || true
    fi
    rm -f "$pidfile"
  done
}

if [ "${1:-}" = "--stop" ]; then
  stop_recorded
  echo "serveurs du worktree arrêtés."
  exit 0
fi

# 1. Le port doit être libre, ou occupé par un serveur que CE script a démarré.
stop_recorded
sleep 1
owner=$(port_owner "$PROXY_PORT")
if [ -n "$owner" ]; then
  echo "ERREUR : le port $PROXY_PORT est occupé par le PID $owner, qui n'appartient pas à ce script."
  echo "         Arrêtez-le explicitement avant de relancer — aucun processus tiers n'est tué ici."
  exit 1
fi

# 2. Build déjà validé, jamais reconstruit ici : la preuve porte sur un artefact figé.
if [ ! -f "$WEB_DIR/.next-build/BUILD_ID" ]; then
  echo "ERREUR : aucun build dans $WEB_DIR/.next-build — lancez d'abord 'pnpm build' dans $WEB_DIR."
  exit 1
fi
echo "build utilisé : $(cat "$WEB_DIR/.next-build/BUILD_ID")"

# 3. next start (interne, non exposé).
(
  cd "$WEB_DIR"
  NEXT_BUILD_DIR=.next-build \
  NEXT_PUBLIC_API_URL="" \
  NEXT_PUBLIC_WEB_APP_URL="http://localhost:$PROXY_PORT" \
  nohup npx next start --hostname 127.0.0.1 --port "$NEXT_PORT" > "$NEXT_LOG" 2>&1 &
)

# 4. Façade same-origin.
#    `E2E_PROXY_HOST` n'est volontairement PAS defini : le harnais retombe sur
#    127.0.0.1 (C3-QA-SEC-01). Une revue LAN doit surcharger explicitement cette
#    variable, jamais dependre d'un defaut.
(
  cd "$WEB_DIR"
  E2E_PROXY_PORT="$PROXY_PORT" \
  E2E_WEB_TARGET="http://127.0.0.1:$NEXT_PORT" \
  E2E_API_TARGET="http://127.0.0.1:8010" \
  nohup node scripts/e2e-reverse-proxy.mjs > "$PROXY_LOG" 2>&1 &
)

# 5. Attente de VRAIES réponses HTTP, jamais d'une pause fixe.
wait_http() {
  url="$1"
  expected="$2"
  i=0
  while [ "$i" -lt 120 ]; do
    code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" || echo 000)
    [ "$code" = "$expected" ] && { echo "  $url -> $code"; return 0; }
    i=$((i + 1))
  done
  echo "ERREUR : $url n'a jamais répondu $expected (dernier code : $code)"
  echo "  logs : $NEXT_LOG · $PROXY_LOG"
  return 1
}

echo "attente des réponses HTTP réelles…"
wait_http "http://localhost:$PROXY_PORT/__e2e/server-info" 200
wait_http "http://localhost:$PROXY_PORT/" 200
wait_http "http://localhost:$PROXY_PORT/api/v1/health" 200

# Enregistrement APRES readiness : les ports sont alors reellement lies.
record_port_owner "$NEXT_PORT" "next-start"
record_port_owner "$PROXY_PORT" "reverse-proxy"

echo "serveur production-like prêt sur ${E2E_PROXY_HOST:-127.0.0.1}:$PROXY_PORT"
echo "  pids  : next=$(cat "$PID_DIR/next-start.pid" 2>/dev/null) facade=$(cat "$PID_DIR/reverse-proxy.pid" 2>/dev/null)"
echo "  mode  : $(curl -s --max-time 5 "http://localhost:$PROXY_PORT/__e2e/server-info")"
echo "  logs  : $NEXT_LOG · $PROXY_LOG"
