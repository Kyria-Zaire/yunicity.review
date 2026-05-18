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

### Organizations — API (TICKET-204)

| Méthode | Chemin | Auth | Description |
|---------|--------|------|-------------|
| POST | `/api/v1/organizations/request` | Bearer | Demande création (`pending`, `private`, owner actif) |
| GET | `/api/v1/organizations/me` | Bearer | Organizations où l’utilisateur est membre actif |
| GET | `/api/v1/organizations/{slug}` | Optionnel | Public si `verified` + `public` ; owner/admin sinon |
| GET | `/api/v1/organizations/{id}/members` | Bearer | Owner/admin actifs |
| PATCH | `/api/v1/organizations/{id}` | Bearer | Owner/admin actifs (champs limités) |
| POST | `/api/v1/organizations/{id}/review` | Bearer + `moderation.manage` ou `system.admin` | Workflow vérification |

**Création** : slug auto (`name` + `city`), max **5** organizations `pending` par user, anti-doublon `name+city+address`, rate limit.

**Review** : écrit `organization_verifications`, ne change **pas** `visibility` automatiquement.

**Sécurité** : anti-IDOR via membership scoped ; champs internes (`rejection_reason`, reviewer ids) jamais dans les réponses publiques/member view.

**Membership MVP** : `owner` / `admin` → update + liste membres ; `staff` / `member` → lecture limitée ; statuts `suspended` / `removed` → accès refusé.

**Hors scope** : claim complet, invitations, upload logo, pages frontend.

### Partner leads — CRM foundation (TICKET-205)

Pipeline cible : **lead** → qualification → **conversion** → `organization` `pending`/`private` → **review** → `verified`.

| Méthode | Chemin | Auth | Description |
|---------|--------|------|-------------|
| POST | `/api/v1/partner-leads` | Bearer + `moderation.manage` ou `system.admin` | Création manuelle |
| GET | `/api/v1/partner-leads` | Idem | Liste paginée (`status`, `source`, `city`) |
| GET | `/api/v1/partner-leads/{id}` | Idem | Détail lead |
| PATCH | `/api/v1/partner-leads/{id}` | Idem | CRM : statut, notes, tags, intérêts, relances |
| POST | `/api/v1/partner-leads/{id}/convert` | Idem | Conversion → organization (sans auto-vérification) |
| POST | `/api/v1/partner-leads/import-preview` | Idem | Preview JSON (doublons / invalides) — **aucune écriture DB** |

**Statuts lead** : `new`, `contacted`, `interested`, `meeting_scheduled`, `signed`, `converted`, `rejected`, `archived`.

**Sources** : `landing_page`, `physical_prospecting`, `referral`, `instagram`, `event`, `inbound`, `outbound`, `manual`, `other`.

**Conversion** :

- Crée une `organization` (`pending`, `private`) ou lie une existante.
- Crée le membership `owner` actif si besoin.
- **Ne vérifie pas** l’organization ; la review reste sur `POST /organizations/{id}/review`.
- Un lead ne se convertit qu’**une fois** ; champs `converted_*` immuables.

**Sécurité** : aucun endpoint public ; anti-IDOR via permissions staff uniquement ; notes max 5000 caractères.

### Import partenaires physiques (TICKET-205B)

Fichier contrôlé : `data/partner_leads/physical_partners_reims_2026.json` (14 partenaires Reims signés terrain).

**Script CLI** (depuis `backend/`) :

```bash
# Dry-run par défaut (aucune écriture)
python scripts/import_partner_leads.py \
  --file data/partner_leads/physical_partners_reims_2026.json

# Écriture idempotente
python scripts/import_partner_leads.py \
  --file data/partner_leads/physical_partners_reims_2026.json \
  --apply
```

Docker :

```bash
docker compose exec backend python scripts/import_partner_leads.py \
  --file data/partner_leads/physical_partners_reims_2026.json --dry-run
docker compose exec backend python scripts/import_partner_leads.py \
  --file data/partner_leads/physical_partners_reims_2026.json --apply
```

**Règles** :

- Anti-doublon : `lower(name) + city + phone` (téléphone vide accepté pour ce batch).
- N’écrase jamais un lead existant ; second `--apply` = skip duplicates.
- **Aucune** organization créée, **aucune** conversion automatique.
- Les **Tribus** (Sport, Business, Culture, etc.) sont **exclues** — ticket dédié futur.
- Pas d’email/téléphone inventés ; pas de seed au démarrage de l’API.

**Hors scope** : emailing, notifications, analytics, QR, offres.

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

Tests organizations API (TICKET-204) : `tests/test_organization_api.py`.

## Prochaines étapes

| Ticket | Objectif |
|--------|----------|
| TICKET-205+ | Claim, invitations staff, partner leads, pages publiques frontend |
