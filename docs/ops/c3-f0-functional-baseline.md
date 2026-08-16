# C3-F0 — Functional Launch Baseline (closure)

État de référence du feature **C3-F0 « Functional Launch Baseline »**, avant la refonte UI/UX.
Ce document est factuel et destiné à la maintenance. L'infra QA détaillée vit dans
[`qa-baseline.md`](./qa-baseline.md) ; ce document-ci est la **clôture fonctionnelle** (commits,
couverture, définition de READY).

## 1. Objectif

Établir une base de lancement **vérifiable** : un environnement de test destructif isolé,
la correction du crash Recherche multi-type, et une couverture E2E fail-closed des parcours
critiques par interaction navigateur réelle — sans toucher au produit, aux données dev, ni à
la production.

## 2. Commits (branche `fix/c3-f0-t1-qa-isolation`, base `main@ee1ef10`)

| Ordre | SHA | Message |
|-------|-----|---------|
| T1 | `966e2eb` | `test(qa): isolate destructive integration environment` |
| T2 | `4b6f0c7` | `fix(search): serialize multi-type database queries` |
| T3 | `a4515d1` | `test(qa): add critical launch e2e baseline` |

Chaîne linéaire, aucun merge, aucun amend. HEAD = `a4515d1`.

## 3. Architecture QA (jetable, hermétique par configuration)

- Postgres/PostGIS `yunicity_qa` (port hôte **5455**) + Redis QA (port hôte **6399**) + backend QA
  (port **8010**) — via `docker-compose.qa.yml`, projet `yunicity-qa`, **sans volume persistant**
  (`tmpfs` → jetable).
- Garde anti-production **fail-closed** (`backend/app/qa/guard.py`) invoquée *dans* chaque fonction
  destructive (reset/seed), pas seulement dans le launcher.
- Services externes neutralisés par configuration (email `console`, push off, storage `filesystem`,
  aucune clé Stripe/Resend/R2/Sentry/GTFS/OpenWeather). La stack **ne charge pas** `backend/.env`.

## 4. Commandes sûres

```bash
CQA="docker compose -p yunicity-qa -f docker-compose.qa.yml"
$CQA up -d --build
$CQA exec -T backend-qa alembic upgrade head
$CQA exec -T backend-qa python -m app.qa.launcher guard-check
$CQA exec -T backend-qa python -m app.qa.launcher seed
$CQA exec -T backend-qa python -m app.qa.launcher verify
$CQA exec -T backend-qa python -m app.qa.launcher reset            # DROP+recreate schema (guardé)
$CQA exec -T backend-qa python -m app.qa.launcher reset-rate-limits # flush redis QA (guardé)
$CQA exec -T backend-qa pytest                                      # suite backend sur yunicity_qa
$CQA down -v                                                        # tear-down jetable
```

Frontend contre la QA (aucune modif produit) :
```bash
NEXT_PUBLIC_API_URL=http://localhost:8010 pnpm --filter web dev   # port 3002
cd frontend/apps/web && pnpm exec playwright test
```

### 4.1 Contrat de rejeu de la suite Playwright (C3.0-T4-R2)

La suite E2E **mute réellement la base** (adhésion tribu, demande d'adhésion privée, like vidéo,
notifications lues, intérêts de profil, publication…). Elle **n'est donc pas rejouable deux fois
sur une base déjà mutée** : un second passage sans remise à zéro échoue sur `06-mutations-ui`
(bouton « Rejoindre » absent, `aria-pressed` déjà à `true`, compteur de non-lus déjà nul…).

**Avant CHAQUE suite Playwright complète :**

```bash
CQA="docker compose -p yunicity-qa -f docker-compose.qa.yml"
$CQA exec -T backend-qa python -m app.qa.launcher reset   # DROP+recreate du schéma (guardé)
$CQA exec -T backend-qa alembic upgrade head              # obligatoire : reset laisse un schéma vide
$CQA exec -T backend-qa python -m app.qa.launcher seed
$CQA exec -T backend-qa python -m app.qa.launcher verify  # doit afficher "verify PASS"
$CQA exec -T backend-qa python -m app.qa.launcher reset-rate-limits
cd frontend/apps/web && pnpm exec playwright test
```

Règles associées :

