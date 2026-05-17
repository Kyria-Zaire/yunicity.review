# Skills & outils — Yunicity

Guide pour agents et développeurs : quand utiliser quels skills Cursor, Claude Code, MCP et workflows.

## Claude Code

| Fichier | Rôle |
|---------|------|
| `CLAUDE.md` | Mémoire projet (racine) |
| `.claude/rules/*.md` | Règles modulaires (`paths` = chargement conditionnel) |
| `.claude/skills.md` | Workflows détaillés |
| `.claude/settings.local.example.json` | Modèle de config locale (copier → `settings.local.json`) |

Parité Cursor : `.cursor/Cursor.md` ↔ `CLAUDE.md`, `.cursor/rules/*.mdc` ↔ `.claude/rules/*.md`.

## Skills Cursor (utilisateur global)

| Skill | Quand l’utiliser |
|-------|------------------|
| `create-rule` | Ajouter ou modifier des règles `.cursor/rules/` |
| `create-skill` | Créer un skill projet ou personnel |
| `split-to-prs` | Découper un gros lot de changements en PRs reviewables |
| `babysit` | PR bloquée (CI, conflits, commentaires) — boucle jusqu’à merge-ready |
| `canvas` | Livrables analytiques visuels (audits, tableaux, explorations data) |
| `sdk` | Automatiser des agents Cursor depuis scripts/CI (`@cursor/sdk`) |

## MCP disponibles (workspace)

| Serveur | Usage Yunicity |
|---------|----------------|
| `cursor-ide-browser` | Tester l’app Next.js en local, parcours UI, snapshots avant clics |
| GitKraken / GitLens | Opérations git avancées, historique, blame (si configuré) |

### Browser — workflow recommandé

1. `browser_navigate` → URL locale (`http://localhost:3000`)
2. `browser_snapshot` avant toute interaction
3. Vérifier après chaque action (navigation, formulaire, modal)

## Workflows par type de tâche

### Nouvelle feature full-stack

1. Lire [YUNICITY-OFFICIAL-WORKFLOW.md](../workflow/YUNICITY-OFFICIAL-WORKFLOW.md)
2. Créer / compléter `docs/prd/PRD-XXX-*.md` (DISCOVER → DESIGN → §13 gates)
3. Phase **BUILD** : ne pas coder si gates non cochés
3. Rules `00-project-doctrine`, `12-bmad`, `backend-fastapi`, `frontend-next-expo`
4. Schémas → migration → endpoints → client API → UI (états loading/empty/error)
5. Tests ; `docs/ai/security-checklist.md` si auth / PII / paiements
6. Post-deploy : **MEASURE → ANALYZE → DECIDE** (mettre à jour PRD §13)

### Bugfix

1. Reproduire (test ou browser MCP)
2. Corriger à la source (pas de patch symptôme uniquement)
3. Test de régression minimal

### Revue / PR

1. Rule `05-code-review.mdc`
2. `04-reviewer-securite-code.mdc` + `docs/ai/security-checklist.md` si surface sensible
3. Skill `babysit` si CI rouge

### Sécurité

1. Rule `04-reviewer-securite-code.mdc`
2. Prompt dédié dans `prompts.md` (section Sécurité)
3. Pas de commit de secrets — scan diff manuel

## Workflow officiel

Flow complet : [YUNICITY-OFFICIAL-WORKFLOW.md](../workflow/YUNICITY-OFFICIAL-WORKFLOW.md)

Phases : **DISCOVER → DESIGN → BUILD → VERIFY → RELEASE**

## BMAD (sous-cycle)

**BUILD → MEASURE → ANALYZE → DECIDE** — [BMAD.md](../bmad/BMAD.md)

| Phase | Quand |
|-------|-------|
| BUILD | Après PRD validé ; gates avant code |
| MEASURE | Post-deploy recette/prod |
| ANALYZE | Données collectées |
| DECIDE | Prochaine action ; règle CTO : ne pas scaler une mauvaise archi |

Prompts : [prompts.md](prompts.md) → section **BMAD Prompts**.

## Prompt Library

Rôles spécialisés (Senior, Security, API, UI, Refactor) : section **Yunicity Prompt Library** dans [prompts.md](prompts.md).

## Conventions agents

- Langue utilisateur : **français**
- Pas de commit sans demande
- Explorer `Backend/` et `Frontend/` avant d’inventer des chemins ou deps

## À créer quand le code existe

- Skill projet `.cursor/skills/yunicity-api.md` (génération client OpenAPI)
- Workflow CI documenté dans README racine
- EAS / Vercel : secrets dans le dashboard, pas dans le repo
