# QA Isolated Baseline (C3-F0-T1)

Disposable, hermetic-by-configuration QA stack for future mutational/E2E tests.
**Never** touches `yunicity_dev`, Railway, staging or production.

## Guarantees

- Dedicated Postgres/PostGIS (`yunicity_qa`) + Redis, distinct host ports.
  Postgres/Redis data stay on **tmpfs**. Story/post media lives in the named
  volume `yunicity-qa-story-media` (QA-only, wiped by `down -v` or
  `python -m app.qa.launcher reset`). Never shared with `yunicity_dev`.
- The **only** destructible database is `yunicity_qa`, reached through
  `TEST_DATABASE_URL` — there is **no fallback** to `DATABASE_URL`.
- Every destructive/seed op passes the fail-closed guard (`app/qa/guard.py`),
  invoked *inside* the destructive functions, not just the launcher.
- External effects neutralized by configuration (email `console`, push off,
  storage `filesystem`, no Stripe/Resend/R2/Sentry/GTFS/OpenWeather keys).

## Allowed destructive targets (guard)

| host | port | dbname |
|------|------|--------|
| `localhost` / `127.0.0.1` | 5455 | `yunicity_qa` |
| `postgres-qa` | 5432 | `yunicity_qa` |

Anything else (dev port 5434, `yunicity_dev`, `yunicity_test`, remote host,
Railway/Neon/Supabase/AWS/proxy, active external provider/key, missing QA marker)
is **refused**.

## Ports (distinct from dev)

| service | QA host port | dev host port |
|---------|-------------|---------------|
| postgres | 5455 | 5434 |
| redis | 6399 | 6379 |
| backend | 8010 | 8000 |

## Commandes canoniques (C3.1-R1G)

Deux bases, deux propriétaires — ne jamais les confondre :

| Base | Propriétaire | Préparée par |
|------|--------------|--------------|
| `yunicity_qa` | Playwright + revue manuelle | `sh scripts/qa-playwright-baseline.sh` |
| `yunicity_test_<unique>` | suite pytest backend | créée/supprimée par le runner |

### Baseline Playwright

```bash
sh scripts/qa-playwright-baseline.sh                  # guard, reset, migrate, seed, verify, rate-limits
sh scripts/qa-playwright-baseline.sh --with-playwright
```

La mutation de `yunicity_qa` est **toujours** dans la commande opérateur.
`e2e/global-setup.ts` ne mute rien : il **vérifie** que la baseline est amorcée
(lecture publique de la tribu de seed) et refuse de démarrer sinon.

### Suite backend

```bash
docker compose -p yunicity-qa -f docker-compose.qa.yml exec -T backend-qa   python -m scripts.run_backend_tests            # suite complète
```

Le runner crée une base jetable `yunicity_test_<unique>`, y exécute pytest sur un
Redis logique distinct (`/1`), puis la supprime. **`pytest` nu est refusé**
(`DBNAME_NOT_DISPOSABLE_TEST:yunicity_qa`) : c'est le garde `evaluate_pytest_database_target`
qui protège la baseline de revue — un run pytest la détruisait auparavant.

## Lifecycle

Always pass the project name **and** the QA file. Never run a bare
`docker compose down` (it could hit the dev stack).

```bash
# 1. up + health
docker compose -p yunicity-qa -f docker-compose.qa.yml up -d --build
docker compose -p yunicity-qa -f docker-compose.qa.yml ps

# 2. migrate (schema on yunicity_qa)
docker compose -p yunicity-qa -f docker-compose.qa.yml exec -T backend-qa alembic upgrade head

# 3. guard-check + seed + verify
docker compose -p yunicity-qa -f docker-compose.qa.yml exec -T backend-qa python -m app.qa.launcher guard-check
docker compose -p yunicity-qa -f docker-compose.qa.yml exec -T backend-qa python -m app.qa.launcher seed
docker compose -p yunicity-qa -f docker-compose.qa.yml exec -T backend-qa python -m app.qa.launcher verify

# 4. reset (drop schema) -> reseed
docker compose -p yunicity-qa -f docker-compose.qa.yml exec -T backend-qa python -m app.qa.launcher reset
docker compose -p yunicity-qa -f docker-compose.qa.yml exec -T backend-qa alembic upgrade head
docker compose -p yunicity-qa -f docker-compose.qa.yml exec -T backend-qa python -m app.qa.launcher seed
docker compose -p yunicity-qa -f docker-compose.qa.yml exec -T backend-qa python -m app.qa.launcher verify

# 5. tear down (disposable)
docker compose -p yunicity-qa -f docker-compose.qa.yml down -v
```

