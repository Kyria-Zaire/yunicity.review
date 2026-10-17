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
# Ce fichier garde le CYCLE DE VIE : arrêt, lancement, attente, enregistrement des
# PID, orchestration. Deux responsabilités distinctes vivent à côté :
#   scripts/lib/qa-process-identity.sh  — à qui appartient un PID, et peut-on le tuer
#   scripts/lib/qa-build-coherence.sh   — le build servi est-il celui du disque
#
# Usage — depuis N'IMPORTE QUEL répertoire :
#   sh <chemin>/scripts/qa-web-server.sh          # démarre (arrête d'abord NOTRE serveur)
#   sh <chemin>/scripts/qa-web-server.sh --stop   # arrête le serveur de CE worktree
#
# N'arrête QUE les processus dont la ligne de commande prouve le rôle attendu et
# ce worktree. Un serveur appartenant à un autre worktree Yunicity, ou tout
# occupant non identifiable, est nommé puis laissé en vie, et le démarrage est
# refusé : arrêtez-le depuis le worktree auquel il appartient.
set -eu

# La racine est déduite de l'EMPLACEMENT du script, jamais du répertoire courant.
# Un `WEB_DIR` relatif faisait servir le build d'un AUTRE worktree dès que le
# script était lancé d'ailleurs : build disque et build servi divergeaient en
# silence, et les mesures portaient sur un artefact qu'on croyait avoir remplacé.
RACINE=$(cd -- "$(dirname -- "$0")/.." && pwd)
WEB_DIR="$RACINE/frontend/apps/web"
# Forme Windows du même répertoire : les lignes de commande des processus sont
# écrites par Windows, pas par le shell.
WEB_DIR_WIN=$(cygpath -m "$WEB_DIR" 2>/dev/null || printf '%s' "$WEB_DIR")
PROXY_PORT=3002
NEXT_PORT=3003

# Les deux bibliothèques valident elles-mêmes leurs entrées : un `WEB_DIR_WIN` ou
# un `PROXY_PORT` absent interrompt ici, avant qu'un serveur ne soit lancé.
. "$RACINE/scripts/lib/qa-process-identity.sh"
. "$RACINE/scripts/lib/qa-build-coherence.sh"

# Répertoire d'état VOLONTAIREMENT commun à tous les worktrees : les ports 3002 et
# 3003 sont uniques sur la machine, donc un seul serveur vit à la fois. Partitionner
# par worktree ferait croire à un arrêt local alors que c'est l'unique serveur de la
# machine qui est en jeu.
LOG_DIR="${TMPDIR:-/tmp}/yunicity-e2e-server"
NEXT_LOG="$LOG_DIR/next-start.log"
PROXY_LOG="$LOG_DIR/reverse-proxy.log"
PID_DIR="$LOG_DIR/pids"

mkdir -p "$LOG_DIR" "$PID_DIR"

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
    role=$(basename "$pidfile" .pid)
    if [ -n "$pid" ]; then
      # Même un PID que nous avons nous-mêmes enregistré est revérifié : Windows
      # réattribue les PID, et un fichier périmé peut désigner un processus
      # entièrement différent devenu homonyme.
      vus="$vus $pid"
      if ! arreter_si_notre "$pid" "$role"; then
        refus="$refus $pid"
      fi
    fi
    rm -f "$pidfile"
  done
}

# Arrêt RÉEL, et vérifié. Les PID enregistrés d'abord ; puis les propriétaires de
# port encore vivants, car un fichier PID absent ou périmé laissait le serveur en
# vie alors que le script annonçait l'arrêt — c'est ainsi qu'un `next start` figé
# a servi un build obsolète pendant toute une campagne de mesures.
#
# La doctrine « aucun processus tiers tué » est portée par `arreter_si_notre` :
# rien n'est tué sans preuve du rôle ET du worktree. Un occupant appartenant à un
# autre worktree, ou dont l'appartenance reste incertaine, est nommé puis laissé en
# vie — et le démarrage est refusé plutôt que deviné.
stop_servers() {
  refus=""
  vus=""
  stop_recorded
  for port in "$NEXT_PORT" "$PROXY_PORT"; do
    if [ "$port" = "$NEXT_PORT" ]; then
      role="next-start"
    else
      role="reverse-proxy"
    fi
    for pid in $(port_owners "$port"); do
      # Un PID déjà traité via son fichier d'enregistrement n'est pas re-signalé :
      # le même refus listé deux fois laisse croire à deux occupants.
      case " $vus " in
        *" $pid "*) continue ;;
      esac
      vus="$vus $pid"
      if ! arreter_si_notre "$pid" "$role"; then
        refus="$refus $pid"
      fi
    done
  done

  # Les ports doivent être EFFECTIVEMENT libres : on le constate, on ne le suppose pas.
  i=0
  while [ "$i" -lt 30 ]; do
    restants=""
    for port in "$NEXT_PORT" "$PROXY_PORT"; do
      if [ -n "$(port_owner "$port")" ]; then
        restants="$restants $port"
      fi
    done
    if [ -z "$restants" ]; then
      return 0
    fi
    i=$((i + 1))
  done
  echo "ERREUR : port(s)$restants encore détenu(s) après arrêt."
  if [ -n "$refus" ]; then
    echo "         PID non tués faute d'appartenance prouvée :$refus"
  fi
  return 1
}

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

