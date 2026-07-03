# Sécurité base de données tests (PLATFORM-TEST-DB-SAFETY-01)

## Architecture dev / test

```
┌─────────────────────────────────────────────────────────────────┐
│  Docker Compose (postgres :5434)                              │
├────────────────────────────┬────────────────────────────────────┤
│  yunicity_dev              │  yunicity_test                     │
│  (DATABASE_URL)            │  (TEST_DATABASE_URL)             │
│                            │                                    │
│  backend · web · admin     │  pytest @integration uniquement    │
│  seeds · bootstrap admin   │  DROP / TRUNCATE / reset autorisés │
│  données recette locale    │  jamais utilisée par l'API dev     │
└────────────────────────────┴────────────────────────────────────┘
```

| Variable | Rôle | Exemple local (hors Docker) |
|----------|------|-----------------------------|
| `DATABASE_URL` | API, seeds, bootstrap, apps | `postgresql+asyncpg://yunicity:…@localhost:5434/yunicity_dev` |
| `TEST_DATABASE_URL` | pytest integration / destructif | `postgresql+asyncpg://yunicity:…@localhost:5434/yunicity_test` |

**Règle** : les tests d'intégration ne lisent plus `DATABASE_URL` directement. Ils passent par `tests/database_safety.py`.

## Risques identifiés (avant correctif)

1. `conftest_auth.py` exécutait `DROP TABLE … CASCADE` sur la base pointée par `DATABASE_URL`.
2. Plusieurs fixtures de migration faisaient des `DROP TABLE` ciblés.
3. Des seeds tests (`auth_rbac_seed`, `activation_waves_seed`) appelaient `Base.metadata.drop_all`.
4. Un seul Postgres Docker (`yunicity_dev`) partagé entre dev et pytest local → **disparition du compte bootstrap admin**.

## Protections ajoutées

### 1. Garde central — `tests/database_safety.py`

| Fonction | Rôle |
|----------|------|
| `validate_test_database_isolation()` | Refuse si `TEST_DATABASE_URL` == `DATABASE_URL` (URL ou host+port+dbname) |
| `get_integration_database_url_or_skip()` | Retourne `TEST_DATABASE_URL` ou skip pytest |
| `configure_integration_database()` | Injecte `TEST_DATABASE_URL` dans `DATABASE_URL` pour la durée du test |
| `assert_destructive_operation_allowed()` | Bloque DROP/TRUNCATE si le nom de base ne finit pas par `_test` |
| `destructive_sql()` | Wrapper optionnel avant exécution SQL destructif |

Messages d'erreur explicites :

- `Refusing to run destructive tests against development database.`
- `Destructive operation blocked outside test database.`
- `TEST_DATABASE_URL is required for integration tests.`

### 2. Hook pytest — `tests/conftest.py`

`pytest_runtest_setup` : fail-fast sur chaque test `@integration` si `TEST_DATABASE_URL` est configurée mais pointe vers la dev DB.

### 3. Séparation physique

Script d'init Docker : `infra/docker/postgres/init/002-create-test-database.sh` crée `yunicity_test` au premier démarrage du volume.

## Procédures

### Créer la base test (volume Postgres existant)

```bash
docker compose exec postgres psql -U yunicity -d yunicity_dev -c \
  "CREATE DATABASE yunicity_test OWNER yunicity;"
```

### Configurer l'environnement pytest

Dans `backend/.env` (ou export shell) :

```env
DATABASE_URL=postgresql+asyncpg://yunicity:yunicity_dev_password@localhost:5434/yunicity_dev
TEST_DATABASE_URL=postgresql+asyncpg://yunicity:yunicity_dev_password@localhost:5434/yunicity_test
```

### Migrer la base test

```bash
cd backend
DATABASE_URL="$TEST_DATABASE_URL" uv run alembic upgrade head
```

Les tests auth recréent le schéma via ORM (`drop_all` / `create_all`) — migration Alembic recommandée pour les tests migration dédiés.

### Lancer les tests

```bash
cd backend
uv run pytest tests/test_database_safety.py -v
uv run pytest -m integration   # nécessite TEST_DATABASE_URL
uv run pytest -m "not integration"   # unitaires, sans DB
```

### Récupération après accident (dev DB touchée)

Si la dev a été vidée par erreur :

```bash
docker compose exec backend alembic upgrade head
docker compose exec backend python scripts/bootstrap_admin.py
```

Voir aussi `backend/docs/admin-account-recovery.md`.

## Schéma décisionnel

```
pytest @integration démarre
        │
        ▼
TEST_DATABASE_URL définie ?
   non ──► skip (message explicite)
   oui
        │
        ▼
Même cible que DATABASE_URL ?
   oui ──► RuntimeError (abort avant DROP)
   non
        │
        ▼
Nom de base finit par _test ?
   non ──► RuntimeError
   oui
        │
        ▼
Opérations destructives autorisées sur yunicity_test
```

## Fichiers clés

| Fichier | Rôle |
|---------|------|
| `tests/database_safety.py` | Garde unique |
| `tests/conftest.py` | Hook fail-fast integration |
| `tests/conftest_auth.py` | Reset auth → garde destructif |
| `tests/test_database_safety.py` | Tests unitaires des gardes |
| `backend/.env.example` | Variables documentées |
