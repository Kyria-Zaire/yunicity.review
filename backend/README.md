# Backend — Yunicity API

Fondation **FastAPI** (SPRINT-0 / TICKET-002) : health checks, config typée, SQLAlchemy async et Redis optionnels, Alembic prêt.

Pas d’auth ni de logique métier à ce stade.

## Stack

- Python 3.12+
- FastAPI, Uvicorn, Pydantic v2, pydantic-settings
- SQLAlchemy 2 async, Alembic, asyncpg
- Redis (async) — optionnel
- pytest, httpx, ruff, mypy

## Structure

```
backend/
├── app/
│   ├── main.py              # create_app()
│   ├── api/v1/              # routers versionnés
│   ├── core/                # config, security, dependencies, rate limit
│   ├── db/                  # Base, session, seeds
│   ├── models/              # User, RBAC, refresh_tokens
│   ├── repositories/        # Accès DB
│   ├── services/            # Logique métier (auth)
│   ├── schemas/             # Pydantic API
│   └── integrations/        # Redis
├── alembic/
├── tests/
├── pyproject.toml
└── .env.example
```

## Installation

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# Linux/macOS
# source .venv/bin/activate

pip install -e ".[dev]"
cp .env.example .env
```

## Lancer l’API

### Docker (recommandé — TICKET-004)

**DEV ONLY** — identifiants du compose (ex. `yunicity_dev_password`) ne doivent **jamais** être réutilisés en recette/preprod/prod.

Variables : mêmes noms que `app/core/config.py` (`APP_ENV`, `APP_NAME`, `DEBUG`, … — pas `ENVIRONMENT`).

Depuis la **racine** du monorepo :

```bash
cp .env.example .env
cp backend/.env.example backend/.env
docker compose up --build -d
docker compose ps
docker compose logs -f backend
```

Vérifications :

```bash
curl http://localhost:8000/api/v1/health
curl http://localhost:8000/api/v1/ready
# Windows PowerShell : curl.exe au lieu de curl
```

PostGIS :

```bash
docker compose exec postgres psql -U yunicity -d yunicity_dev -c "SELECT PostGIS_Version();"
```

Reset volumes dev : `bash scripts/reset-dev-env.sh` ou `.\scripts\reset-dev-env.ps1`

Qualité dans le conteneur :

```bash
docker compose exec backend pytest
docker compose exec backend ruff check .
docker compose exec backend mypy app tests
docker compose exec backend alembic current
```

Voir [infra/docker/README.md](../infra/docker/README.md).

### Local (sans Docker)

```bash
uvicorn app.main:create_app --factory --host 0.0.0.0 --port 8000 --reload
```

Utiliser les URLs `localhost:5434` / `localhost:6379` dans `.env` (voir commentaires dans `.env.example`).

## Endpoints

| Méthode | Chemin | Description |
|---------|--------|-------------|
| GET | `/api/v1/health` | Liveness |
| GET | `/api/v1/ready` | Readiness (DB / Redis si configurés) |
| POST | `/api/v1/auth/register` | Inscription citoyenne |
| POST | `/api/v1/auth/login` | Connexion |
| POST | `/api/v1/auth/refresh` | Rotation refresh (cookie ou body mobile) |
| POST | `/api/v1/auth/logout` | Révocation refresh + clear cookie |
| GET | `/api/v1/auth/me` | Profil + rôles + permissions (Bearer) |

### Auth — web vs mobile

| Plateforme | Refresh token |
|------------|----------------|
| Web / admin | Cookie httpOnly `refresh_token`, path `/api/v1/auth` |
| Mobile | Header `X-Client-Platform: mobile` + champ `refresh_token` dans le JSON (register/login/refresh) |

Workflow : **register/login** → `access_token` (Bearer, 15 min) + refresh → **refresh** pour renouveler l’access → **logout** révoque le refresh.

**Décision DECIDE (Sprint 1, validée CTO)** : le PRD-101 mentionnait un refresh à 30 jours ; l’implémentation TICKET-103 utilise **7 jours** (`REFRESH_TOKEN_EXPIRE_DAYS`, défaut `7`). Choix plus restrictif pour limiter la fenêtre d’abus si un refresh est compromis (l’access JWT reste à 15 min). Ajustement possible après MEASURE en recette.

Prérequis : `alembic upgrade head` + `python -m app.db.seeds` (rôles RBAC).

Exemple `/api/v1/health` :

```json
{
  "status": "ok",
  "service": "yunicity-api",
  "environment": "dev"
}
```

Exemple `/api/v1/ready` (sans DB/Redis) :

```json
{
  "status": "ready",
  "checks": {
    "database": "disabled",
    "redis": "disabled"
  }
}
```

Avec Docker Compose (DB + Redis connectés) :

```json
{
  "status": "ready",
  "checks": {
    "database": "ok",
    "redis": "ok"
  }
}
```

## Qualité

```bash
pytest
ruff check .
ruff format --check .
mypy app tests
```

## Variables d’environnement

Voir `.env.example`. Principales :

| Variable | Description |
|----------|-------------|
| `APP_ENV` | `dev` \| `recette` \| `preprod` \| `prod` |
| `DEBUG` | Interdit avec `APP_ENV=prod` |
| `DATABASE_URL` | Optionnel (asyncpg) |
| `REDIS_URL` | Optionnel |
| `CORS_ORIGINS` | Liste JSON ou CSV — pas de `*` en prod |
| `JWT_SECRET_KEY` | Secret HS256 (≥ 32 car. en preprod/prod) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Durée access JWT (défaut 15) |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Durée refresh (défaut 7) |
| `REFRESH_COOKIE_*` | Cookie httpOnly refresh (web) |
| `REFRESH_TOKEN_PEPPER` | Pepper optionnel pour hash refresh |

## Migrations

```bash
# Nécessite DATABASE_URL dans .env
alembic upgrade head
alembic downgrade -1   # rollback dernière révision
alembic upgrade head
```

Révision initiale auth/RBAC : `alembic/versions/20260517_0001_auth_rbac_foundation.py`

## Seed RBAC (TICKET-102)

Idempotent — rôles et permissions MVP uniquement (aucun utilisateur) :

```bash
# Local ou conteneur backend, après migration
python -m app.db.seeds
```

Docker :

```bash
docker compose exec backend alembic upgrade head
docker compose exec backend python -m app.db.seeds
```

## Tests Auth/RBAC

```bash
pytest                          # unitaires sans DB
pytest -m integration           # nécessite DATABASE_URL (PostgreSQL)
```

Tests auth (TICKET-103) : `tests/test_auth_endpoints.py`, `test_refresh_rotation.py`, `test_auth_permissions.py`.

## Prochaines étapes

| Ticket | Objectif |
|--------|----------|
| TICKET-104 | Guards RBAC avancés + endpoints protégés métier |
| TICKET-105 | Clients frontend auth |
