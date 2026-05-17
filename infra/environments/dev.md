# Environnement — DEV

## Rôle

**Expérimentation** locale des développeurs.

## Docker local (TICKET-004)

Stack à la racine : `docker compose up --build`.

| Service | Accès hôte | Notes |
|---------|------------|--------|
| API | http://localhost:8000 | `/api/v1/health`, `/api/v1/ready` |
| PostgreSQL/PostGIS | `localhost:5434` | DB `yunicity_dev`, user `yunicity` |
| Redis | `localhost:6379` | DB logique `0` |

Fichiers d’environnement (gitignorés) :

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Identifiants **DEV ONLY** dans `.env.example` / `docker-compose.yml` (`yunicity` / `yunicity_dev_password`, etc.) — **interdiction** de les réutiliser en recette, preprod ou prod.

Variables backend : `APP_ENV` (pas `ENVIRONMENT`) — voir `backend/app/core/config.py`.

## Caractéristiques

| Aspect | Politique |
|--------|-----------|
| Données | Seed, fixtures, PostgreSQL Docker local |
| Secrets | `.env` local gitignoré ; modèles `.env.example` uniquement |
| Paiements | Mode test Stripe uniquement |
| Logs | Verbeux, stack traces autorisées côté dev |
| Accès | Équipe dev |

## Règles

- **Pas de données production** (ni dumps prod bruts)
- Pas de hack partagé comme solution permanente
- Hot reload activé (volume `./backend` monté)

## Base de données

- Nom : `yunicity_dev`
- Extensions : PostGIS, `uuid-ossp` (script `infra/docker/postgres/init/`)

## Reset local

```bash
bash scripts/reset-dev-env.sh
# ou .\scripts\reset-dev-env.ps1
```

## Documentation

- [infra/docker/README.md](../docker/README.md)
