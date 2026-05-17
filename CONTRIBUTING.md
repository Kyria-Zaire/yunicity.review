# Contribuer à Yunicity

Merci de respecter ce guide avant toute PR.

## Branches

| Branche | Usage |
|---------|--------|
| `main` | Code prêt pour production |
| `develop` | Intégration continue des features |
| `feature/*` | Nouvelles fonctionnalités |
| `fix/*` | Corrections |
| `hotfix/*` | Correctifs urgents prod (validation CTO) |

Flux recommandé : `feature/*` → PR vers `develop` → promotion vers `main` après VERIFY/RELEASE.

## Commits

- **Langue** : anglais (convention technique)
- **Format** : phrase courte à l’impératif ou descriptive (`Add monorepo foundation`, `Fix CORS config`)
- **Corps** (optionnel) : expliquer le *pourquoi*, pas seulement le quoi
- Un sujet par commit quand possible

## Pull requests

- **PR obligatoire** pour toute feature importante
- Lier le ticket (ex. `SPRINT-0 / TICKET-001`)
- Remplir le [template PR](.github/pull_request_template.md)
- Répondre en **français** dans la description si l’équipe est FR
- Pas de mélange feature + refactor massif dans une même PR

## Revue

1. **Code review** — checklist `.cursor/rules/05-code-review.mdc`
2. **Sécurité** — `docs/ai/security-checklist.md` si auth, PII, paiements, webhooks, admin
3. **Architecture** — routes fines, pas de spaghetti (`11-anti-spaghetti`)
4. **CTO** — obligatoire pour zones rouges et promotion prod

## Workflow BMAD

Chaque feature significative suit :

```
Idea → PRD → Architecture → BUILD → Tests → Security Review
  → MEASURE → ANALYZE → DECIDE → Merge → dev → recette → preprod → prod
```

| Phase | Livrable minimal |
|-------|------------------|
| DISCOVER | PRD, stories, risques |
| DESIGN | Archi, schéma DB, endpoints, UX |
| BUILD | Code, tests, migrations |
| VERIFY | QA, reviews |
| RELEASE | Deploy, monitoring, rollback |

Référence : [docs/workflow/YUNICITY-OFFICIAL-WORKFLOW.md](docs/workflow/YUNICITY-OFFICIAL-WORKFLOW.md)

## Definition of Done

- [ ] Critères d’acceptation du ticket / PRD remplis
- [ ] Tests sur chemins critiques (quand code présent)
- [ ] Pas de secret dans le diff
- [ ] `.env.example` à jour si nouvelles variables
- [ ] Documentation mise à jour si comportement ou structure change
- [ ] CI verte (quand workflows actifs)
- [ ] Review approuvée
- [ ] Phase BMAD / statut PRD cohérent

## Sécurité

- Jamais de `.env`, tokens, clés API ou credentials réels dans Git
- AuthZ vérifiée sur chaque endpoint sensible
- Migrations destructives : backup + dry-run preprod + rollback documenté
- Prod : pas de hack temporaire — voir [infra/environments/prod.md](infra/environments/prod.md)

## Tests attendus

| Couche | Outil (cible) |
|--------|----------------|
| Backend | pytest, httpx, ruff, mypy |
| Frontend | ESLint, TypeScript, Vitest/Jest |
| CI | GitHub Actions (TICKET-005) |

## Qualité locale

```bash
python scripts/lint-agent-rules.py --strict
```

Vérifie la cohérence des règles `.cursor/` / `.claude/` avec PRD et BMAD.

## Questions

Ouvrir une issue ou contacter l’owner technique du ticket avant d’implémenter une architecture critique non décrite dans le PRD.
