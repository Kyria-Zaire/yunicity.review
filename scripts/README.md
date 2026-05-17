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

### `reset-dev-env.sh` / `reset-dev-env.ps1`

**DEV ONLY** — supprime les volumes Docker locaux (Postgres, Redis) et relance la stack.

```bash
bash scripts/reset-dev-env.sh
```

```powershell
.\scripts\reset-dev-env.ps1
```

Ne pas utiliser hors environnement de développement local.

## Prévus (tickets suivants)

| Script | Ticket |
|--------|--------|
| Bootstrap frontend workspace | TICKET-003 |
| CI | `.github/workflows/ci-*.yml` — **fait** (TICKET-005) |

## Conventions

- Scripts portables (Python 3.12+ ou shell documenté)
- Pas de secrets en dur
- Documenter chaque nouveau script dans ce README
