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

### Outils dev — promotion RBAC (local uniquement)

Attribuer un rôle seedé à un compte **déjà inscrit** (table `user_roles`, permissions via la DB — pas de bypass en dur) :

```bash
# Depuis backend/ avec venv actif, ou :
docker compose exec backend python -m app.db.dev promote_user \
  --email vous@example.com \
  --role SUPER_ADMIN
```

| Garde-fou | Détail |
|-----------|--------|
| Environnement | **Refusé** si `APP_ENV=prod` |
| Utilisateur | Doit exister (sinon erreur explicite) |
| Rôle | Clés seedées : `USER`, `MODERATOR`, `CITY_ADMIN`, `SUPER_ADMIN` |
| Idempotence | Ré-exécuter ne duplique pas l’assignation |

Exemple PowerShell (depuis la racine du monorepo, DB via Docker) :

```powershell
docker compose exec backend python -m app.db.dev promote_user --email kyriamambu1@gmail.com --role SUPER_ADMIN
```

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
- `alembic/versions/20260518_0004_partner_leads_foundation.py` — partner leads CRM
- `alembic/versions/20260519_0005_passport_foundation.py` — Passport MVP (tiers, stamps, offers, redemptions)

## Passport — fondation données (TICKET-302)

Référence produit : [`docs/prd/PRD-301-passport-benefits-foundation.md`](../docs/prd/PRD-301-passport-benefits-foundation.md).

### Concepts

| Entité | Rôle |
|--------|------|
| `passport_tiers` | Catalogue configurable (basic, silver, gold, néo-arrivant, press/creator, business) |
| `passports` | Instance numérique d’un citoyen (ville, numéro, QR placeholder, tier, stats minimales) |
| `passport_stamps` | Tampon collecté — **MVP : visite `organization` uniquement** |
| `partner_offers` | Offre partenaire liée à une `organization` **vérifiée** (règle métier services/API) |
| `passport_offer_redemptions` | Suivi simple d’utilisation d’une offre |

### Relations

```
User
 └── Passport (1 actif max / user en MVP)
      ├── PassportStamp → Organization
      ├── PassportOfferRedemption → PartnerOffer
      └── PassportTier

Organization (verified pour publier des offres)
 └── PartnerOffer
      └── PassportOfferRedemption → Passport
```

### Limites MVP

| Règle | Détail |
|-------|--------|
| 1 passport actif / user | Index partiel `uq_passports_one_active_per_user` |
| Tampon / org | Un tampon par couple `(passport, organization)` |
| Redemption | Une redemption par couple `(passport, partner_offer)` |
| QR | Colonne `qr_token` placeholder — **pas de scan temps réel** |
| Offres | Création réservée aux org `verification_status = verified` (couche API à venir) |

### Exclusions volontaires (hors TICKET-302)

- QR temps réel / rotation avancée
- Géolocalisation anti-fraude
- Creator economy, payouts, live gifts
- Passport physique, wallet, paiements
- NFT / blockchain, analytics avancées, moteur points

Constantes : `app/core/passport_constants.py`

Tests : `tests/test_passport_models.py`, `test_partner_offers.py`, `test_passport_constraints.py`, `test_passport_migration.py`

