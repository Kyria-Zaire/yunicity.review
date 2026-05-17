# Scripts — Yunicity

Outils de développement et qualité (hors logique métier).

## Disponibles (SPRINT-0)

### `lint-agent-rules.py`

Vérifie la cohérence des règles `.cursor/` / `.claude/` avec PRD, BMAD et workflow officiel.

```bash
python scripts/lint-agent-rules.py
python scripts/lint-agent-rules.py --strict   # mode CI
```

Contrôles : frontmatter unique, parité Cursor↔Claude, docs canon, pas de `staging` / secrets patterns.

## Prévus (tickets suivants)

| Script | Ticket |
|--------|--------|
| Bootstrap backend | TICKET-002 |
| Bootstrap frontend workspace | TICKET-003 |
| `docker-up.sh` / compose helpers | TICKET-004 |
| CI wrappers | TICKET-005 |

## Conventions

- Scripts portables (Python 3.12+ ou shell documenté)
- Pas de secrets en dur
- Documenter chaque nouveau script dans ce README
