#!/usr/bin/env sh
# Cohérence du build : SERVI == DISQUE, et DISQUE == SOURCE.
#
# Responsabilité UNIQUE : répondre « ce que le serveur renvoie correspond-il au
# code que je viens d'écrire ? ». Rien ici ne démarre ni n'arrête de processus.
#
# La question se décompose en deux, et la seconde a longtemps manqué. Un build
# vieux de onze heures reste PARFAITEMENT cohérent avec lui-même : le premier
# contrôle le valide sans broncher. Une correction produit a ainsi été mesurée
# trois fois sans avoir jamais été compilée, et le défaut a semblé persister
# alors qu'il n'avait simplement jamais été corrigé dans ce qui était servi.
#
# Pourquoi ce contrôle existe : un `BUILD_ID` lu sur le disque ne prouve RIEN sur
# ce que le serveur renvoie. Un `next start` resté en vie a déjà servi un build de
# trois semaines pendant une campagne entière de mesures, pendant que le disque
# portait un build neuf — toutes les conclusions de cette campagne étaient fausses.
#
# Le contrôle porte donc sur les chunks réellement référencés par les pages :
#   1. chacun doit EXISTER dans le `.next-build` qu'on vient de désigner — un
#      serveur figé sur un build antérieur échoue ici, ses hash n'existant pas ;
#   2. chacun doit être servi comme du JavaScript — un chunk manquant renvoyé en
#      HTML échoue ici, et le navigateur refuse alors de l'exécuter.
#
# Entrées requises, posées par l'appelant AVANT de sourcer ce fichier :
#   WEB_DIR     chemin POSIX de `frontend/apps/web` de CE worktree
#   PROXY_PORT  port de la façade à interroger
#
# `verifier_build_servi` et `verifier_build_a_jour` renvoient 0 si et seulement si
# leur cohérence est prouvée. L'appelant est responsable du fail-closed : refuser
# toute mesure sinon.

: "${WEB_DIR:?qa-build-coherence.sh : WEB_DIR doit être défini}"
: "${PROXY_PORT:?qa-build-coherence.sh : PROXY_PORT doit être défini}"

#: Pages sondées — une publique, une d'authentification, une applicative, afin de
#: couvrir les trois graphes de chunks que l'application charge réellement.
QA_COHERENCE_PAGES="/ /login /feed"

verifier_build_servi() {
  total=0
  absents=0
  non_js=0
  for page in $QA_COHERENCE_PAGES; do
    html=$(curl -s --max-time 20 "http://localhost:$PROXY_PORT$page" || echo "")
    chunks=$(printf '%s' "$html" | grep -oE '/_next/static/[^"]+\.js' | sort -u || true)
    for chunk in $chunks; do
      total=$((total + 1))
      relatif=$(printf '%s' "$chunk" | sed 's#^/_next/#.next-build/#')
      if [ ! -f "$WEB_DIR/$relatif" ]; then
        echo "  chunk ABSENT du disque : $chunk"
        absents=$((absents + 1))
      fi
      type=$(curl -s -o /dev/null -w '%{content_type}' --max-time 15 "http://localhost:$PROXY_PORT$chunk" || echo "")
      case "$type" in
        *javascript*) : ;;
        *)
          echo "  chunk NON servi en JS : $chunk -> ${type:-aucun type}"
          non_js=$((non_js + 1))
          ;;
      esac
    done
  done
  if [ "$total" -eq 0 ]; then
    echo "ERREUR : aucun chunk référencé — les pages servies sont vides ou illisibles."
    return 1
  fi
  if [ "$absents" -ne 0 ] || [ "$non_js" -ne 0 ]; then
    echo "ERREUR : build servi ≠ build disque ($absents absent(s), $non_js non-JS sur $total)."
    return 1
  fi
  echo "  build servi == disque — vérifié sur $total chunks"
  return 0
}


#: Arbres source qui entrent dans le bundle. `e2e/` en est exclu : les specs ne
#: sont pas compilées dans l'application, et les faire exiger une reconstruction
#: imposerait un build de quinze minutes à chaque correction de test.
QA_SOURCE_TREES="app components hooks lib"

verifier_build_a_jour() {
  marqueur="$WEB_DIR/.next-build/BUILD_ID"
  if [ ! -f "$marqueur" ]; then
    echo "  ERREUR : aucun build dans $WEB_DIR/.next-build"
    return 1
  fi

  arbres=""
  for arbre in $QA_SOURCE_TREES; do
    [ -d "$WEB_DIR/$arbre" ] && arbres="$arbres $WEB_DIR/$arbre"
  done
  # Les paquets partagés comptent aussi : `@yunicity/utils` porte les libellés
  # sur lesquels les specs s'appuient, et il est bundlé avec l'application.
  [ -d "$WEB_DIR/../../packages" ] && arbres="$arbres $WEB_DIR/../../packages"

  # `grep -v` sort 1 quand il ne filtre rien, et `head` ferme le tube : sans
  # `|| true` l'affectation ferait tomber un appelant en `set -e`, exactement
  # comme `grep -c` l'avait déjà fait dans le protocole.
  recents=$(
    find $arbres -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.css' \) \
      -newer "$marqueur" 2>/dev/null \
      | grep -v '/node_modules/' \
      | grep -v '/\.next' \
      | grep -v '/dist/' \
      | head -8 || true
  )

  if [ -n "$recents" ]; then
    echo "ERREUR : des sources sont PLUS RÉCENTES que le build servi."
    echo "         le build date du $(date -r "$marqueur" '+%Y-%m-%d %H:%M:%S' 2>/dev/null)"
    printf '%s\n' "$recents" | sed 's/^/           /'
    echo "         reconstruisez (pnpm build) puis relancez scripts/qa-web-server.sh"
    return 1
  fi
  echo "  build à jour avec la source — aucun fichier plus récent que $(cat "$marqueur")"
  return 0
}