## Passport API (TICKET-303)

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/v1/passport/tiers` | Non | Tiers publics actifs |
| GET | `/api/v1/passport/me` | Oui | Passport actif + tier + stats |
| POST | `/api/v1/passport/activate` | Oui | Active (ou retourne l'existant) |
| GET | `/api/v1/passport/stamps` | Oui | Tampons du citoyen |
| GET | `/api/v1/passport/offers` | Oui | Offres visibles (org verified + public) |
| POST | `/api/v1/passport/offers/{offer_id}/redeem` | Oui | Redemption MVP (rate limit) |

Services : `PassportService` — repositories `passport_repository`, `partner_offer_repository`.

### Limites MVP API

| Règle | Détail |
|-------|--------|
| Activation | Tier `basic` uniquement ; 1 actif / user |
| Offres | Org `verified` + `visibility=public` + statut `published` + `is_active` |
| Redemption | Statut `completed` ; pas de scan staff |
| Sécurité | Pas d'élévation tier ; pas de création d'offre citoyen |

### Exclusions API (hors scope)

- Scan QR live, géolocalisation, anti-fraude avancée
- Creator economy, wallet, paiements, leaderboard, points

Tests : `tests/test_passport_activation.py`, `test_passport_api.py`, `test_passport_redemptions.py`

## Partner offers — self-service modéré (TICKET-305 / 305A)

Les offres Passport passent d’un modèle **admin-only** à un flux **partenaire autonome + modération Yunicity**.

### Statuts produit (`offer_status` → colonne `status`)

| Statut | Rôle |
|--------|------|
| `draft` | Brouillon partenaire (éditable) |
| `pending_review` | Soumis à modération |
| `published` | Visible citoyens (`is_active=true`) |
| `rejected` | Refus modération (motif audité) |
| `archived` | Retiré du catalogue |

Transitions : `draft→pending_review→published|rejected`, `rejected→draft`, `published→archived`.

### Endpoints partenaire (`organization_members` — owner/admin)

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/v1/organizations/me/offers` | Créer brouillon (org verified) |
| PATCH | `/api/v1/organizations/me/offers/{id}` | Éditer brouillon/rejeté |
| POST | `/api/v1/organizations/me/offers/{id}/submit` | Soumettre modération |
| GET | `/api/v1/organizations/me/offers` | Liste offres des orgs gérées |

Pas de nouveau RBAC global — rôles `owner` / `admin` via `OrganizationMembershipService`.

### Endpoints modération staff

| Méthode | Route | RBAC |
|---------|-------|------|
| GET | `/api/v1/admin/partner-offers?status=pending_review` | `moderation.manage` ou `system.admin` |
| POST | `/api/v1/admin/partner-offers/{id}/approve` | → `published` + org `public` |
| POST | `/api/v1/admin/partner-offers/{id}/reject` | → `rejected` + `rejection_reason` |
| POST | `/api/v1/admin/partner-offers/{id}/archive` | → `archived` |

Audit : `created_by_user_id`, `moderated_by_user_id`, `moderated_at`, `rejection_reason`.

Migration `20260520_0006` : mappe l’ancien `active` → `published`, `paused/expired` → `archived`, ajoute `is_active`.

### Citoyen (inchangé TICKET-303)

Offres visibles si org `verified` + `public`, offre `published` + `is_active`, fenêtre de dates valide.

### Push notifications Expo (TICKET-307 — MVP mobile)

Fondation **Expo Push** (pas de Web Push, pas d’inbox, pas de segmentation).

| Méthode | Route | Auth |
|---------|-------|------|
| POST | `/api/v1/notifications/register-device` | JWT |
| GET | `/api/v1/notifications/me/subscriptions` | JWT |
| DELETE | `/api/v1/notifications/subscriptions/{id}` | JWT (propre token uniquement) |

Table `push_subscriptions` — token Expo unique, `platform` ios/android, `is_active`, cascade `users`.

**Config** (`.env`) :

- `EXPO_PUSH_ENABLED=false` en dev → log uniquement, pas d’appel réseau Expo
- `EXPO_ACCESS_TOKEN` optionnel (Expo push security)

**Événements MVP** (best-effort, **ne bloque pas** la transaction métier) :

- Redemption scan réussie → citoyen : « Votre avantage a été validé »
- Offre approuvée → créateur : « Votre offre est visible dans Yunicity »
- Offre rejetée → créateur : « Quelques ajustements sont nécessaires sur votre offre »

Token invalide (`DeviceNotRegistered`) → désactivation automatique. Logs sans token complet.

Tests : `tests/test_notifications.py`

### TODO futur (hors scope)

- Web Push, inbox, analytics, segmentation marketing
- UI partenaire complète
- Scan QR staff, wallet, creator economy

Tests : `test_partner_offer_workflow.py`, `test_partner_offer_permissions.py`, `test_partner_offer_moderation.py`, `test_admin_partner_offers.py`

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

Tests passport fondation (TICKET-302) : `tests/test_passport_models.py`, `test_partner_offers.py`, `test_passport_constraints.py`, `test_passport_migration.py`.

Tests passport API (TICKET-303) : `tests/test_passport_activation.py`, `test_passport_api.py`, `test_passport_redemptions.py`.

Tests partner offers (TICKET-305/305A) : `tests/test_partner_offer_workflow.py`, `test_partner_offer_permissions.py`, `test_partner_offer_moderation.py`, `test_admin_partner_offers.py`.

## Passport scan & redemption sur place (TICKET-306)

