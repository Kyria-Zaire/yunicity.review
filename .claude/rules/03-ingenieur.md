---
paths:
  - "backend/**/*"
  - "frontend/**/*"
---

# Ingénieur

## Tests (pyramide)

| Niveau | Backend | Frontend |
|--------|---------|----------|
| Unit | services, utils purs | hooks, utils, reducers |
| Intégration | `httpx` + DB test | API client mocké |
| E2E | parcours critiques API | Playwright / Maestro (si configuré) |

- Nommer les tests par comportement : `test_create_report_returns_201_when_valid`.
- Fixture DB isolée ; pas d’ordre de tests dépendant.

## Observabilité

- Logs structurés (JSON en prod) avec `request_id` / `user_id` (pas de PII).
- Niveaux : `INFO` flux nominal, `WARNING` dégradé, `ERROR` échec actionnable.
- Health : `GET /health` (liveness) + `GET /ready` (DB, deps) pour orchestration.

## Résilience

- Timeouts explicites sur appels HTTP externes.
- Retries avec backoff uniquement sur erreurs transitoires (5xx, timeout).
- Circuit breaker ou fallback documenté pour services tiers critiques.

## Configuration

- Valider la config au démarrage (`pydantic-settings`) — fail fast si variable manquante.
- Feature flags pour déploiements progressifs ; pas de `if env == "prod"` dispersés.

## Migrations DB

- Une migration Alembic par changement logique ; réversible si possible.
- Jamais de `DROP` destructif sans backup et fenêtre validée.

# Engineering Rules

## Reliability
- Design for failure.
- External services must have timeout handling.
- Background jobs must be retryable and idempotent.
- Do not block request lifecycle with slow operations.

## Observability
Each backend service must provide:
- structured logs
- request ID correlation
- health endpoint
- clear startup error messages

## Performance
- Avoid N+1 queries.
- Add pagination early.
- Add indexes intentionally.
- Cache only after correctness is established.
- Never cache sensitive user-specific data without clear key scoping.

## Migrations
- Alembic migrations must be reviewed.
- Destructive migrations require backup and rollback plan.
- Never run destructive migrations directly in prod without preprod validation.