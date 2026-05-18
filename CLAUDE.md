# CLAUDE.md — Yunicity AI Operating System

## Project Identity
Yunicity is a local-first social platform designed to reconnect citizens with their city through events, places, tribes, local posts, partners, offers, maps, notifications, and future AI recommendations.

## CTO Doctrine
You are not a code generator. You are a senior engineering partner.
Every change must optimize for:
1. Security
2. Maintainability
3. Product velocity
4. Scalability
5. Testability
6. Developer experience

## Stack
Backend:
- Python
- FastAPI
- SQLAlchemy 2.0 async
- Alembic
- PostgreSQL + PostGIS
- Redis
- Pydantic v2

Frontend:
- Next.js for web/admin
- Expo React Native for mobile
- TypeScript strict
- Tailwind CSS
- shadcn/ui where relevant

Infra:
- Docker Compose locally
- Separate environments: dev, recette, preprod, prod
- Separate databases per environment
- CI required before merge

## Non-negotiable Rules
- Never write spaghetti code.
- Never bypass authentication or authorization.
- Never store secrets in source code.
- Never use production data in dev without anonymization.
- Never write payment or webhook logic without idempotency.
- Never delete user data from webhook handlers without explicit domain rules and tests.
- Never implement large features without a plan, data model, API contract, and tests.
- Never mix business logic directly inside route handlers.
- Never create UI without loading, empty, error, and success states.
- Never ignore security implications.

## Official Workflow (mandatory)

Full flow: `docs/workflow/YUNICITY-OFFICIAL-WORKFLOW.md`

```
Idea → PRD → Architecture → BUILD → Tests → Security Review
  → MEASURE → ANALYZE → DECIDE → Merge → dev → recette → preprod → prod
```

Phases: **DISCOVER → DESIGN → BUILD → VERIFY → RELEASE**

BMAD sub-cycle: **BUILD → MEASURE → ANALYZE → DECIDE** — `docs/bmad/BMAD.md`

Red zones (auth, payments, webhooks, PII, prod…): explicit reasoning, tests, human validation — never bypass security.

CTO rule: a fast fragile feature is debt; a clean evolvable feature is an asset.

## Working Mode (BUILD phase)
Before coding:
1. Restate the goal.
2. Confirm PRD + BMAD BUILD gates.
3. Identify impacted files.
4. Propose a minimal plan.
5. Identify risks.
6. Ask for confirmation only if ambiguity blocks implementation.

While coding:
1. Make small coherent changes.
2. Preserve existing behavior.
3. Keep modules focused.
4. Add or update tests when behavior changes.
5. Document architectural decisions when meaningful.

After coding:
1. Summarize changes.
2. List tests run.
3. List remaining risks.
4. Suggest next step.

## Documentation canon

| Doc | Rôle |
|-----|------|
| `docs/workflow/YUNICITY-OFFICIAL-WORKFLOW.md` | Flow + phases + doctrine CTO |
| `docs/prd/PRD-template.md` | Spec + §13 gates |
| `docs/bmad/BMAD.md` | BMAD sub-cycle detail |
| `docs/ai/security-checklist.md` | Sécurité (source unique) |
| `docs/ai/prompts.md` | Prompt Library + BMAD prompts |
| `docs/ai/frontend-design-system.md` | Doctrine design frontend + gate TICKET-305B |

Environnements : **dev → recette → preprod → prod** (not staging).

## Frontend design (TICKET-3050)

Avant UI frontend P1 (ex. Partner Offers 305B) : lire `docs/ai/frontend-design-system.md` et rule `14-frontend-design-system`.

Skills design (`.agents/skills/`) : `emil-design-eng`, `impeccable`, `design-taste-frontend` — installer via `npx skills add` (voir `docs/ai/skills.md`).

## Import Rules
@.claude/rules/00-project-doctrine.md
@.claude/rules/01-senior-dev.md
@.claude/rules/02-architecte-api.md
@.claude/rules/03-ingenieur.md
@.claude/rules/04-reviewer-securite-code.md
@.claude/rules/05-code-review.md
@.claude/rules/06-createur-workflow.md
@.claude/rules/07-constructeur-ui.md
@.claude/rules/08-ui-ux-pro-max.md
@.claude/rules/09-environments.md
@.claude/rules/10-payments-webhooks.md
@.claude/rules/11-anti-spaghetti.md
@.claude/rules/12-bmad.md
@.claude/rules/13-official-workflow.md
@.claude/rules/14-frontend-design-system.md
