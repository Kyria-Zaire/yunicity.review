# Carte des connaissances IMORIA

| Champ | Valeur |
|-------|--------|
| ID | DOC-GOV-03 |
| Version | 1.0 |
| Statut | **DRAFT** |
| Portée | IMORIA (écosystème) — carte descriptive |
| Projet de référence | Yunicity (premier graphe documenté) |
| Documents associés | `AI-COLLABORATION.md` (DOC-GOV-01) · `EXECUTION-STANDARDS.md` (DOC-GOV-02) |

> **Ce document ne crée aucune règle et ne remplace aucun standard.** Il décrit **comment les artefacts existants se relient entre eux** — pour naviguer, comprendre les dépendances et identifier l'autorité en cas de doute.

---

## 0. Objectif

Ce document est la **carte des connaissances** de l'écosystème IMORIA : un graphe documentaire lisible par humains et agents.

Il permet de répondre sans parcourir l'arborescence au hasard :

| Question | Où chercher (famille) |
|----------|------------------------|
| Quel document fait autorité ? | §4 Graphe de précédence |
| Qu'est-ce qui dépend de quoi ? | §1 Architecture · §2 Relations |
| Quel artefact complète quel autre ? | §2 Relations |
| Quel niveau prévaut en cas de conflit ? | §4 Graphe de précédence |
| Chemin d'une décision jusqu'au code ? | §3 Flux documentaire |

**Complémentarité des trois piliers gouvernance :**

| ID | Document | Métaphore | Rôle |
|----|----------|-----------|------|
| DOC-GOV-01 | `docs/governance/AI-COLLABORATION.md` | Constitution | Gouvernance — rôles, authorities, validation |
| DOC-GOV-02 | `docs/governance/EXECUTION-STANDARDS.md` | Registre | Inventaire des rules, skills, guides, checklists |
| DOC-GOV-03 | **Ce document** | Carte | Relations et navigation entre tous les artefacts |

---

## 1. Architecture globale

Niveaux observés sur Yunicity — du cadre de collaboration à l'implémentation :

```
DOC-GOV-01
AI Collaboration Standard
        ↓
DOC-GOV-02
Execution Standards Registry
        ↓
Rules · Skills · Playbooks · Guides
        ↓
BMAD · PRD · ADR · RFC · Reality Checks
        ↓
Tickets
        ↓
Code · Infrastructure · Documentation
```

**Légende :**

| Niveau | Nature | Exemples Yunicity (chemins réels) |
|--------|--------|-----------------------------------|
| **Gouvernance** | Qui décide, comment valider | `docs/governance/AI-COLLABORATION.md` |
| **Registre exécution** | Index des mécanismes opérationnels | `docs/governance/EXECUTION-STANDARDS.md` |
| **Exécution** | Comportement agent au quotidien | `.cursor/rules/`, `.agents/skills/`, `docs/ai/prompts.md`, `CLAUDE.md` |
| **Cadre projet** | Méthode et specs par feature | `docs/bmad/BMAD.md`, `docs/prd/`, `docs/architecture/ADR-*.md`, `docs/adr/` |
| **Travail courant** | Scope borné en cours | Tickets (ex. VIDEO-03A, DOC-GOV-02) |
| **Réalité** | Preuve vérifiable | `backend/`, `frontend/`, infra, `docs/api/`, merges git |

**RFC :** catégorie reconnue par DOC-GOV-01 (précédence procédure spécialisée) — **aucun fichier RFC identifié** dans le dépôt Yunicity à ce jour (*à compléter si créé*).

**Playbooks :** catégorie du registre DOC-GOV-02 — **aucun playbook formel** ; rôle partiel de `docs/workflow/`, `docs/ops/`, `docs/ai/prompts.md`.

---

## 2. Relations

Pour chaque famille : **dépend de** · **complète** · **est utilisée par** · **ne remplace jamais**.

Relations descriptives — fondées sur les pratiques Yunicity et les documents DOC-GOV-01 / DOC-GOV-02.

---

### AI Collaboration Standard (DOC-GOV-01)

