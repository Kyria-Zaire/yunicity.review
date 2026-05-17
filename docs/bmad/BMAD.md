# BMAD — Méthode Yunicity

**B**uild → **M**easure → **A**nalyze → **D**ecide

Sous-cycle du **workflow officiel** Yunicity. Voir `docs/workflow/YUNICITY-OFFICIAL-WORKFLOW.md` pour le flow complet (Idea → PRD → … → Production).

```
Phases officielles : DISCOVER → DESIGN → BUILD → VERIFY → RELEASE
Sous-cycle BMAD   : BUILD → MEASURE → ANALYZE → DECIDE (VERIFY/RELEASE)
```

Références : `docs/prd/PRD-template.md`, `docs/ai/security-checklist.md`, règles `12-bmad` + `13-official-workflow`.

---

## 1. BUILD

### Objectif

Construire la **plus petite version correcte et sécurisée**.

### Règles

- Build **petit** — MVP strict du PRD section « Inclus MVP ».
- Build **modulaire** — routers fins, services, schemas séparés.
- Build **testable** — tests avec le code, pas après.
- **Pas** de sur-ingénierie ni de feature creep.

### Obligatoire avant code

| Gate | Où documenter |
|------|----------------|
| PRD validé | `docs/prd/PRD-XXX-*.md` statut ≥ BUILD |
| Architecture identifiée | PRD §6 + plan court en PR / issue |
| Risques identifiés | PRD §2 + §7 |
| Permissions définies | PRD §6 endpoints (authZ) |
| Endpoints définis | PRD §6 contrats request/response |
| Modèle DB défini | PRD §6 + migration Alembic planifiée |

Si un gate manque → **ne pas coder** ; compléter le PRD ou demander validation.

### Livrables BUILD

- [ ] Code (Backend + Frontend selon scope)
- [ ] Migrations Alembic (si persistance)
- [ ] Tests (unit + intégration sur chemins critiques)
- [ ] Documentation : `.env.example`, PRD mis à jour, ADR si décision structurante

### Interdictions BUILD

| Interdit | Alternative |
|----------|-------------|
| Coder sans plan | Plan 5 lignes + fichiers impactés |
| Logique métier dans routes | `app/services/` |
| Patch rapide en prod | Hotfix via pipeline + rollback |
| Secrets hardcodés | Variables d’environnement |
| Bypass sécurité | AuthZ sur chaque endpoint sensible |

### Checklist agent (BUILD)

1. Relire PRD + gates ci-dessus.
2. Lister fichiers impactés.
3. Implémenter le plus petit incrément testable.
4. Exécuter tests / lint.
5. Mettre à jour PRD §12 (historique) et §13 (BMAD) si comportement diverge.

---

## 2. MEASURE

### Objectif

Mesurer si la feature **fonctionne réellement** en conditions réelles (recette puis prod).

### À mesurer

#### Produit

| Métrique | Exemple | Source |
|----------|---------|--------|
| Adoption | % users ayant utilisé la feature | analytics |
| Taux conversion | clic → action complétée | funnel |
| Engagement | actions / user / semaine | events |
| Rétention | retour J+7 sur la feature | cohortes |

#### Technique

| Métrique | Seuil à définir | Source |
|----------|-----------------|--------|
| Temps réponse API (p50/p95) | ex. p95 < 300ms | APM / logs |
| Erreurs 4xx/5xx | taux < X% | monitoring |
| Crash mobile | sessions sans crash | Sentry / EAS |
| Consommation DB | slow queries, connexions | PG stats |
| Queue failures | jobs en échec | worker metrics |

#### Sécurité

| Signal | Action si anormal |
|--------|-------------------|
| Abus / spam | rate limit, blocage |
| Tentatives auth | alerte brute-force |
| Rate limit hits | ajuster seuils ou UX |

#### UX

| Signal | Indice |
|--------|--------|
| Confusion | support tickets, abandons |
| Friction | temps étape, clics |
| Abandon flow | drop-off par écran |

### Livrables MEASURE

- [ ] Dashboard ou requêtes documentées
- [ ] Période de mesure définie (ex. 2 semaines post-deploy recette)
- [ ] Baseline vs post-feature notée dans PRD ou ticket

