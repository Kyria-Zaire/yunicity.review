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

> **État actuel (SPRINT-0)** : fondation monorepo uniquement. Pas encore d’app FastAPI, Next.js ni Expo initialisées — voir tickets TICKET-002 à TICKET-005.

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

## Commandes (prévues — actives après TICKET-002+)

```bash
# Qualité docs / règles agents (disponible dès maintenant)
python scripts/lint-agent-rules.py --strict

# Backend (TICKET-002)
# cd backend && pip install -e ".[dev]" && uvicorn app.main:app --reload

# Frontend web (TICKET-003)
# cd frontend && npm install && npm run dev --workspace=web

# Docker (TICKET-004)
# docker compose -f infra/docker/compose.yml up -d
```

## Agents IA

- Cursor : [.cursor/Cursor.md](.cursor/Cursor.md)
- Claude Code : [CLAUDE.md](CLAUDE.md)

## Prochaines étapes (SPRINT-0)

| Ticket | Objectif |
|--------|----------|
| TICKET-002 | Backend FastAPI Foundation |
| TICKET-003 | Frontend Foundation |
| TICKET-004 | Docker + Environments |
| TICKET-005 | CI/CD Quality Gates |
