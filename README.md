# Yunicity

Réseau social **local-first** — reconnecter les citoyens à leur ville (démarrage : **Reims**).

Dépôt : [github.com/Kyria-Zaire/yunicity.review](https://github.com/Kyria-Zaire/yunicity.review)

## Vision

Une plateforme claire, accessible et de confiance : événements, lieux, tribus, fil local, partenaires, offres, carte et notifications — sans complexité nationale prématurée.

## Stack cible

| Couche | Technologies |
|--------|----------------|
| **Backend** | Python 3.12+, FastAPI, Pydantic v2, SQLAlchemy 2 async, Alembic, PostgreSQL + PostGIS, Redis |
| **Frontend web / admin** | Next.js (App Router), TypeScript strict, Tailwind, shadcn/ui |
| **Mobile** | Expo / React Native |
| **Infra** | Docker Compose, GitHub Actions |
| **Méthode** | PRD + workflow officiel + BMAD |

> **État actuel (SPRINT-0)** : fondation monorepo, backend, frontend, Docker local et CI quality gates en place.

## Structure du dépôt

```
yunicity/
├── backend/              # API FastAPI (TICKET-002)
├── frontend/             # Monorepo web / admin / mobile (TICKET-003)
│   ├── apps/
│   └── packages/
├── docs/                 # PRD, BMAD, architecture, IA
├── infra/                # Docker, environnements
├── scripts/              # Outils dev & qualité
├── .github/              # CI/CD, templates PR
├── .cursor/              # Règles agents Cursor
├── .claude/              # Règles agents Claude Code
├── CLAUDE.md
└── CONTRIBUTING.md
```

Détail : [docs/README.md](docs/README.md) · Architecture : [docs/architecture/README.md](docs/architecture/README.md)

## Workflow de développement

1. **PRD** — `docs/prd/PRD-XXX-*.md` à partir du [template](docs/prd/PRD-template.md)
2. **Phases** — DISCOVER → DESIGN → BUILD → VERIFY → RELEASE ([workflow officiel](docs/workflow/YUNICITY-OFFICIAL-WORKFLOW.md))
3. **BMAD** — BUILD → MEASURE → ANALYZE → DECIDE ([BMAD.md](docs/bmad/BMAD.md))
4. **PR** obligatoire pour toute feature importante — [template](.github/pull_request_template.md)
5. **Contribution** — [CONTRIBUTING.md](CONTRIBUTING.md)

## Environnements

```
dev → recette → preprod → prod
```

Une base de données par environnement. Documentation : [infra/environments/](infra/environments/).

| Env | Rôle |
|-----|------|
| dev | Développement local |
| recette | Validation fonctionnelle |
| preprod | Simulation production |
| prod | Utilisateurs réels |

## Sécurité — aucun secret dans Git

- **Interdit** : `.env`, `.env.prod`, clés API, tokens, mots de passe, credentials DB réels
- **Autorisé** : `.env.example` avec clés factices et commentaires
- Production : validation CTO, backup, plan de rollback ([prod](infra/environments/prod.md))

## CI/CD (GitHub Actions)

Quality gates sur **`main`** — détail : [.github/workflows/README.md](.github/workflows/README.md)

| Workflow | Rôle |
|----------|------|
| `backend-ci.yml` | ruff, mypy, pytest |
| `frontend-ci.yml` | lint, typecheck, build |
| `docker-ci.yml` | compose, health/ready, pytest conteneur |
| `pr-checks.yml` | `.env`/clés interdits, Gitleaks, audit deps |
| `lint-agent-rules.yml` | cohérence règles agents & PRD |

Avant merge : **CI verte** + review. Configurer les branch protection rules sur GitHub.

## Commandes locales

```bash
# Règles agents (miroir CI)
python scripts/lint-agent-rules.py --strict

# Backend
cd backend && pip install -e ".[dev]" && ruff check . && mypy app tests && pytest
uvicorn app.main:create_app --factory --reload

# Frontend
cd frontend && pnpm install && pnpm --filter web dev

# Docker (racine repo)
docker compose up --build -d
curl http://localhost:8000/api/v1/health
docker compose down -v
```

## Agents IA

- Cursor : [.cursor/Cursor.md](.cursor/Cursor.md)
- Claude Code : [CLAUDE.md](CLAUDE.md)

## Prochaines étapes (SPRINT-0)

| Ticket | Objectif |
|--------|----------|
| TICKET-002 | Backend FastAPI Foundation — **fait** |
| TICKET-003 | Frontend Foundation — **fait** |
| TICKET-004 | Docker + Environments — **fait** |
| TICKET-005 | CI/CD Quality Gates — **fait** |
