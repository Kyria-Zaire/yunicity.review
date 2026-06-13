# Architecture Yunicity

Vue d’ensemble cible — détail par ticket SPRINT-0+.

## Principes

- **Monorepo** : `backend/`, `frontend/`, `infra/`, `docs/`
- **API versionnée** : `/api/v1`
- **Local-first** : ville par ville (Reims en premier)
- **Sécurité by design** : authZ serveur, pas de confiance client

## Backend

```
Clients → FastAPI (routers) → services → SQLAlchemy → PostgreSQL/PostGIS
                              ↘ Redis (cache, jobs)
```

- Routers fins ; logique dans `services/`
- Pydantic v2 pour I/O ; Alembic pour migrations
- PostGIS pour lieux, événements, carte

## Frontend

```
apps/web | apps/admin | apps/mobile
         ↘ packages/ui, types, utils
              ↘ HTTP → API /api/v1
```

- Next.js : RSC où pertinent, client pour interactivité
- Expo : client API unique, états UI explicites
- Pas de logique métier lourde dans les composants

## Infra

- **Docker Compose** en dev (TICKET-004)
- **CI** GitHub Actions (TICKET-005)
- Promotion : `dev → recette → preprod → prod`

## Données

- PostgreSQL principal ; schéma par migration Alembic
- Une base par environnement
- PII minimisée ; RGPD documenté par feature

## Sécurité

| Zone | Approche |
|------|----------|
| Auth | JWT/session, refresh sécurisé, rate limits |
| AuthZ | RBAC + ownership ressource |
| Paiements | Stripe, webhooks signés, idempotence |
| Uploads | Validation MIME/taille, stockage isolé |
| Prod | PR + review + backup + rollback |

Checklist : [../ai/security-checklist.md](../ai/security-checklist.md)

## Documents

| Document | Sujet |
|----------|--------|
| [DESIGN-CREATORS-V2-local-video.md](../creators/DESIGN-CREATORS-V2-local-video.md) | **Local Video V2** — wireframes player + upload |
| [DESIGN-QUARTIERS-V2.md](../quartiers/DESIGN-QUARTIERS-V2.md) | **Quartiers V2** — hero vidéo-first, mémoire vivante |
| [cultural-media-strategy.md](./cultural-media-strategy.md) | Lieux culturels, seed, R2 futur |
| [ADR-CREATORS-V2-local-video-media.md](./ADR-CREATORS-V2-local-video-media.md) | **Local Video V2** — R2 + FFmpeg + CDN |
| [ADR-QUARTIERS-V2.md](./ADR-QUARTIERS-V2.md) | **Quartiers V2** — mémoire vivante, tables dédiées, detail API enrichi |
| [search.md](./search.md) | Search / Explorer |
