# Backend — Yunicity API

API REST **FastAPI** pour la plateforme Yunicity.

## État (SPRINT-0)

Dossier réservé. **TICKET-002** initialisera :

- `pyproject.toml`, structure `app/`
- FastAPI, Pydantic v2, SQLAlchemy 2 async
- Alembic, health checks
- Convention `/api/v1`

## Structure cible (TICKET-002)

```
backend/
├── app/
│   ├── main.py
│   ├── api/v1/
│   ├── core/
│   ├── models/
│   ├── schemas/
│   └── services/
├── alembic/
├── tests/
├── pyproject.toml
└── .env.example
```

## Règles

- Logique métier dans `services/`, pas dans les routers
- PostgreSQL + PostGIS pour la géolocalisation
- Redis pour cache / files (selon design)

Voir `.cursor/rules/backend-fastapi.mdc` et `docs/architecture/README.md`.