if [ "${1:-}" = "--stop" ]; then
  stop_servers
  echo "serveurs arrêtés — ports $NEXT_PORT et $PROXY_PORT vérifiés libres."
  exit 0
fi

# 1. Les ports doivent être libres, et on le vérifie après arrêt.
stop_servers

# 2. Build déjà validé, jamais reconstruit ici : la preuve porte sur un artefact figé.
if [ ! -f "$WEB_DIR/.next-build/BUILD_ID" ]; then
  echo "ERREUR : aucun build dans $WEB_DIR/.next-build — lancez d'abord 'pnpm build' dans $WEB_DIR."
  exit 1
fi
echo "build utilisé : $(cat "$WEB_DIR/.next-build/BUILD_ID")"

# 3. next start (interne, non exposé).
#    Le répertoire est passé EXPLICITEMENT, en chemin absolu, bien que le `cd`
#    suffirait : il inscrit ce worktree dans la ligne de commande du processus,
#    seule base fiable pour que `qa-process-identity.sh` prouve plus tard que ce
#    serveur est bien le nôtre.
(
  cd "$WEB_DIR"
  NEXT_BUILD_DIR=.next-build \
  NEXT_PUBLIC_API_URL="" \
  NEXT_PUBLIC_WEB_APP_URL="http://localhost:$PROXY_PORT" \
  nohup npx next start "$WEB_DIR_WIN" --hostname 127.0.0.1 --port "$NEXT_PORT" > "$NEXT_LOG" 2>&1 &
)

# 4. Façade same-origin.
#    `E2E_PROXY_HOST` n'est volontairement PAS defini : le harnais retombe sur
#    127.0.0.1 (C3-QA-SEC-01). Une revue LAN doit surcharger explicitement cette
#    variable, jamais dependre d'un defaut.
#
#    Chemin absolu pour la même raison qu'au-dessus : lancé en relatif, ce
#    processus n'exposait aucun worktree dans sa ligne de commande et devenait
#    donc impossible à reconnaître comme le nôtre.
(
  cd "$WEB_DIR"
  E2E_PROXY_PORT="$PROXY_PORT" \
  E2E_WEB_TARGET="http://127.0.0.1:$NEXT_PORT" \
  E2E_API_TARGET="http://127.0.0.1:8010" \
  nohup node "$WEB_DIR_WIN/scripts/e2e-reverse-proxy.mjs" > "$PROXY_LOG" 2>&1 &
)

echo "attente des réponses HTTP réelles…"
wait_http "http://localhost:$PROXY_PORT/__e2e/server-info" 200
wait_http "http://localhost:$PROXY_PORT/" 200
wait_http "http://localhost:$PROXY_PORT/api/v1/health" 200

# Enregistrement APRES readiness : les ports sont alors reellement lies.
record_port_owner "$NEXT_PORT" "next-start"
record_port_owner "$PROXY_PORT" "reverse-proxy"

# 6. Fail-closed : aucune mesure ne doit partir d'un build incohérent.
echo "vérification build servi / disque…"
if ! verifier_build_servi; then
  echo "         Serveurs arrêtés : aucune mesure ne doit partir d'un build incohérent."
  stop_servers || true
  exit 1
fi

echo "serveur production-like prêt sur ${E2E_PROXY_HOST:-127.0.0.1}:$PROXY_PORT"
echo "  pids  : next=$(cat "$PID_DIR/next-start.pid" 2>/dev/null) facade=$(cat "$PID_DIR/reverse-proxy.pid" 2>/dev/null)"
echo "  mode  : $(curl -s --max-time 5 "http://localhost:$PROXY_PORT/__e2e/server-info")"
echo "  logs  : $NEXT_LOG · $PROXY_LOG"