Premier flux physique : le citoyen affiche un QR ; le partenaire (owner/admin de l’organisation) scanne ou saisit le code, choisit une offre publiée de **son** lieu, valide la redemption.

Intention UX : [`docs/ux/passport-scan-redemption-intent.md`](../docs/ux/passport-scan-redemption-intent.md).

### Endpoints

| Méthode | Route | Auth | Rôle |
|---------|-------|------|------|
| GET | `/api/v1/passport/me/qr` | Citoyen | Payload QR (`YNCP1:` + `qr_token`), numéro passport |
| POST | `/api/v1/scan/resolve` | Partenaire | Charge passport + offres redeemables de ses orgs |
| POST | `/api/v1/scan/redeem` | Partenaire | Body `{ offer_id, qr_secret }` — enregistre redemption |

Services : `ScanRedemptionService` — helpers `app/core/passport_qr.py` (`normalize_qr_secret`, préfixe `YNCP1:`).

### Règles MVP

| Règle | Détail |
|-------|--------|
| Organisation | Redemption uniquement sur offres `published` dont l’org est `verified` et dont l’utilisateur est `owner` ou `admin` (`organization_members`) |
| Passport | Actif, utilisateur non banni (`is_active`) |
| Unicité | 1 redemption max par couple `(passport, partner_offer)` |
| Validité | `valid_until` respecté ; tier requis si configuré |
| Tampon | Option simple : stamp org si absent après redemption réussie |
| Audit | Logs structurés (`redemption_success` / `redemption_failed`, org, `redeemed_by`, IP approx.) |
| Rate limit | Sur `resolve` et `redeem` |

### Sécurité MVP (limites connues)

- **QR token statique** — rotation / expiration courte = **V2**
- Pas d’anti-fraude enterprise, offline, géofencing, batch scan
- Pas d’exposition du secret brut côté citoyen au-delà du token QR encodé

Tests : `tests/test_scan_redemption.py` (auth partenaire, isolation org, doublon, offre expirée/brouillon, passport invalide, saisie manuelle token).

## Supabase Recovery Operations

| Ticket | Contenu |
|--------|---------|
| TICKET-250 | Pipeline technique (scripts, mapping, tests) |
| TICKET-251 | **Runbook import données réelles** — procédure opérationnelle |

### Documentation officielle

| Document | Usage |
|----------|--------|
| [`reports/TICKET-251-real-import-runbook.md`](reports/TICKET-251-real-import-runbook.md) | Restore backup, discovery, dry-run, apply, rollback, QA |
| [`reports/supabase_partner_mapping.md`](reports/supabase_partner_mapping.md) | Correspondance colonnes Supabase → `partner_leads` |
| [`reports/templates/import_validation_checklist.md`](reports/templates/import_validation_checklist.md) | Checklist validation humaine avant `--apply` |

### Séparation des bases (rappel)

| Instance | Variable | Port hôte dev |
|----------|----------|---------------|
| Yunicity CRM | `DATABASE_URL` | `5434` (compose) |
| Supabase restauré | `SUPABASE_DATABASE_URL` | `5435` (instance **séparée**) |

Ne jamais restaurer le backup Supabase dans `yunicity_dev`.

### Commandes rapides (référence)

```bash
# Discovery
docker compose exec backend python scripts/supabase_discovery.py

# Dry-run (défaut — sans --apply)
docker compose exec backend python scripts/import_supabase_partner_leads.py \
  --source-table VOTRE_TABLE --limit 50

# Apply — uniquement après checklist TICKET-251 + accord CTO
docker compose exec backend python scripts/import_supabase_partner_leads.py \
  --source-table VOTRE_TABLE --apply
```

Rapports générés : `reports/supabase_discovery_report.md`, `reports/supabase_partner_import_report.md`

### Règles pipeline (TICKET-250)

| Règle | Détail |
|-------|--------|
| `source` | Toujours `landing_page` |
| `status` | `signed` si détecté, sinon `interested` |
| Doublons | Skip (name+city+phone + Instagram) — pas d’écrasement |
| Organizations / users | Jamais modifiés |
| Apply | Humain + checklist — pas d’import automatique |

Tests : `tests/test_supabase_partner_import.py`

## Prochaines étapes

| Ticket | Objectif |
|--------|----------|
| TICKET-205+ | Claim, invitations staff, partner leads, pages publiques frontend |
