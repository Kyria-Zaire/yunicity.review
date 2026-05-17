# Docker — Yunicity (dev local)

Stack de développement définie à la racine du monorepo : [`docker-compose.yml`](../../docker-compose.yml).

## DEV ONLY — identifiants

Tous les identifiants documentés ici et dans `docker-compose.yml` / `.env.example` sont **réservés au développement local**.

| Identifiant | Valeur dev (exemple) |
|-------------|----------------------|
| `POSTGRES_USER` | `yunicity` |
| `POSTGRES_PASSWORD` | `yunicity_dev_password` |
| `POSTGRES_DB` | `yunicity_dev` |

**Interdiction** de réutiliser ces valeurs en recette, preprod ou prod. Les autres environnements utilisent des secrets injectés par l’hébergeur / gestionnaire de secrets.

## Services

| Service | Image | Container | Port hôte |
|---------|-------|-----------|-----------|
| `postgres` | `postgis/postgis:16-3.4` | `yunicity-postgres-dev` | **5434** → 5432 |
| `redis` | `redis:7-alpine` | `yunicity-redis-dev` | **6379** → 6379 |
| `backend` | build `./backend` | `yunicity-backend-dev` | **8000** → 8000 |

Healthchecks : `postgres` (`pg_isready`), `redis` (`redis-cli ping`), `backend` (`curl` → `/api/v1/health`).

## Variables d’environnement backend

Noms **identiques** aux alias Pydantic dans [`backend/app/core/config.py`](../../backend/app/core/config.py) :

| Variable | Rôle |
|----------|------|
| `APP_NAME` | Nom affiché API |
| `APP_ENV` | `dev` \| `recette` \| `preprod` \| `prod` |
| `DEBUG` | Mode debug (interdit si `APP_ENV=prod`) |
| `API_V1_PREFIX` | Préfixe routes v1 |
| `DATABASE_URL` | URL async SQLAlchemy (optionnel hors Docker) |
| `REDIS_URL` | URL Redis (optionnel hors Docker) |
| `CORS_ORIGINS` | Liste JSON ou CSV |
| `LOG_LEVEL` | Niveau de log |

Ne pas introduire `ENVIRONMENT` ou d’autres noms non définis dans `Settings`.

## Volumes persistants

- `yunicity_postgres_data` — données PostgreSQL/PostGIS
- `yunicity_redis_data` — données Redis

## Initialisation PostGIS

Scripts montés depuis [`postgres/init/`](postgres/init/) vers `/docker-entrypoint-initdb.d/` (exécutés **une seule fois** à la création du volume).

### Vérification PostGIS

Après `docker compose up` (volume vierge ou après reset) :

```bash
docker compose exec postgres psql -U yunicity -d yunicity_dev -c "SELECT PostGIS_Version();"
```

Résultat attendu : une ligne avec la version PostGIS (ex. `3.4 ...`).

## Windows / WSL2

- **Privilégier Docker Desktop avec backend WSL2** (Paramètres → General → *Use the WSL 2 based engine*).
- Cloner et lancer `docker compose` **depuis le filesystem WSL** (`~/projets/yunicity`) plutôt que depuis `C:\` monté, pour éviter lents I/O et erreurs de bind-mount.
- Si bind-mount `./backend` échoue ou permissions incohérentes :
  - Ouvrir le projet dans WSL : `cd ~/yunicity && docker compose up --build`
  - Ou activer *Settings → Resources → File sharing* pour le lecteur concerné
  - En dernier recours : `docker compose down -v` puis relancer depuis WSL2
- Sur PowerShell natif, utiliser `curl.exe` (pas l’alias `curl` → `Invoke-WebRequest`).

## Prérequis

1. Docker Desktop (ou moteur Docker + Compose v2), de préférence sous WSL2 sur Windows
2. Fichiers d’environnement locaux (gitignorés) :

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Les valeurs par défaut du Compose suffisent pour le backend si `backend/.env` est absent (`env_file` non requis).

## Commandes

Depuis la **racine** du dépôt :

```bash
docker compose config
docker compose up --build -d
docker compose ps
docker compose logs -f backend
```

Health :

```bash
curl http://localhost:8000/api/v1/health
curl http://localhost:8000/api/v1/ready
```

Qualité dans le conteneur :

```bash
docker compose exec backend pytest
docker compose exec backend ruff check .
docker compose exec backend mypy app tests
docker compose exec backend alembic current
```

## Reset de l’environnement dev

Script recommandé (supprime volumes + rebuild) :

```bash
# Linux / macOS / WSL
bash scripts/reset-dev-env.sh

# Windows PowerShell
.\scripts\reset-dev-env.ps1
```

Équivalent manuel :

```bash
docker compose down -v
docker compose up --build -d
```

Pour réappliquer les scripts `init/` (extensions PostGIS), un reset volume est nécessaire — ils ne s’exécutent pas sur un volume déjà initialisé.

## Debug

| Problème | Piste |
|----------|--------|
| Backend `unhealthy` | `docker compose logs backend` ; attendre `start_period` du healthcheck |
| Backend ne démarre pas | `docker compose logs backend` |
| `ready` → `database: error` | Postgres pas prêt ou mauvais `DATABASE_URL` (hôte `postgres` dans Docker) |
| `ready` → `redis: error` | `docker compose ps` + logs `redis` |
| Port 5434 déjà pris | Changer `POSTGRES_PORT` dans `.env` racine |
| Permission sur volume bind | WSL2 + projet sous `~/` ; voir section Windows |
| PostGIS absent | Volume créé avant le script init → `reset-dev-env` |

## Sécurité

- Mots de passe **DEV ONLY** — jamais en recette/preprod/prod.
- Ne pas exposer Postgres/Redis hors machine locale.
- Ne jamais charger de dump production en dev/recette.
