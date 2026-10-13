#!/usr/bin/env sh
# Protocole UNIQUE d'execution d'UNE spec E2E, avec baseline dediee.
#
#   usage : sh <chemin>/scripts/qa-spec-run.sh <spec-sans-extension> [--webkit]
#
# ── Pourquoi ce fichier existe ───────────────────────────────────────────────
# Les mesures de la campagne PR202 ont d'abord ete faites par LOTS : une seule
# baseline pour quatre a cinq specs. Les specs suivantes voyaient donc les
# donnees creees par les precedentes. Deux experiences l'ont etabli :
#
#   · 23 et 24 echouaient sous WebKit en lot, et passent 32/32 et 4/4 avec une
#     baseline dediee — ce n'etaient pas des divergences de moteur ;
#   · 21, 27 et 30 rougissaient sur des tests DIFFERENTS a chaque rejeu.
#
# Consequence : sous baseline partagee, un vert reste credible, mais un rouge
# n'est pas attribuable. Ce protocole supprime cette ambiguite, et remplace les
# remises a zero improvisees — un `docker exec ... reset-rate-limits` glisse
# entre deux commandes n'est pas un protocole.
#
# ── Ce qu'il garantit ────────────────────────────────────────────────────────
# Preconditions verifiees AVANT la mesure : quatre services QA sains, serveur de
# preuve en mode production-like, build servi identique au disque, garde QA
# fermee. Puis une baseline COMPLETE, puis la verification que les fixtures dont
# les specs dependent sont bien servies. Enfin UNE spec, un worker, aucun retry,
# et le vrai code de sortie.
#
# ── Ce qu'il preserve ────────────────────────────────────────────────────────
# `reset` ne touche que le SCHEMA : les medias d'exemple survivent sur le disque
# et le `seed` les reecrit. L'effacement des quotas est cible sur le prefixe
# `rl:`, donc les cles `arq:` de la file de taches et `yunicity-media-video:`
# restent en place — un `flushdb` les detruisait.
set -eu

SPEC="${1:-}"
if [ -z "$SPEC" ]; then
  echo "usage : sh scripts/qa-spec-run.sh <spec-sans-extension> [--webkit]"
  exit 2
fi
MOTEUR="${2:-}"
PREMIER_ECHEC="${3:-}"

RACINE=$(cd -- "$(dirname -- "$0")/.." && pwd)
WEB_DIR="$RACINE/frontend/apps/web"
PROXY_PORT=3002
COMPOSE="docker compose -p yunicity-qa -f $RACINE/docker-compose.qa.yml"
EXEC="$COMPOSE exec -T backend-qa"

. "$RACINE/scripts/lib/qa-build-coherence.sh"

if [ ! -f "$WEB_DIR/e2e/functional/$SPEC.spec.ts" ]; then
  echo "ERREUR : spec introuvable — $WEB_DIR/e2e/functional/$SPEC.spec.ts"
  exit 2
fi

case "$MOTEUR" in
  --webkit)
    OPT_MOTEUR="--config=playwright.webkit-r1.config.ts"
    NOM_MOTEUR="webkit-r1-mobile"
    ;;
  "")
    OPT_MOTEUR="--project=functional-mobile"
    NOM_MOTEUR="functional-mobile"
    ;;
  *)
    echo "ERREUR : second argument inconnu — $MOTEUR (attendu : --webkit)"
    exit 2
    ;;
esac

# Identifiant de run : les journaux ne doivent JAMAIS s'ecraser. Un chemin fixe
# detruisait la preuve du passage precedent a chaque relance — et c'est
# precisement entre deux passages qu'on compare.
HORODATAGE=$(date +%Y%m%d-%H%M%S)

