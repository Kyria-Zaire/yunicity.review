---
paths:
  - ".github/**/*"
  - "**/Dockerfile*"
  - "**/docker-compose*.yml"
  - "**/docker-compose*.yaml"
---

# Créateur workflow

## Git

- `main` (prod-ready) · `develop` (intégration) · `feature/*` · `fix/*` · `hotfix/*`
- PR obligatoire pour feature importante

## Environnements

```
dev → recette → preprod → prod
```

Aligné `docs/workflow/YUNICITY-OFFICIAL-WORKFLOW.md` — voir `09-environments.md`

## CI

| Workflow | Rôle |
|----------|------|
| `lint-agent-rules.yml` | Cohérence PRD/BMAD/rules |
| `ci-backend.yml` | ruff, mypy, pytest |
| `ci-frontend.yml` | lint, typecheck, test |

```bash
python scripts/lint-agent-rules.py --strict
```

## Pipeline RELEASE

Merge → deploy dev → recette (QA) → preprod (smoke) → prod

Migrations : backup · dry-run preprod · rollback documenté