| Relation | Artefacts |
|----------|-----------|
| **Dépend de** | — (niveau racine gouvernance IMORIA) |
| **Complète** | — |
| **Est utilisée par** | Product Authority, Architecture Authority, Execution Agent, Review Agent, QA-Security Agent ; tickets de gouvernance (DOC-GOV-01.*, DOC-GOV-02, DOC-GOV-03) |
| **Ne remplace jamais** | — ; en revanche **ne remplace pas** ADR, PRD, checklists sécurité, workflow release (cf. §6 DOC-GOV-01) |

---

### Execution Standards Registry (DOC-GOV-02)

| Relation | Artefacts |
|----------|-----------|
| **Dépend de** | DOC-GOV-01 (cadre gouvernance) |
| **Complète** | DOC-GOV-01 (couche d'exécution inventoriée) |
| **Est utilisée par** | Execution Agent, Review Agent ; humains maintenant le registre §6 |
| **Ne remplace jamais** | DOC-GOV-01 ; rules ; ADR ; PRD |

---

### Knowledge Map (DOC-GOV-03 — ce document)

| Relation | Artefacts |
|----------|-----------|
| **Dépend de** | DOC-GOV-01, DOC-GOV-02 |
| **Complète** | Les deux documents gouvernance (vue graphe) |
| **Est utilisée par** | Navigation humaine et future couche Knowledge Engine (IMORIA AI Orchestra) |
| **Ne remplace jamais** | Aucun document source — index des relations uniquement |

---

### Rules (`.cursor/rules/`, `.claude/rules/`)

| Relation | Artefacts |
|----------|-----------|
| **Dépend de** | DOC-GOV-01 (cohérence gouvernance) ; souvent `docs/bmad/BMAD.md`, `docs/workflow/YUNICITY-OFFICIAL-WORKFLOW.md` |
| **Complète** | DOC-GOV-01 (mise en œuvre opérationnelle) ; guides `CLAUDE.md`, `.cursor/Cursor.md` |
| **Est utilisée par** | Execution Agent, Review Agent, QA-Security Agent |
| **Ne remplace jamais** | DOC-GOV-01 ; ADR ; PRD ; tickets |

*Inventaire détaillé :* DOC-GOV-02 §6.2–6.3.

---

### Skills (`.agents/skills/`, Cursor global, `.claude/skills.md`)

| Relation | Artefacts |
|----------|-----------|
| **Dépend de** | Rules de doctrine (ex. `14-frontend-design-system`) ; `docs/ai/skills.md` |
| **Complète** | Rules et guides pour tâches spécialisées (UI, review, split PR…) |
| **Est utilisée par** | Execution Agent, Review Agent (à la demande) |
| **Ne remplace jamais** | Rules alwaysApply ; ADR ; gouvernance |

*Inventaire :* DOC-GOV-02 §6.4–6.5.

---

### Playbooks

| Relation | Artefacts |
|----------|-----------|
| **Dépend de** | Workflow, checklists, gouvernance |
| **Complète** | Rules + guides pour scénarios multi-étapes |
| **Est utilisée par** | Humains ops, Execution Agent (procédures) |
| **Ne remplace jamais** | DOC-GOV-01 ; ADR |
| **État Yunicity** | *À compléter* — couverture partielle par `docs/ops/`, `docs/workflow/` |

---

### Guides opérationnels

| Relation | Artefacts |
|----------|-----------|
| **Dépend de** | Workflow officiel, stack projet |
| **Complète** | Rules, skills, prompts |
| **Est utilisée par** | Tous les rôles |
| **Ne remplace jamais** | PRD feature ; ADR |

*Exemples :* `docs/ai/skills.md`, `docs/workflow/YUNICITY-OFFICIAL-WORKFLOW.md`, `docs/ai/frontend-design-system.md`, `CLAUDE.md`, `.cursor/Cursor.md`.

---

### BMAD (`docs/bmad/BMAD.md`, rule `12-bmad`)

| Relation | Artefacts |
|----------|-----------|
| **Dépend de** | `docs/workflow/YUNICITY-OFFICIAL-WORKFLOW.md` ; DOC-GOV-01 (phase BUILD / validation) |
| **Complète** | PRD §13 gates ; workflow phases DISCOVER → RELEASE |
| **Est utilisée par** | Execution Agent (BUILD) ; Product Authority (MEASURE → DECIDE) |
| **Ne remplace jamais** | ADR ; DOC-GOV-01 ; tickets |

---

### PRD (`docs/prd/PRD-*.md`, `docs/prd/PRD-template.md`)

| Relation | Artefacts |
|----------|-----------|
| **Dépend de** | Vision produit ; Reality Checks (post-audit) ; BMAD gates |
| **Complète** | DOC-GOV-01 (scope, critères d'acceptation produit) |
| **Est utilisée par** | Product Authority, Architecture Authority, Execution Agent, tickets feature |
| **Ne remplace jamais** | ADR décisions structurantes ; code mergé (doc peut être en retard — sync doc) |

*Exemples :* `PRD-CREATORS-V2-local-video.md`, `PRD-QUARTIERS-V2-neighborhoods-living-memory.md`.

---

### ADR (`docs/architecture/ADR-*.md`, `docs/adr/`)

| Relation | Artefacts |
|----------|-----------|
| **Dépend de** | PRD ou ticket identifiant une décision structurante ; BMAD DESIGN/BUILD |
| **Complète** | BMAD (décision technique formalisée) ; PRD §6 architecture |
| **Est utilisée par** | Architecture Authority, Execution Agent, Review Agent |
| **Ne remplace jamais** | DOC-GOV-01 ; Product Authority sur scope MVP |

*Exemples :* `ADR-CREATORS-V2-local-video-media.md`, `ADR-VIDEO-03A-async-media-processing-worker.md`, `ADR-QUARTIERS-V2.md`.

---

### RFC

| Relation | Artefacts |
|----------|-----------|
| **Dépend de** | — |
| **Complète** | — |
| **Est utilisée par** | — |
| **Ne remplace jamais** | DOC-GOV-01 |
| **État Yunicity** | *À compléter* — catégorie citée par DOC-GOV-01, aucun RFC versionné trouvé |

---

### Reality Checks

| Relation | Artefacts |
|----------|-----------|
| **Dépend de** | Produit déployé / auditable (read-only) |
| **Complète** | Vision terrain avant roadmap d'exécution |
| **Est utilisée par** | Product Authority, Architecture Authority |
| **Ne remplace jamais** | PRD ; ADR |

*Exemples :* FEATURE-REALITY-CHECK-V1 (RC-01 à RC-06) → `docs/workflow/FEATURE-ROADMAP-POST-RC.md`.

---

### Tickets

| Relation | Artefacts |
|----------|-----------|
| **Dépend de** | PRD, ADR, roadmap, ou ticket gouvernance parent |
| **Complète** | BMAD (unité de travail BUILD) ; DOC-GOV-01 (traçabilité) |
| **Est utilisée par** | Execution Agent, Review Agent, QA-Security Agent |
| **Ne remplace jamais** | ADR ; DOC-GOV-01 ; gates non révisés explicitement |

*Exemples observés :* VIDEO-01, VIDEO-03A, VIDEO-DOCS-SYNC-01, DOC-GOV-01.*, RF-* (REALITY-FIX).

---

### Code · Infrastructure · Documentation produit

| Relation | Artefacts |
|----------|-----------|
| **Dépend de** | Tickets validés ; ADR/PRD applicables |
| **Complète** | Toute la chaîne amont (preuve d'état réel) |
| **Est utilisée par** | QA-Security Agent, Review Agent ; MEASURE post-deploy |
| **Ne remplace jamais** | ADR/PRD par simple existence — en cas de drift, **sync doc** (ex. VIDEO-DOCS-SYNC-01) |

*Documentation dérivée :* `docs/api/`, `docs/ops/`, rapports sync — **suit** le code mergé (DOC-GOV-01 §2.2).

---

### Checklists · Prompts

| Relation | Artefacts |
|----------|-----------|
| **Checklists** (`docs/ai/security-checklist.md`, `docs/qa/*`) | **Dépendent de** workflow + BMAD VERIFY ; **utilisées par** QA-Security Agent ; **ne remplacent jamais** ADR |
| **Prompts** (`docs/ai/prompts.md`, `.claude/skills.md`) | **Dépendent de** rules ; **complètent** skills ; **utilisés par** Execution Agent |

*Inventaire :* DOC-GOV-02 §6.7–6.8.

---

## 3. Flux documentaire

Cycle observé — de la vision à la connaissance consolidée :

```
Vision (Founder / produit)
        ↓
PRD (DISCOVER → DESIGN, gates §13)
        ↓
BMAD (BUILD → … → DECIDE)
        ↓
ADR (si décision structurante)
        ↓
Ticket (scope borné, critères acceptation)
        ↓
Code (+ tests, migrations, infra)
        ↓
Review (Review Agent + humain, rules 04/05, checklists)
        ↓
Merge (humain, branche de référence — état réel)
        ↓
Documentation (sync si drift, ops, API docs, rapports)
        ↓
Knowledge (registre, carte, archives, MEASURE → ANALYZE)
```

**Variantes observées :**

| Entrée | Chemin |
|--------|--------|
| Audit terrain | Reality Checks → roadmap (`FEATURE-ROADMAP-POST-RC`) → tickets RF-* / VIDEO-* |
| Gouvernance seule | DOC-GOV-* → pas de code ; validation Founder |
| Doc sync post-merge | Ticket doc (VIDEO-DOCS-SYNC-01) → doc suit code, pas l'inverse |
| Challenge architecture en cours de BUILD | Pause ticket → ADR amendée → reprise (DOC-GOV-01 §2.5 B) |

**Rôles sur le flux (DOC-GOV-01) :**

```
DISCOVER/AUDIT  →  Product + Architecture (GO BUILD)
BUILD           →  Execution Agent (rules, skills, PRD, ADR)
REVIEW          →  Review Agent → merge humain
QA/SECURITY     →  QA-Security Agent → GO ops humain
DOCUMENTATION   →  Execution Agent (ticket doc) ou sync dédiée
```

---

## 4. Graphe de précédence

En cas de **contradiction apparente**, ordre observé (du plus fort au plus faible pour trancher) :

```
1. Gouvernance          →  docs/governance/AI-COLLABORATION.md (DOC-GOV-01)
2. Standards d'exécution →  registre + rules/skills cohérents DOC-GOV-01
3. Standards projet     →  workflow, checklists canon, PRD-template
4. ADR                  →  décision structurante approuvée / IMPLEMENTED
5. PRD                  →  scope et contrats feature
6. Ticket               →  scope courant (ne modifie pas implicitement ADR/PRD)
7. Code (état réel)     →  merge vérifié prime sur doc obsolète
8. Documentation dérivée →  sync post-merge ; archive si superseded
```

**Pourquoi cet ordre (descriptif, pratiques Yunicity) :**

| Rang | Raison |
|------|--------|
| Gouvernance | Fixe *qui* tranche et *comment* escalader — sans cela, conflits techniques sans arbitre |
| Exécution | Précise le comportement agent sans créer de nouvelles authorities |
| Standards projet | Workflow et checklists sont la procédure spécialisée reconnue par DOC-GOV-01 §6 |
| ADR | Décisions difficiles à inverser, validées Architecture Authority (VIDEO-03A) |
| PRD | Contrat produit ; un ticket ne réduit pas le scope sans Product Authority |
| Ticket | Borné dans le temps ; statut « terminé » ≠ validé sans preuve (VIDEO-01B) |
| Code | Source de vérité implémentation après merge (VIDEO-DOCS-SYNC-01) |
| Doc dérivée | Informative ; mise à jour via ticket sync, sections historiques conservées |

**Cas particuliers documentés (DOC-GOV-01 §2.5) :**

| Cas | Règle |
|-----|-------|
| PRD dit 201, code dit 202 | Code mergé + sync doc |
| Rule vs ADR | ADR |
| Review Agent vs merge | Pas de veto Review ; arbitrage Founder L3b si blocage |
| Doc vs ticket « done » | Vérification état réel (CI, merge, smoke) |

---

## 5. Questions de navigation

### Pour savoir…

| Question | Famille · point d'entrée |
|----------|---------------------------|
| **Qui décide ?** | DOC-GOV-01 §1 rôles · §2 Authority Matrix · Founder (L3b) |
| **Où trouver les rules ?** | `.cursor/rules/` · `.claude/rules/` · DOC-GOV-02 §6.2–6.3 |
| **Où trouver les skills ?** | `.agents/skills/` (local) · `docs/ai/skills.md` · DOC-GOV-02 §6.4–6.5 |
| **Où modifier un workflow ?** | `docs/workflow/YUNICITY-OFFICIAL-WORKFLOW.md` · `docs/bmad/BMAD.md` · rule `13-official-workflow` |
| **Où est le registre complet des artefacts d'exécution ?** | `docs/governance/EXECUTION-STANDARDS.md` (DOC-GOV-02) |
| **Comment retrouver l'origine d'une décision ?** | Ticket → ADR liée → PRD feature → merge commit · DOC-GOV-01 §2.6 |
| **Comment savoir si une règle est encore valide ?** | 1) Pas superseded par ADR/ticket gouvernance · 2) Présente dans DOC-GOV-02 §6 · 3) Cohérente avec code mergé · 4) Révision explicite si remplacement (DOC-GOV-01 stabilité décisions) |
| **Quel document pour une feature ?** | `docs/prd/PRD-<feature>.md` + ADR `docs/architecture/` ou `docs/adr/` |
| **Où est la checklist sécurité ?** | `docs/ai/security-checklist.md` · rule `04-reviewer-securite-code` |
| **Où sont les prompts réutilisables ?** | `docs/ai/prompts.md` · `.claude/skills.md` |
| **Comment naviguer le graphe ?** | **Ce document** (DOC-GOV-03) |
| **Playbook incident / release ?** | *À compléter* — `docs/ops/`, workflow, security-checklist en attendant |

