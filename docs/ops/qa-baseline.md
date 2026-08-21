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