- le `reset` cible **exclusivement `yunicity_qa`**, résolu depuis `TEST_DATABASE_URL` ;
- la garde `TEST_DATABASE_URL` est **obligatoire** — aucun fallback vers `DATABASE_URL` ;
- **ne jamais** utiliser `DATABASE_URL` seul pour une opération destructive ;
- la base **dev n'est jamais visée** (ni `yunicity_dev`, ni le port 5434) ;
- une seconde exécution **sans** ce cycle n'est **pas un protocole valide** : ses échecs ne
  constituent pas une régression produit ;
- Playwright ne déclenche **aucun** mécanisme destructif automatique — le cycle reste manuel
  et explicite, pour qu'aucune suite ne puisse effacer une base par inadvertance.

> Démarrage à froid : avec `.next` vide, la première compilation d'une route par `next dev`
> dépasse le budget d'assertion par défaut (mesuré à **28,2 s** pour la page de connexion).
> Les specs réellement exposées à cette première compilation (`00-smoke`, `07-video-report-drawer`)
> portent un plafond explicite via `e2e/cold-start.ts` — jamais d'attente fixe ni de warm-up.

## 5. Commandes interdites / dangereuses

- ❌ `docker compose down` **sans** `-p yunicity-qa -f docker-compose.qa.yml` (risque stack dev).
- ❌ Toute opération destructive avec `DATABASE_URL` seul (refusée par la garde).
- ❌ Reset/seed pointant 5434 / `yunicity_dev` / `yunicity_test` / hôte distant / Railway.
- ❌ `reset-rate-limits` contre Redis dev `localhost:6379` (refusé) — ne désactive jamais le limiteur.
- ❌ Indexer des artefacts Playwright (`test-results/`, `playwright-report/`) — gitignorés.

## 6. Politique `TEST_DATABASE_URL`

Base destructive **unique** = `yunicity_qa`, résolue **exclusivement** depuis `TEST_DATABASE_URL`.
**Aucun fallback** vers `DATABASE_URL`. `pytest_sessionstart` refuse une session où `DATABASE_URL`
est défini sans `TEST_DATABASE_URL` validé. Triplets autorisés : `localhost`/`127.0.0.1:5455` et
`postgres-qa:5432`, dbname `yunicity_qa` uniquement.

## 7. Politique Redis QA

`reset-rate-limits` exige le marqueur QA + `REDIS_URL` ∈ { `redis-qa:6379`, `localhost:6399`,
`127.0.0.1:6399` }. Refuse `localhost:6379` (dev), remote et Railway. **Flush uniquement** des
compteurs — le rate limiter n'est jamais désactivé.

## 8. Fixtures disponibles (déterministes, idempotentes, `reference_now` unique)

2 citoyens **connectables** (`qa.citizen.a@example.com` / `qa.citizen.b@example.com`, mot de passe
QA déterministe) + profils · tribu **publique** & **privée** (+ owners) · 3 posts · événement futur
(now+7j) · événement passé (now−7j) · intérêt événement · organisation vérifiée + `PartnerProfile`
actif · offre flash active · offre expirée (exclue du catalogue public) · vidéo locale (placeholder
filesystem) · 2 notifications non lues · Passport actif déterministe. **Aucune** capacité/rareté
inventée, aucune donnée prétendue « production ». Re-seed sans reset = 0 création (idempotent).

## 9. Parcours Playwright couverts

- **00-smoke / 03-map-smoke** : disponibilité app, map smoke.
- **01-auth** : login UI (`/auth/login` réel 200), persistance de session au reload, auth gate visiteur (401 + absence de chrome authentifié).
- **02-content** : Fil (rendu + `/feed` 200 + reload), Recherche multi-type UI (200 + résultat visible — fix T2), Recherche vide (empty state), contrat Recherche groupée (7 groupes).
- **04-parcours** (API réelle + relecture serveur) : intérêt/saved événement, publication, tribu join/leave, vidéo **like + unlike**, offres (flash présente, expirée absente), notifications read-all, profil intérêts, Passport.
- **05-mutations-ui** : intérêt événement par **clic UI** (bookmark détail) + persistance.
- **06-mutations-ui** : publication, tribu publique join/leave, tribu privée demande d'adhésion, vidéo like, notifications read-all, profil intérêts, onboarding — toutes par **clic navigateur réel** ; persistance prouvée côté serveur.

