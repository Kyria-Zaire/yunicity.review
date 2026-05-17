# Docker — Yunicity

## État (SPRINT-0)

Placeholder. **TICKET-004** ajoutera :

- `compose.yml` (PostgreSQL/PostGIS, Redis, API, optionnel web)
- Dockerfiles multi-stage backend
- Healthchecks, réseaux, volumes nommés
- User non-root en runtime

## Usage prévu (après TICKET-004)

```bash
docker compose -f infra/docker/compose.yml up -d
docker compose -f infra/docker/compose.yml down
```

Ne pas committer de secrets dans les fichiers Compose — utiliser des fichiers `.env` locaux gitignorés.