# --premier-echec : arrete la mesure des le premier test rouge.
#
# Playwright DETRUIT le worker apres un echec et en recree un : les fixtures
# `scope: "worker"` se rejouent, donc une connexion par echec. Au-dela du
# seuil, tous les tests suivants rapportent `RATE_LIMITED` et leur vraie cause
# devient illisible — mesure sur les specs 10 et 19.
#
# On ne touche ni aux limites produit ni aux cles Redis : on cesse d'enchainer
# des echecs dont le premier suffit au diagnostic. Mettre les sessions en cache
# pour eviter ces connexions a ete essaye et ABANDONNE : le backend fait tourner
# ses jetons de rafraichissement, donc un `storageState` reutilise est rejete.
#
# L'inventaire, lui, tourne SANS cette option : il veut la liste complete.
OPT_ECHEC=""
case "$PREMIER_ECHEC" in
  --premier-echec) OPT_ECHEC="--max-failures=1" ;;
  "") : ;;
  *) echo "ERREUR : troisieme argument inconnu — $PREMIER_ECHEC"; exit 2 ;;
esac

echo "######## PROTOCOLE QA — spec=$SPEC moteur=$NOM_MOTEUR run=$HORODATAGE"

# ── 1. Preconditions ─────────────────────────────────────────────────────────
echo "== 1/5 preconditions =="

manquants=""
for s in backend-qa video-worker-qa redis-qa postgres-qa; do
  etat=$($COMPOSE ps --format '{{.Name}} {{.Status}}' 2>/dev/null | grep -- "-$s" | head -1)
  case "$etat" in
    *healthy*) : ;;
    *) manquants="$manquants $s" ;;
  esac
done
if [ -n "$manquants" ]; then
  echo "ERREUR : service(s) QA non sain(s) :$manquants"
  exit 1
fi
echo "  quatre services QA sains"

mode=$(curl -s --max-time 10 "http://localhost:$PROXY_PORT/__e2e/server-info" 2>/dev/null || echo "")
case "$mode" in
  *production-like*) echo "  serveur de preuve : production-like" ;;
  *)
    echo "ERREUR : serveur de preuve absent ou non production-like -> ${mode:-aucune reponse}"
    echo "         lancez d'abord : sh scripts/qa-web-server.sh"
    exit 1
    ;;
esac

echo "  build servi / disque :"
if ! verifier_build_servi; then
  echo "ERREUR : aucune mesure ne part d'un build incoherent."
  exit 1
fi

# Le controle precedent prouve que le serveur rend le build du disque. Il ne dit
# RIEN de la source : un build de onze heures est coherent avec lui-meme. Une
# correction produit a ete mesuree trois fois sans avoir jamais ete compilee.
echo "  build / source :"
if ! verifier_build_a_jour; then
  echo "ERREUR : aucune mesure ne porte sur du code non compile."
  exit 1
fi

$EXEC python -m app.qa.launcher guard-check > /dev/null
echo "  garde QA fermee (base jetable, hors Railway, sans push)"

# ── 2. Baseline dediee ───────────────────────────────────────────────────────
echo "== 2/5 baseline dediee =="
# Le journal ENTIER est conserve — les migrations y figurent, et c'est la qu'on
# les cherche en cas d'echec. Seul le relevé final est affiche : noyer le verdict
# sous soixante lignes de migrations rend le resultat illisible.
JOURNAL_BASELINE="${TMPDIR:-/tmp}/yunicity-qa-spec/baseline-$SPEC-$HORODATAGE.log"
mkdir -p "$(dirname "$JOURNAL_BASELINE")"
set +e
( cd "$RACINE" && sh scripts/qa-playwright-baseline.sh ) > "$JOURNAL_BASELINE" 2>&1
RC_BASE=$?
set -e
grep -E 'expected=|media .*bytes=|verify (PASS|FAIL)|rate-limit reset OK|baseline QA prete' "$JOURNAL_BASELINE" \
  | sed 's/^/  /'
if [ "$RC_BASE" -ne 0 ]; then
  echo "ERREUR : baseline en echec (exit=$RC_BASE) — journal : $JOURNAL_BASELINE"
  tail -15 "$JOURNAL_BASELINE" | sed 's/^/    /'
  exit 1
fi
echo "  journal baseline : $JOURNAL_BASELINE"