Contrat onboarding réel : **type → informations → conditions → finalisation** (aucun gate OTP ;
succès → session + redirection `/feed`).

## 10. Responsive couvert

Largeurs **1366 / 900 / 390** : login, Fil, Recherche, Passport (shell + nav, pas d'overflow
horizontal) ; détail événement, tribu publique, profil/réglages (contenu présent, pas d'overflow ;
surfaces détail immersives sur mobile).

## 11. Correctif Search (T2)

`SearchService` : les branches par type partagent une **unique `AsyncSession`** (non concurrente).
`asyncio.gather` provoquait `sqlalchemy IllegalStateChangeError` (500 sur recherche multi-type).
Remplacé par une **boucle série** sur `SEARCH_ALL_TYPE_ORDER` ; ordre, limites par type, ranking et
merge **inchangés**. Régression couverte par `test_search.py` + `test_search_concurrency.py`.

## 12. Résultats de référence (rejoués sur `yunicity_qa`)

| Gate | Résultat |
|------|----------|
| Backend complet | **1230 passed / 19 skipped / 0 failed** |
| Playwright complet | **32 passed / 0 failed** (functional-mobile 27 + responsive 5) |
| Garde (unit) + destructive targeting | 38 passed |
| Suite `tests/qa` | 39 passed |
| Search ciblé | 13 passed |
| Idempotence fixtures | seed #2 → 0 création |
| typecheck web (`tsc`) | exit 0 |
| lint web | 0 erreur (warnings produit préexistants) |
| build web production | exit 0 |
| ruff check / format --check | passed / 14 fichiers formatés |
| mypy (périmètres modifiés) | success |
| Supply-chain (`@playwright/test`) | SAFE |

## 13. Dettes explicitement **non bloquantes**

- Recherche **mono-type** et **filtres** : supportés côté API (contrat groupé vérifié) mais sans
  assertion E2E dédiée — couverture partielle non bloquante.
- Vidéo **unlike** : prouvé au niveau **API** (`DELETE /like`), pas par un clic UI dédié.
- Intérêts de profil : **persistés** ; aucune preuve qu'ils personnalisent le Fil (à ne pas affirmer).
- Warnings produit lint préexistants (media-has-caption, unused vars) — hors périmètre C3-F0.

## 14. Nettoyage

Toujours `docker compose -p yunicity-qa -f docker-compose.qa.yml down -v` (supprime containers,
réseau et volumes tmpfs). Ne jamais lancer un `down` nu. Arrêter le `next dev` (port 3002) après
les runs E2E. Artefacts Playwright conservés **uniquement** en cas d'échec, jamais indexés.

## 15. Ajouter une nouvelle fixture destructive

Toute nouvelle fixture/commande exécutant une opération destructive (`DROP`, `create_all`/`drop_all`,
reset, seed destructif) **DOIT** cibler `TEST_DATABASE_URL` et passer par le helper QA partagé
`tests/qa_support.py` (`configure_destructive_qa_db` / `resolve_destructive_qa_url`), adossé à
`app.qa.guard`. `DATABASE_URL` seul est interdit.

## 16. Ajouter un nouveau test E2E

- Cibler exclusivement le local fail-closed (`E2E_WEB_URL=localhost:3002`, `E2E_API_URL=localhost:8010`).
- Mutations par **interaction UI réelle** ; jamais de token fabriqué (login/register réels via fixtures).
- Prouver la persistance **côté serveur** (relecture API ou reload), pas par UI optimiste seule.
- Interaction robuste à l'hydratation via un **retry borné basé sur l'état** (pas d'attente arbitraire) ;
  ne jamais re-cliquer après une réponse réseau terminale (pas de double mutation).
- Sélecteurs accessibles et **exacts** (éviter les textes ambigus, ex. `Membre`/`Membres`).

## 17. Définition de READY (avant refonte UI/UX)

C3-F0 est **READY** lorsque, simultanément : chaîne Git correcte (3 commits, 0 hors périmètre) ;
protections QA cohérentes et fail-closed ; suite backend complète verte (1230/19) ; Playwright
complet vert (32/0) ; typecheck/lint/build acceptables ; ruff/mypy verts ; base dev **intacte**
(diff vide) ; supply-chain SAFE ; aucun parcours critique en FAIL/BLOCKED. La refonte UI/UX part
de cette base vérifiée, pas d'une hypothèse.