---

## 3. ANALYZE

### Objectif

Comprendre les **données** et détecter problèmes produit, technique et sécurité.

### Questions produit

- Le scope PRD était-il correct ?
- La feature apporte-t-elle une **vraie valeur** (métriques MEASURE) ?
- Où sont les abandons / frictions UX ?
- Quelles fonctionnalités sont inutilisées ?

### Questions techniques

- Où sont les **ralentissements** (p95, N+1, PostGIS) ?
- Où est la **dette technique** introduite ou révélée ?
- Quels **patterns** reviennent (duplication, erreurs récurrentes) ?
- Quels **risques sécurité** sont apparus (abus, IDOR tentatives) ?

### Grille d’analyse

| Domaine | Points à inspecter |
|---------|-------------------|
| Architecture | couplage, boundaries, fichiers > 300 lignes |
| Queries | EXPLAIN, index manquants |
| Code | duplication, erreurs runtime logs |
| DX | friction dev, flakiness tests |
| Produit | onboarding, engagement, confusion |

### Livrables ANALYZE

- [ ] Synthèse 1 page : faits, hypothèses, recommandations
- [ ] Liste priorisée : P0 bugs / P1 dette / P2 idées
- [ ] Mise à jour PRD §11 Open questions résolues

---

## 4. DECIDE

### Objectif

Décider **quoi faire ensuite** sur preuves (MEASURE + ANALYZE), pas sur intuition.

### Possibilités

| Décision | Quand |
|----------|-------|
| **Scaler** | Métriques OK + architecture saine |
| **Refactor** | Valeur OK mais dette bloque la vélocité |
| **Optimiser** | Goulots mesurés (perf, coût) |
| **Supprimer** | Feature inutilisée ou coût > valeur |
| **Repousser** | Scope trop large — découper PRD v2 |
| **Sécuriser** | Signaux abus / vulnérabilités |
| **Monitorer davantage** | Incertitude — prolonger MEASURE |

### Règle CTO

> **Ne jamais scaler une mauvaise architecture.**

Si ANALYZE révèle dette structurelle ou risques sécurité : **refactor ou sécuriser d’abord**, puis scaler trafic / marketing / rollout élargi.

### Livrables DECIDE

- [ ] Décision explicite documentée (PRD statut, ticket, ADR)
- [ ] Prochaines actions avec owner et date
- [ ] Si DONE : critères de succès atteints ou feature décommissionnée

---

## Mapping PRD ↔ phases officielles ↔ BMAD

| Statut PRD | Phase officielle | BMAD | Sections PRD |
|------------|------------------|------|--------------|
| DISCOVER | DISCOVER | — | §1–3, risques §2 |
| DESIGN | DESIGN | — | §5 UX, §6 archi, §7 sécurité |
| BUILD | BUILD | BUILD | §4, §6, §13 gates |
| VERIFY | VERIFY | Tests + reviews | §9, security-checklist |
| RELEASE | RELEASE | MEASURE → ANALYZE → DECIDE | §10, §13 métriques & décision |

---

## Cohérence documentation (sources canon)

| Sujet | Source unique |
|-------|----------------|
| Workflow complet | `docs/workflow/YUNICITY-OFFICIAL-WORKFLOW.md` |
| Spécification feature | `docs/prd/PRD-XXX-*.md` (template : `PRD-template.md`) |
| Sous-cycle BMAD | `docs/bmad/BMAD.md` (ce fichier) |
| Checklist sécurité | `docs/ai/security-checklist.md` |
| Environnements | dev → recette → preprod → prod (`09-environments`) |
| Règles agents Cursor | `.cursor/rules/*.mdc` |
| Règles agents Claude | `.claude/rules/*.md` (parité contenu) |

---

## Prompts agents

Voir `docs/ai/prompts.md` — section **BMAD Prompts**.

## CI — lint cohérence

```bash
python scripts/lint-agent-rules.py --strict
```

Vérifie : frontmatter unique, pas de `staging` / `yunicity-core`, parité Cursor↔Claude, docs canon.
