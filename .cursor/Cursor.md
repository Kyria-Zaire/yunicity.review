# Yunicity — guide agents Cursor

Plateforme sociale locale (démarrage **Reims**). Monorepo Backend FastAPI + Frontend Next.js / Expo.

## Doctrine (CTO)

1. Sécurité · 2. Architecture propre · 3. Changements incrémentaux · 4. Typage & validation · 5. Tests · 6. DX

**Workflow officiel** : [`YUNICITY-OFFICIAL-WORKFLOW.md`](../docs/workflow/YUNICITY-OFFICIAL-WORKFLOW.md)

```
Idea → PRD → BUILD → Tests → Security Review → MEASURE → ANALYZE → DECIDE → Merge → dev → recette → preprod → prod
```

Phases : DISCOVER → DESIGN → BUILD → VERIFY → RELEASE · BMAD : BUILD → MEASURE → ANALYZE → DECIDE

## Stack

| Couche | Technologie | Dossier |
|--------|-------------|---------|
| API | Python 3.12+, FastAPI, Pydantic v2, SQLAlchemy async, PostGIS | `Backend/` |
| Web / admin | Next.js App Router, TypeScript, Tailwind, shadcn/ui | `Frontend/` |
| Mobile | Expo / React Native | `Frontend/` |
| Qualité | Ruff, mypy, ESLint, Prettier | sous-dossiers |

> `Backend/` et `Frontend/` peuvent être vides au bootstrap — adapter les commandes quand `pyproject.toml` / `package.json` existent.

## Arborescence

```
yunicity/
├── CLAUDE.md
├── .claude/rules/          # parité .md
├── .cursor/Cursor.md       # ce fichier
├── .cursor/rules/          # .mdc
├── docs/prd/               # PRD-XXX features
├── docs/workflow/          # workflow officiel
├── docs/bmad/              # sous-cycle BMAD
├── docs/ai/                # prompts, security-checklist
├── backend/
├── frontend/
├── infra/
└── scripts/
```

## Environnements (canon)

```
dev → recette → preprod → prod
```

Une base de données par environnement. Voir `09-environments.mdc`.

## Qualité docs / rules

```bash
python scripts/lint-agent-rules.py          # cohérence .cursor / .claude / PRD / BMAD
python scripts/lint-agent-rules.py --strict # mode CI
```

## Commandes dev

### Backend

```bash
cd Backend && python -m venv .venv
# Windows: .venv\Scripts\activate
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000
pytest && ruff check . && mypy .
```

### Frontend

```bash
cd Frontend && npm install && npm run dev
npx expo start
npm run lint && npm run typecheck && npm test
```

## Conventions agents

- Répondre en **français** à l’utilisateur
- Ne pas committer sans demande explicite
- Identifier la **phase BMAD** avant d’agir
- Règles : `.cursor/rules/` · Parité Claude : `.claude/rules/`

## Règles Cursor

| Fichier | Portée |
|---------|--------|
| `00-project-doctrine.mdc` | Toujours — vision, BMAD, monorepo |
| `01-senior-dev.mdc` | Toujours — posture senior |
| `12-bmad.mdc` | Toujours — sous-cycle BMAD |
| `13-official-workflow.mdc` | Toujours — flow officiel |
| `02-architecte-api.mdc` | `Backend/**` |
| `03-ingenieur.mdc` | Tests, observabilité |
| `04-reviewer-securite-code.mdc` | Revue sécurité |
| `05-code-review.mdc` | Checklist PR |
| `06-createur-workflow.mdc` | CI/CD, promotion env |
| `07-constructeur-ui.mdc` | Composants UI |
| `08-ui-ux-pro-max.mdc` | Design, a11y |
| `14-frontend-design-system.mdc` | Doctrine design, motion, anti-slop, gate 305B |
| `09-environments.mdc` | dev/recette/preprod/prod |
| `10-payments-webhooks.mdc` | Stripe, idempotence |
| `11-anti-spaghetti.mdc` | Structure code |
| `security-checklist.mdc` | → `docs/ai/security-checklist.md` |
| `backend-fastapi.mdc` | Conventions FastAPI |
| `frontend-next-expo.mdc` | Next + Expo |

## Documentation

| Doc | Usage |
|-----|--------|
| [YUNICITY-OFFICIAL-WORKFLOW.md](../docs/workflow/YUNICITY-OFFICIAL-WORKFLOW.md) | Flow Idea → Production |
| [PRD-template.md](../docs/prd/PRD-template.md) | Spec feature + §13 |
| [BMAD.md](../docs/bmad/BMAD.md) | BUILD → MEASURE → ANALYZE → DECIDE |
| [prompts.md](../docs/ai/prompts.md) | Prompt Library + BMAD |
| [security-checklist.md](../docs/ai/security-checklist.md) | Avant merge / release |
| [skills.md](../docs/ai/skills.md) | Workflows agents |
| [frontend-design-system.md](../docs/ai/frontend-design-system.md) | Design frontend canon + gate 305B |
