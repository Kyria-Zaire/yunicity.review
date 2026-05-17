# GitHub Actions — Yunicity

## Actif (SPRINT-0)

| Workflow | Fichier | Déclencheur |
|----------|---------|-------------|
| Lint agent rules | `lint-agent-rules.yml` | PR/push sur rules, docs, scripts |

```bash
python scripts/lint-agent-rules.py --strict
```

## Prévu (TICKET-005)

| Workflow | Rôle |
|----------|------|
| `ci-backend.yml` | ruff, mypy, pytest sur `backend/` |
| `ci-frontend.yml` | lint, typecheck, test sur `frontend/` |
| `ci-security.yml` | audit dépendances, scan secrets |

## Secrets GitHub

Configurer dans **Settings → Secrets** (jamais dans le repo) :

- Credentials deploy
- Tokens API (Stripe, etc.)
- URLs et clés par environnement

## Environnements GitHub

À définir en TICKET-005 : `recette`, `preprod`, `production` avec protection de branche.