---

## 6. Limites

Cette carte :

| Fait | Ne fait pas |
|------|-------------|
| Décrit les relations entre artefacts **existants** | Créer de nouvelles règles ou catégories |
| Facilite navigation humaine et future automation (Knowledge Engine) | Remplacer DOC-GOV-01, DOC-GOV-02, PRD, ADR, rules |
| Pointe vers chemins réels Yunicity | Inventer des documents absents (RFC, playbooks → *à compléter*) |
| Peut être dupliquée par projet IMORIA | Imposer une arborescence fichiers identique entre projets |

**Maintenance :** lorsqu'un nouvel artefact d'exécution ou une nouvelle famille apparaît → mettre à jour DOC-GOV-02 §6 **puis** les relations pertinentes dans ce document (ticket DOC-GOV-03.x si changement de graphe).

---

## Schéma — architecture documentaire (synthèse)

```
                    ┌─────────────────────────┐
                    │   DOC-GOV-01            │
                    │   AI Collaboration      │
                    └───────────┬─────────────┘
                                │
                    ┌───────────▼─────────────┐
                    │   DOC-GOV-02            │
                    │   Execution Registry    │
                    └───────────┬─────────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         │                      │                      │
    ┌────▼────┐           ┌─────▼─────┐          ┌─────▼─────┐
    │ Rules   │           │ Skills    │          │ Guides    │
    └────┬────┘           └─────┬─────┘          └─────┬─────┘
         │                      │                      │
         └──────────────────────┼──────────────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
         ┌────▼────┐      ┌─────▼─────┐     ┌─────▼─────┐
         │  BMAD   │      │ PRD · ADR │     │ Reality   │
         └────┬────┘      └─────┬─────┘     │ Checks    │
              │                 │           └─────┬─────┘
              └────────┬────────┘                 │
                       │                          │
                  ┌────▼────┐                     │
                  │ Tickets │◄────────────────────┘
                  └────┬────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
    ┌────▼────┐  ┌─────▼─────┐ ┌────▼────┐
    │  Code   │  │   Infra   │ │   Doc   │
    └────┬────┘  └───────────┘ └────┬────┘
         │                          │
         └──────────┬───────────────┘
                    │
            ┌───────▼───────┐
            │  DOC-GOV-03   │
            │ Knowledge Map │
            └───────────────┘
```

---

## Historique des révisions

| Version | Date | Changement |
|---------|------|------------|
| **v1.0** | 2026-06-29 | DOC-GOV-03 — Création carte des connaissances IMORIA (graphe Yunicity) |

---

## Références

| Document | Chemin |
|----------|--------|
| Constitution | `docs/governance/AI-COLLABORATION.md` |
| Registre exécution | `docs/governance/EXECUTION-STANDARDS.md` |
| Workflow officiel | `docs/workflow/YUNICITY-OFFICIAL-WORKFLOW.md` |
| BMAD | `docs/bmad/BMAD.md` |
| Index skills | `docs/ai/skills.md` |
