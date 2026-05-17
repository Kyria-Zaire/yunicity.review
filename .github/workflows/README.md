# GitHub Actions — Yunicity (TICKET-005)

Empêcher du **code cassé** ou des **secrets** d’entrer sur `main`.

## Workflows

| Workflow | Fichier | Déclencheur | Gates |
|----------|---------|-------------|--------|
| Backend CI | `backend-ci.yml` | PR/push `main` · `backend/**` | ruff, mypy, pytest |
| Frontend CI | `frontend-ci.yml` | PR/push `main` · `frontend/**` | lint, typecheck, build |
| Docker CI | `docker-ci.yml` | PR/push `main` · compose/Dockerfile | config, up, health/ready, pytest in container |
| PR Safety | `pr-checks.yml` | Toute PR/push `main` | fichiers interdits, Gitleaks, pip/pnpm audit |
| Agent rules | `lint-agent-rules.yml` | PR/push · rules & docs agents | `lint-agent-rules.py --strict` |

## Branch protection (`main`)

Recommandé : **Require status checks** avant merge :

- `ruff · mypy · pytest` (Backend CI)
- `lint · typecheck · build` (Frontend CI)
- `compose · health · pytest` (Docker CI — si stack modifiée)
- `Forbidden paths & artifacts`, `Gitleaks`, `Dependency audit` (PR Safety)
- `lint-agent-rules` (si PR touche `.cursor/`, docs agents)

## Local (miroir CI)

```bash
python scripts/lint-agent-rules.py --strict

cd backend && pip install -e ".[dev]" && ruff check . && mypy app tests && pytest

cd frontend && pnpm install --frozen-lockfile && pnpm lint && pnpm typecheck && pnpm build

docker compose config
docker compose up --build -d
curl -fsS http://localhost:8000/api/v1/health
curl -fsS http://localhost:8000/api/v1/ready
docker compose exec -T backend pytest
docker compose down -v
```

## Secrets

Aucun secret requis pour ces workflows. Credentials **DEV ONLY** dans `docker-compose.yml` (non prod).
