#!/usr/bin/env sh
# Identification des processus serveurs QA — « ce PID est-il le nôtre ? »
#
# Responsabilité UNIQUE : répondre à qui appartient un processus, et n'autoriser
# un arrêt que lorsque la réponse est prouvée. Rien ici ne démarre, n'arrête par
# lot, ni ne touche au build : `qa-web-server.sh` garde le cycle de vie.
#
# Pourquoi la question est difficile — et pourquoi elle mérite son propre fichier :
# « un node.exe détient le port 3002 » ne prouve rien. N'importe quel outil Node
# de la machine peut occuper ce port, et le serveur d'un AUTRE worktree Yunicity y
# répond de façon indiscernable. Un arrêt « au port » a déjà tué le mauvais
# serveur, et un arrêt qui échoue en silence a laissé un `next start` figé servir
# un build obsolète pendant toute une campagne de mesures.
#
# Entrées requises, posées par l'appelant AVANT de sourcer ce fichier :
#   WEB_DIR_WIN  chemin Windows de `frontend/apps/web` de CE worktree
#   NEXT_PORT    port de `next start`, qui sert de second marqueur de rôle
#
# Sorties : `appartenance` rend `notre` · `autre:<chemin>` · `incertain:<raison>`.
# Seul `notre` autorise un arrêt. Tout le reste est nommé, jamais tué.

: "${WEB_DIR_WIN:?qa-process-identity.sh : WEB_DIR_WIN doit être défini}"
: "${NEXT_PORT:?qa-process-identity.sh : NEXT_PORT doit être défini}"

# Normalisation avant toute comparaison : minuscules, et `\` ramené à `/`. Une
# même ligne de commande mélange les deux séparateurs (`next` reçoit l'argument
# tel quel, Node réécrit son propre chemin avec `\`), et la casse du lecteur
# varie. Comparer après normalisation évite d'entretenir deux variantes.
# `\134` est le backslash en octal : l'écrire littéralement fait avertir `tr`.
normaliser() {
  printf '%s' "$1" | tr '[:upper:]' '[:lower:]' | tr '\134' '/'
}

#: Ce worktree, sous la forme utilisée pour toutes les comparaisons.
WEB_DIR_CMP=$(normaliser "$WEB_DIR_WIN")

port_owner() {
  netstat -ano 2>/dev/null | grep ":$1 " | grep LISTENING | awk '{print $NF}' | sort -u | head -1
}

# TOUS les propriétaires du port, pas seulement le premier : une liaison IPv4 et
# une IPv6 peuvent appartenir à deux PID, et n'en tuer qu'un laisse le port pris.
port_owners() {
  netstat -ano 2>/dev/null | grep ":$1 " | grep LISTENING | awk '{print $NF}' | sort -u
}

image_de_pid() {
  tasklist //FI "PID eq $1" //NH //FO CSV 2>/dev/null | head -1 | sed -E 's/^"([^"]*)".*/\1/'
}

ligne_de_commande() {
  powershell.exe -NoProfile -NonInteractive -Command \
    "(Get-CimInstance Win32_Process -Filter \"ProcessId=$1\").CommandLine" 2>/dev/null \
    | tr -d '\r' | tr '\n' ' '
}

# APPARTENANCE d'un PID, exigée avant tout arrêt.
#
# Deux preuves sont exigées dans la ligne de commande : le marqueur du RÔLE
# attendu, et le chemin de CE worktree. `qa-web-server.sh` lance ses deux serveurs
# avec des chemins absolus précisément pour qu'ils soient identifiables ici.
appartenance() {
  pid="$1"
  role="$2"

  image=$(image_de_pid "$pid")
  case "$image" in
    node.exe | node) : ;;
    *)
      printf 'incertain:image %s' "${image:-inconnue}"
      return 0
      ;;
  esac

  cl=$(ligne_de_commande "$pid")
  if [ -z "$cl" ]; then
    printf 'incertain:ligne de commande illisible'
    return 0
  fi

  # Deux marqueurs par rôle : le binaire ET le paramètre de port. « node contenant
  # next » décrirait trop de processus ; « next ... --port 3003 » décrit celui-ci.
  case "$role" in
    next-start)
      marqueur="next"
      marqueur2="--port $NEXT_PORT"
      ;;
    reverse-proxy)
      marqueur="e2e-reverse-proxy.mjs"
      marqueur2=""
      ;;
    *)
      printf 'incertain:rôle %s inconnu' "$role"
      return 0
      ;;
  esac

  # Comparaisons en PUR SHELL, sans processus externe.
  #
  # `grep -iF` se termine par SIGABRT (code 134) sur ces lignes de commande dans
  # le grep MSYS de cet environnement — `-i` et `-F` fonctionnent séparément,
  # jamais ensemble. Un prédicat qui plante renvoyait « marqueur absent » pour
  # une commande qui le contenait, et le script refusait d'arrêter son propre
  # serveur. `case` ne dépend d'aucun binaire et ne peut pas échouer ainsi.
  cl_cmp=$(normaliser "$cl")

  case "$cl_cmp" in
    *"$marqueur"*) : ;;
    *)
      printf 'incertain:commande sans le marqueur « %s »' "$marqueur"
      return 0
      ;;
  esac
  if [ -n "$marqueur2" ]; then
    case "$cl_cmp" in
      *"$marqueur2"*) : ;;
      *)
        printf 'incertain:commande sans « %s »' "$marqueur2"
        return 0
        ;;
    esac
  fi

  case "$cl_cmp" in
    *"$WEB_DIR_CMP"*)
      printf 'notre'
      return 0
      ;;
  esac

  # `cl_cmp` est déjà en minuscules et en `/` : ni `-i` ni les deux variantes de
  # séparateur ne sont nécessaires ici, et l'on reste à l'écart de `-iF`.
  autre=$(printf '%s' "$cl_cmp" \
    | grep -oE '[a-z]:/[^" ]*/frontend/(apps/web|node_modules)' \
    | head -1)
  if [ -n "$autre" ]; then
    printf 'autre:%s' "$autre"
    return 0
  fi
  printf 'incertain:aucun worktree identifiable dans la commande'
}

# Arrête un PID UNIQUEMENT s'il nous appartient. Renvoie 1 sinon, après l'avoir nommé.
arreter_si_notre() {
  pid="$1"
  role="$2"
  verdict=$(appartenance "$pid" "$role")
  case "$verdict" in
    notre)
      echo "arrêt du PID $pid ($role, ce worktree)"
      taskkill //PID "$pid" //T //F >/dev/null 2>&1 || true
      return 0
      ;;
    autre:*)
      echo "PID $pid ($role) appartient à un AUTRE worktree : ${verdict#autre:}"
      echo "         NON tué. Arrêtez-le depuis ce worktree-là."
      return 1
      ;;
    *)
      echo "PID $pid : appartenance incertaine (${verdict#incertain:}) — NON tué."
      return 1
      ;;
  esac
}
