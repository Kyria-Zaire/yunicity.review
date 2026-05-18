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
| GET | `/api/v1/auth/me` | Identité auth + rôles + permissions (Bearer) |
| GET | `/api/v1/profile/me` | Profil social du user connecté |
| PATCH | `/api/v1/profile/me` | Mise à jour profil (username **immuable**) |
| POST | `/api/v1/profile/complete` | Terminer l'onboarding profil |
| GET | `/api/v1/profile/{username}` | Profil public (selon visibilité) |

### User vs UserProfile (TICKET-202)

| Table | Rôle |
|-------|------|
| `users` | Auth : email, mot de passe, `is_active`, `is_verified` |
| `user_profiles` | Social : `username`, bio, intérêts, visibilité, onboarding |

À l'inscription, un `user_profiles` est créé automatiquement avec un **username généré** (unique).

**Username (MVP)** :

- Format : `^[a-z0-9_]{3,30}$`, lowercase, trim
- **Immuable** — pas d'endpoint de rename
- Liste réservée : `admin`, `yunicity`, `login`, `register`, etc. (`app/core/profile_username.py`)

**Visibilité** :

| Valeur | Comportement MVP |
|--------|------------------|
| `public` | Visible après onboarding terminé |
| `private` | Seul le propriétaire via `/profile/me` |
| `city_only` | Viewers authentifiés dans la même ville (`users.city`) — enrichissement futur |

**Intérêts** (whitelist) : `food`, `sports`, `tech`, `nightlife`, `business`, `gaming`, `culture`, `fitness`, `music`, `art`, `entrepreneurship` — max 10.

**Onboarding** : ville + ≥1 intérêt → `POST /profile/complete` → `onboarding_completed=true`.

Les champs `users.full_name` et `users.city` restent en place (pas de suppression Sprint 2).

### Organizations — modèle DB (TICKET-203)

**Pas d’API organizations** à ce stade — uniquement schéma DB, helpers slug, tests.

| Table | Rôle |
|-------|------|
| `organizations` | Acteur local (commerce, asso, école…) |
| `organization_members` | Lien user ↔ org + rôle |
| `organization_verifications` | Historique des transitions de vérification |

**Types** (`type`) : `commerce`, `association`, `school`, `freelance`, `public_agency`, `creator`, `other`.

**Vérification** (`verification_status`) : `pending` (défaut) → `under_review` → `verified` \| `rejected` \| `suspended`.

**Visibilité** (`visibility`) : `private` (défaut), `public`, `unlisted` — aucune page publique tant qu’API absente.

**Membership** (`role`) : `owner`, `admin`, `staff`, `member` — statuts : `active`, `invited`, `suspended`, `removed`.

**Règle MVP** : un seul `owner` **actif** par organization (index unique partiel PostgreSQL).

**Slug** (`app/core/organization_slug.py`) :

- Format : `^[a-z0-9]+(?:-[a-z0-9]+)*$`, longueur 3–80
- Accents supprimés, espaces → tirets
- Réservés : `admin`, `api`, `yunicity`, `o`, `organizations`, etc.

**Hors scope TICKET-203** : API création/review, partner leads, claim, pages publiques `/o/{slug}`, upload logo, seed partenaires.

### RBAC — endpoints de validation technique (TICKET-104)

Routes temporaires pour prouver les guards avant les features métier (supprimables ou déplacées plus tard).

| Méthode | Chemin | Permission requise |
|---------|--------|-------------------|
| GET | `/api/v1/rbac/me/permissions` | Authentifié |
| GET | `/api/v1/rbac/moderation/check` | `moderation.read` |
| GET | `/api/v1/rbac/users/check` | `users.read.all` |
| GET | `/api/v1/rbac/admin/check` | `system.admin` |
| POST | `/api/v1/rbac/test/inactive-access` | Authentifié + compte actif |

**Erreurs authZ :**

| HTTP | Code | Cas |
|------|------|-----|
| 401 | `UNAUTHORIZED` | Pas de Bearer, JWT invalide ou expiré |
| 403 | `FORBIDDEN` | Permission manquante (`require_permission`) |
| 403 | `ACCOUNT_SUSPENDED` | Compte `is_active=false` |

**Rôles MVP (seed)** : `USER`, `MODERATOR`, `CITY_ADMIN`, `SUPER_ADMIN` — permissions uniquement depuis la DB (pas de `users.role`).

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

Révisions :

- `alembic/versions/20260517_0001_auth_rbac_foundation.py` — auth/RBAC
- `alembic/versions/20260518_0002_user_profiles.py` — profils sociaux + backfill
- `alembic/versions/20260518_0003_organizations_foundation.py` — organisations + memberships + vérifications

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

Tests RBAC (TICKET-104) : `tests/test_rbac_guards.py`, `test_rbac_permissions.py`, `test_rbac_inactive_user.py`.

Tests profil (TICKET-202) : `tests/test_profile_endpoints.py`, `test_profile_username.py`, `test_profile_migration.py`.

Tests organizations (TICKET-203) : `tests/test_organization_models.py`, `test_organization_slug.py`, `test_organization_constraints.py`, `test_organization_migration.py`.

## Prochaines étapes

| Ticket | Objectif |
|--------|----------|
| TICKET-204+ | API organizations + onboarding + review workflow |