## Frontend against QA (no UI change)

Point the web app at the QA backend without touching any component:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8010/api/v1 pnpm --filter web dev
```

## Guard unit tests (network-free, run before anything destructive)

```bash
cd backend && pytest tests/qa/test_qa_guard.py -q
```

## Fixture idempotence (requires QA schema)

```bash
docker compose -p yunicity-qa -f docker-compose.qa.yml exec -T \
  -e TEST_DATABASE_URL=postgresql+asyncpg://yunicity_qa:yunicity_qa_password@postgres-qa:5432/yunicity_qa \
  backend-qa pytest tests/qa/test_qa_fixtures_idempotent.py -q
```

## Exécuter la suite backend — deux modes distincts (C3-BASELINE-R2)

Les deux modes ci-dessous ne prouvent **pas** la même chose. Confondre l'un pour
l'autre a déjà produit deux diagnostics erronés : voir « Les 19 faux rouges ».

### A. Mode CI actuel — unitaire seulement

`.github/workflows/backend-ci.yml` exécute `ruff check .`, `mypy app tests` puis
`pytest`, **sans bloc `services:` ni `env:`** : ni Postgres ni Redis ne sont
provisionnés. Sans `TEST_DATABASE_URL` **ni** `DATABASE_URL`, `pytest_sessionstart`
(`backend/tests/conftest.py`) retourne immédiatement et les fixtures DB se skippent
une par une.

```bash
cd backend && pytest -q          # ≈ 423 passed / 915 skipped
```

> **Ce mode n'est pas une preuve d'intégration.** Les deux tiers de la suite sont
> skippés. Aucune régression d'intégration n'est détectée avant merge sur `main` —
> R4A/R4B a révélé trois HTTP 500 (`MissingGreenlet`) qu'aucun gate n'aurait attrapés.
> Combler cet écart est l'objet du ticket R3.

### B. Mode hôte — intégration complète

**Prérequis** : la pile QA tourne (`docker compose -p yunicity-qa -f docker-compose.qa.yml up -d`),
postgres publié sur `127.0.0.1:5455` et redis sur `127.0.0.1:6399`.

```bash
sh scripts/qa-backend-pytest-host.sh                          # suite complète
sh scripts/qa-backend-pytest-host.sh tests/test_weather.py    # un fichier
sh scripts/qa-backend-pytest-host.sh -k interest_count -q     # sélection
sh scripts/qa-backend-pytest-host.sh tests/test_feed.py::test_x
```

Tout argument est transmis à pytest ; le code de sortie de pytest est propagé.

Le wrapper ne réimplémente rien : il pose les endpoints joignables depuis l'hôte et
les valeurs test-only, puis délègue à `backend/scripts/run_backend_tests.py` — le
runner canonique déjà utilisé par `docker-ci.yml`. Ce runner, à chaque exécution :

- crée une base jetable `yunicity_test_<uuid>` et active PostGIS ;
- applique les migrations via les fixtures de la suite ;
- **la supprime** en fin de run, succès comme échec ;
- vide **uniquement** la db Redis dédiée (index ≥ 1).

Il n'y a donc **aucune étape manuelle** de création de base, de migration ou de
nettoyage : tout est dans le cycle de vie du runner.

Pour fixer le nom de la base (diagnostic, inspection post-mortem) :

```bash
BACKEND_TEST_DB_NAME=yunicity_test_investigation sh scripts/qa-backend-pytest-host.sh -q
```

#### Interdits, appliqués fail-closed avant toute connexion

| Cible | Refus |
|---|---|
| `yunicity_qa` | `DBNAME_NOT_DISPOSABLE_TEST` — c'est la baseline Playwright et la revue manuelle |
| `yunicity_dev`, `yunicity_prod`, `postgres`… | `DBNAME_FORBIDDEN` |
| nom sans préfixe `yunicity_test_` | `DBNAME_NOT_DISPOSABLE_TEST` |
| port dev 5434 | `DEV_PORT_5434` |
| hôte managé/distant, variable Railway | `HOST_FORBIDDEN` / `HOST_PORT_NOT_ALLOWED` |
| **Redis db 0** | `REDIS_DB0_FORBIDDEN` — la suite fait `flushdb` |

#### Reconstruction de la baseline QA

`sh scripts/qa-playwright-baseline.sh` est **indépendant** de pytest et ne doit
jamais être enchaîné automatiquement. Postgres et Redis QA sont sur **tmpfs** : la
baseline n'est à reconstruire que si le conteneur a été redémarré ou après
`down -v`. Une exécution de la suite backend ne la touche pas.

### Les 19 faux rouges — ce qu'ils étaient, et ce qu'ils n'étaient pas

Avant ce wrapper, la seule procédure documentée exécutait pytest **dans** le
conteneur `backend-qa`, qui porte l'environnement inline de `docker-compose.qa.yml`.
Une invocation lancée depuis l'hôte n'héritait de rien.

Mesure C3-BASELINE-R0, deux campagnes complètes (49 min chacune, résultats
identiques au node ID près) : **19 failed, 1295 passed, 24 skipped**.

| Variable absente | Échecs | Mécanisme |
|---|---|---|
| `REDIS_URL` | **18** | `Settings(APP_ENV="prod")` lève `REDIS_URL is required in prod` (11) · `assert settings.redis_url` (5) · file de jobs vidéo (2) |
| `REFRESH_TOKEN_PEPPER` | **1** | `REFRESH_TOKEN_PEPPER must be set for this environment` |

Contre-preuve par paliers : 19 échecs → **1** en ajoutant `REDIS_URL` → **0** en
ajoutant `REFRESH_TOKEN_PEPPER`.

**Aucun de ces 19 échecs n'était un défaut produit, un test périmé ou un défaut de
fixture.** Les cinq rouges de `refresh_rotation_replay_window` méritent une mention :
quatre étaient des cascades du même manque, `app/services/refresh_rotation_grace.py`
se désactivant sans Redis — dégradation **fail-closed** documentée et voulue (le
serveur révoque davantage, il n'accepte pas davantage). Aucune faille de rejeu.

## Fixtures (deterministic, dates relative to a single `reference_now`)

2 citizens (+profiles, interests persisted for A) · public & private tribe (+owners) ·
3 feed posts · future event (now+7d) · past event (now−7d) · event interest ·
verified/public organization · flash offer (flash_ends_at now+2h) · expired offer
(flash_ends_at now−1h) · local video (filesystem placeholder) · 2 render-only
notifications · minimal active Passport (deterministic state, no progression).

No event capacity / remaining-seats. No data outside `yunicity_qa`.

## Règle — nouvelles fixtures destructives (obligatoire)

Toute nouvelle fixture ou commande de test qui exécute une opération destructive
(`DROP SCHEMA` / `DROP TABLE`, `create_all` / `drop_all`, reset, migration destructive,
seed destructif) **DOIT** cibler `TEST_DATABASE_URL` et passer par le garde/helper QA
partagé — `tests/qa_support.py` (`configure_destructive_qa_db` / `resolve_destructive_qa_url`),
adossé à `app.qa.guard`.

**`DATABASE_URL` seul est interdit.** Le point d'application unique
`pytest_sessionstart` (`backend/tests/conftest.py`) refuse la session si `DATABASE_URL`
est défini sans `TEST_DATABASE_URL` validé (cible `yunicity_qa` sur hôte/port autorisé),
et épingle `DATABASE_URL` sur la cible QA validée sinon. Aucune fixture ne doit donc
lire `DATABASE_URL` directement pour un chemin destructif.
