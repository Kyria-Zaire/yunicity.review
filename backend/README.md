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
│   ├── core/                # config, logging, security (TODO auth)
│   ├── db/                  # Base, session async
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

## Prochaines étapes

| Ticket | Objectif |
|--------|----------|
| TICKET-103 | Endpoints auth (register, login, refresh, logout, /me) |
| TICKET-104 | Guards RBAC `require_permission` |
| TICKET-105 | Clients frontend auth |