# ── 3. Fixtures dont les specs dependent ─────────────────────────────────────
#    Le `verify` de la baseline couvre les comptes en base, et desormais la
#    PRESENCE sur disque de chaque media seme. Il ne dit rien du SERVICE de la
#    route, et c'est precisement ce qui avait manque : les exemples QA etaient
#    adresses sous un prefixe que nulle route ne servait, et les cartes video
#    basculaient sur leur repli sans qu'aucun compteur ne bouge.
echo "== 3/5 fixtures servies =="
# Les URLs ne sont PLUS ecrites ici. Elles sont lues dans le journal, ou
# `verify` les imprime depuis la base -- seule source de verite. Un chemin code
# en dur dans ce script redeviendrait faux au premier changement de convention
# de cle : c'est exactement ce qui vient d'arriver, la fixture vivant a plat
# sous `local-video/qa/` quand le produit sert
# `local-video/<ville>/<id>/processed.mp4`.
urls=$(sed -n 's/^ *\(media_url\|thumbnail_url\)=//p' "$JOURNAL_BASELINE" | sort -u)
if [ -z "$urls" ]; then
  echo "ERREUR : la baseline n'a publie aucune URL de media -- verify muet ?"
  exit 1
fi
for u in $urls; do
  attendu="image/png"
  case "$u" in *.mp4) attendu="video/mp4" ;; esac
  rep=$(curl -s -o /dev/null -w '%{http_code} %{content_type}' --max-time 10 "$u" \
    2>/dev/null || echo "000 -")
  case "$rep" in
    "200 $attendu"*) echo "  servi $rep <- $u" ;;
    *)
      echo "ERREUR : media non servi -- attendu 200 $attendu, obtenu $rep"
      echo "         $u"
      exit 1
      ;;
  esac
done

# ── 4. Mesure ────────────────────────────────────────────────────────────────
echo "== 4/5 mesure =="
JOURNAL="${TMPDIR:-/tmp}/yunicity-qa-spec/$NOM_MOTEUR-$SPEC-$HORODATAGE.log"
mkdir -p "$(dirname "$JOURNAL")"
set +e
# `outputDir` vaut `test-results` dans la config, et Playwright le VIDE au
# demarrage de chaque run. Enchainer les specs detruisait donc les captures et
# les traces des precedentes : seul le journal texte survivait, et c'est
# precisement la capture qui tranche un « element not found ». Chaque run ecrit
# desormais dans son propre repertoire horodate, comme son journal.
ARTEFACTS="${TMPDIR:-/tmp}/yunicity-qa-spec/artefacts/$NOM_MOTEUR-$SPEC-$HORODATAGE"
mkdir -p "$ARTEFACTS"
( cd "$WEB_DIR" && npx playwright test "e2e/functional/$SPEC.spec.ts" \
    $OPT_MOTEUR $OPT_ECHEC --reporter=list --workers=1 --retries=0 \
    --output="$ARTEFACTS" ) > "$JOURNAL" 2>&1
RC=$?
set -e

# ── 5. Releve ────────────────────────────────────────────────────────────────
echo "== 5/5 releve =="
echo "  PLAYWRIGHT EXIT REEL = $RC"
grep -oE '[0-9]+ (passed|failed|skipped|flaky)' "$JOURNAL" 2>/dev/null | sed 's/^/    /'
# `grep -c` affiche 0 et sort 1 quand il ne trouve RIEN — c'est-a-dire dans le
# cas favorable. Sous `set -e`, cette affectation abandonnait donc le script
# avant le `exit "$RC"` final : le protocole sortait en erreur alors que
# Playwright avait reussi, et la ligne « journal complet » n'etait jamais
# imprimee. Le `|| true` rend la substitution reussie sans masquer quoi que ce
# soit : la valeur affichee par grep, 0 comprise, est conservee.
quota=$(grep -c 'RATE_LIMITED' "$JOURNAL" 2>/dev/null || true)
quota=${quota:-0}
if [ "$quota" -gt 0 ]; then
  echo "    ATTENTION quota atteint pendant la mesure ($quota) — resultat PROVISOIRE"
fi
echo "  journal complet : $JOURNAL"
if [ -n "$(ls -A "$ARTEFACTS" 2>/dev/null)" ]; then
  echo "  artefacts (captures, traces) : $ARTEFACTS"
else
  rmdir "$ARTEFACTS" 2>/dev/null || true
fi

# Le code de sortie du protocole EST celui de Playwright : un echec reste
# propage, un succes reste un succes.
exit "$RC"
