# Registre des standards d'exécution IA

| Champ | Valeur |
|-------|--------|
| ID | DOC-GOV-02 |
| Version | 1.0 |
| Statut | **DRAFT** |
| Portée | IMORIA (écosystème) — inventaire descriptif |
| Projet de référence | Yunicity (premier inventaire) |
| Gouvernance associée | `docs/governance/AI-COLLABORATION.md` (DOC-GOV-01) |

> **Ce document ne crée aucune nouvelle règle.** Il inventorie, structure et décrit les artefacts d'exécution **déjà présents** dans le dépôt ou documentés par le projet. En cas de conflit de gouvernance (rôles, authorities, validation), **AI-COLLABORATION.md prévaut** (cf. § Couche d'exécution IA).

---

## 0. Objectif

Ce document constitue le **registre officiel des standards d'exécution** utilisés par les projets IMORIA pour piloter le comportement des agents IA au quotidien.

Il complète — sans remplacer — le standard fondateur de **gouvernance de collaboration** :

| Couche | Document | Rôle |
|--------|----------|------|
| Gouvernance | `docs/governance/AI-COLLABORATION.md` | Rôles, authorities, décisions, escalades, validation |
| Exécution | **Ce registre** (`EXECUTION-STANDARDS.md`) | Inventaire des rules, skills, guides, prompts, checklists |
| Implémentation | Code, infra, documentation produit | Livrables mergés |

**Non-objectif de ce registre :** dupliquer le contenu des rules, skills ou ADR ; modifier des artefacts existants ; prescrire de nouveaux mécanismes non observés.

---

## 1. Architecture des standards

Couches observées sur Yunicity — de la vision à l'implémentation :

```
AI Collaboration Standard          ← gouvernance (DOC-GOV-01)
        ↓
Execution Standards              ← ce registre (DOC-GOV-02)
        ↓
Skills · Rules · Playbooks · Guides
        ↓
BMAD · ADR · PRD · Tickets
        ↓
Code · Infrastructure · Documentation
```

**Lecture :**

- **AI Collaboration** fixe *qui* décide et *comment* valider.
- **Execution Standards** recense *comment* les agents sont guidés opérationnellement (rules, skills, prompts…).
- **BMAD / ADR / PRD / Tickets** cadrent le travail par feature et par décision structurante.
- **Code / infra / doc** est la preuve d'état réel (cf. DOC-GOV-01 §2.2 — Vérification de l'état réel).

---

## 2. Catégories

Les familles ci-dessous existent **aujourd'hui** sur Yunicity. D'autres projets IMORIA peuvent compléter leur inventaire (§6) sans changer cette structure.

### Skills

| Aspect | Description observée |
|--------|----------------------|
| **Objectif** | Compétences procédurales chargées à la demande par l'agent (design, review, split PR, canvas, etc.) |
| **Responsabilité** | Préciser *comment* exécuter une classe de tâches (motion UI, revue sécurité, babysit PR…) |
| **Emplacements Yunicity** | `.agents/skills/` (local, listé dans `docs/ai/skills.md`, **gitignored**) ; skills Cursor globaux utilisateur (hors dépôt, documentés dans `docs/ai/skills.md`) ; modes expert `.claude/skills.md` |
| **Exemples existants (repo / doc)** | `emil-design-eng`, `impeccable`, `design-taste-frontend` (`.agents/skills/`, via `docs/ai/skills.md`) ; `babysit`, `split-to-prs`, `review-security` (Cursor global, via `docs/ai/skills.md`) |

### Rules (`.mdc` / `.md`)

| Aspect | Description observée |
|--------|----------------------|
| **Objectif** | Contraintes persistantes injectées dans le contexte agent (doctrine, BMAD, stack, zones rouges) |
| **Priorité** | Rules `alwaysApply: true` > rules chargées par glob/chemin > rules `agent_requestable` ; en cas de conflit avec ADR → **ADR prévaut** ; en cas de conflit gouvernance → **AI-COLLABORATION prévaut** |
| **Quand elles s'appliquent** | Toujours (`alwaysApply: true`) ou selon fichiers touchés / demande explicite (`alwaysApply: false`) |
| **Emplacements Yunicity** | `.cursor/rules/*.mdc` (canon Cursor) ; `.claude/rules/*.md` (parité Claude Code, chargement conditionnel `paths`) |
| **Parité documentée** | `.cursor/Cursor.md` ↔ `CLAUDE.md` ; `.cursor/rules/` ↔ `.claude/rules/` (`docs/ai/skills.md`) |

**Usage observé (Rule ↔ Skill) :** les Rules définissent les comportements transversaux, la doctrine commune, les conventions et les contraintes applicables à l'ensemble du projet (ex. BMAD, workflow, stack). Les Skills décrivent des procédures spécialisées permettant d'exécuter un domaine ou une tâche particulière **conformément** aux Rules, à la gouvernance et aux standards du projet — chargées à la demande pour une exécution ponctuelle (cf. §3, ligne « Rule vs skill »). *Précédent :* `docs/ai/skills.md` — rules 07/08/14 et doctrine canon avant skills design.

### Playbooks

| Aspect | Description observée |
|--------|----------------------|
| **Objectif** | Scénarios opérationnels pas-à-pas (incident, release, rollback, onboarding ops) |
| **Quand utiliser** | Procédures répétables multi-étapes hors scope d'une simple rule ou checklist |
| **État Yunicity** | **Aucun fichier `*playbook*` identifié dans le dépôt** — rôle partiellement couvert par `docs/workflow/`, `docs/ops/`, `docs/ai/prompts.md` (workflows par type de tâche) |
| **Exemples** | *À compléter* (playbooks formels non créés à ce jour) |

### Guides opérationnels

| Aspect | Description observée |
|--------|----------------------|
| **Objectif** | Documentation de référence pour agents et humains (stack, arborescence, workflows, MCP) |
| **Exemples existants** | `CLAUDE.md`, `.cursor/Cursor.md`, `docs/ai/skills.md`, `docs/workflow/YUNICITY-OFFICIAL-WORKFLOW.md`, `docs/ai/frontend-design-system.md` |

### BMAD

| Aspect | Description observée |
|--------|----------------------|
| **Objectif** | Sous-cycle BUILD → MEASURE → ANALYZE → DECIDE |
| **Relation avec Skills** | Les prompts BMAD (`docs/ai/prompts.md`) activent des postures d'agent ; les skills spécialisés complètent sur des tâches fines (UI, sécurité…) |
| **Relation avec ADR** | BMAD cadre *quand* construire et mesurer ; **ADR tranche les décisions structurantes** — une rule BMAD ne remplace jamais un ADR |
| **Artefacts** | `docs/bmad/BMAD.md`, `.cursor/rules/12-bmad.mdc`, `.claude/rules/12-bmad.md`, `docs/workflow/YUNICITY-OFFICIAL-WORKFLOW.md` |

### Prompts

| Aspect | Description observée |
|--------|----------------------|
| **Objectif** | Bibliothèque de prompts réutilisables (implémentation, sécurité, API, UI, BMAD) |
| **Artefacts** | `docs/ai/prompts.md`, `.claude/skills.md` (modes `/seniordev`, `/architecte-api`, etc.) |

### Checklists

| Type | Artefact observé | Phase |
|------|------------------|-------|
| **BUILD** | Gates PRD §13 (`docs/prd/PRD-template.md`), `docs/bmad/BMAD.md` §1 | Avant code |
| **QA** | `docs/qa/*.md` (ex. smoke `MEDIA-INFRA-V1-smoke-test.md`) | VERIFY |
| **Release** | `docs/ai/security-checklist.md` (merge + release) ; workflow § environnements (`docs/workflow/YUNICITY-OFFICIAL-WORKFLOW.md`) | VERIFY / RELEASE |
| **Security** | `docs/ai/security-checklist.md`, `.cursor/rules/04-reviewer-securite-code.mdc`, `.cursor/rules/security-checklist.mdc` | BUILD / VERIFY |

---

## 3. Hiérarchie

En cas de contradiction apparente entre documents, l'ordre de précédence observé est :

```
AI Collaboration (DOC-GOV-01)
        ↓
Execution Standards (DOC-GOV-02) — inventaire, pas arbitre de conflit technique
        ↓
Project Standards — ADR, PRD, workflow projet, checklists canon
        ↓
Rules / Skills / Guides — mise en œuvre opérationnelle
        ↓
Tickets — scope et critères d'acceptation du travail en cours
        ↓
Implementation — code mergé, CI, déploiement (état réel)
```

**Règles descriptives observées :**

| Situation | Prévaut |
|-----------|---------|
| Conflit gouvernance (rôle, validation, escalade) | `AI-COLLABORATION.md` |
| Conflit décision structurante (architecture, API publique) | **ADR** + Architecture Authority |
| Conflit scope produit | **PRD / ticket** + Product Authority |
| Conflit rule vs ADR | **ADR** |
| Statut ticket « terminé » vs code non mergé | **État réel vérifié** (DOC-GOV-01 §2.2) |
| Rule vs skill sur même sujet | Rule de doctrine/BMAD ; skill pour exécution spécialisée ponctuelle |

---

## 4. Cycle de vie

Pratiques **observées** sur Yunicity — non prescriptives au-delà de ce qui existe déjà.

| Phase | Pratique observée |
|-------|-------------------|
| **Création** | Nouvelle rule → `.cursor/rules/` (+ parité `.claude/rules/` si applicable) ; skill design → `.agents/skills/` + entrée `docs/ai/skills.md` ; guide → `docs/ai/` ou `docs/workflow/` ; ADR → `docs/architecture/` ou `docs/adr/` |
| **Révision** | Modification in-repo + PR ; standards fondateurs (DOC-GOV-*) → procédure de review DOC-GOV-01 ; dette documentée en ticket dédié (ex. VIDEO-03B) |
| **Dépréciation** | Marquage explicite dans le doc (statut, note historique) ; renvoi vers remplaçant |
| **Archivage** | `docs/_archive/` + stub de renvoi — **pas de suppression** (VIDEO-DOCS-SYNC-01) |
| **Suppression** | Non pratiquée pour la documentation de référence ; artefacts obsolètes archivés |

---

## 5. Bonnes pratiques

Formulations issues des pratiques existantes — **ne constituent pas de nouvelles règles** :

| Pratique | Source observée |
|----------|-----------------|
| Éviter les doublons rule / skill / guide sur le même sujet | `docs/ai/skills.md`, doctrine anti-spaghetti |
| Ne pas créer un skill si une rule suffit | Logique `docs/ai/skills.md` (doctrine canon + rules 07/08/14 avant skills design) |
| Une rule ne remplace jamais un ADR | DOC-GOV-01 §6 Non-objectifs ; hiérarchie §3 |
| Un playbook (futur) ne remplace jamais la gouvernance | DOC-GOV-01 § Couche d'exécution IA |
| Parité Cursor ↔ Claude quand les deux sont utilisés | `docs/ai/skills.md`, `CLAUDE.md` |
| Inventorier avant d'ajouter un artefact d'exécution | Ce registre (DOC-GOV-02) |
| Vérifier l'état réel avant de cocher un gate | DOC-GOV-01 §2.2 (VIDEO-01B) |

---

## 6. Inventaire actuel

> Tableau **descriptif** au moment de la rédaction DOC-GOV-02. Dates : non centralisées — voir historique git du fichier. Entrées **non trouvées dans le dépôt** : marquées *à compléter*.

### 6.1 Gouvernance et registre

| Nom | Type | Projet | Statut | Description | Dernière mise à jour |
|-----|------|--------|--------|-------------|----------------------|
| `AI-COLLABORATION.md` | Gouvernance | IMORIA / Yunicity | APPROVED (Founder) | Standard fondateur collaboration humain–IA | — |
| `EXECUTION-STANDARDS.md` | Registre | IMORIA / Yunicity | DRAFT | Inventaire standards d'exécution (ce document) | 2026-06-29 |

### 6.2 Rules Cursor (`.cursor/rules/`)

| Nom | Type | Projet | Statut | Description | Dernière mise à jour |
|-----|------|--------|--------|-------------|----------------------|
| `00-project-doctrine.mdc` | Rule | Yunicity | Actif (`alwaysApply`) | Vision, monorepo, BMAD, standards | — |
| `01-senior-dev.mdc` | Rule | Yunicity | Actif (`alwaysApply`) | Posture senior, minimalisme, ownership | — |
| `02-architecte-api.mdc` | Rule | Yunicity | Actif (conditionnel) | Architecture API, contrats, boundaries | — |
| `03-ingenieur.mdc` | Rule | Yunicity | Actif (conditionnel) | Tests, observabilité, robustesse | — |
| `04-reviewer-securite-code.mdc` | Rule | Yunicity | Actif (conditionnel) | Revue sécurité OWASP, authZ | — |
| `05-code-review.mdc` | Rule | Yunicity | Actif (requestable) | Checklist revue PR | — |
| `06-createur-workflow.mdc` | Rule | Yunicity | Actif (conditionnel) | CI/CD, git, promotion envs | — |
| `07-constructeur-ui.mdc` | Rule | Yunicity | Actif (conditionnel) | Composants, états UI React/Next/Expo | — |
| `08-ui-ux-pro-max.mdc` | Rule | Yunicity | Actif (conditionnel) | Design system, accessibilité | — |
| `09-environments.mdc` | Rule | Yunicity | Actif (conditionnel) | dev → recette → preprod → prod | — |
| `10-payments-webhooks.mdc` | Rule | Yunicity | Actif (conditionnel) | Stripe, webhooks, idempotence | — |
| `11-anti-spaghetti.mdc` | Rule | Yunicity | Actif (conditionnel) | Structure, dépendances, dette | — |
| `12-bmad.mdc` | Rule | Yunicity | Actif (`alwaysApply`) | BUILD → MEASURE → ANALYZE → DECIDE | — |
| `13-official-workflow.mdc` | Rule | Yunicity | Actif (`alwaysApply`) | Workflow PRD, phases, zones rouges | — |
| `14-frontend-design-system.mdc` | Rule | Yunicity | Actif (conditionnel) | Doctrine design frontend, gate 305B | — |
| `backend-fastapi.mdc` | Rule | Yunicity | Actif (conditionnel) | FastAPI, services, SQLAlchemy async | — |
| `frontend-next-expo.mdc` | Rule | Yunicity | Actif (conditionnel) | Next.js, Expo, TypeScript | — |
| `security-checklist.mdc` | Rule | Yunicity | Actif (requestable) | Renvoi vers checklist sécurité merge/release | — |

### 6.3 Rules Claude (parité — `.claude/rules/`)

| Nom | Type | Projet | Statut | Description | Dernière mise à jour |
|-----|------|--------|--------|-------------|----------------------|
| `*.md` (18 fichiers) | Rule | Yunicity | Actif | Parité sémantique avec `.cursor/rules/` | — |

### 6.4 Skills (projet local — `.agents/skills/`)

> Dossier **gitignored** (`.gitignore`) — présent en local, inventorié via `docs/ai/skills.md`.

| Nom | Type | Projet | Statut | Description | Dernière mise à jour |
|-----|------|--------|--------|-------------|----------------------|
| `emil-design-eng` | Skill | Yunicity | Actif (local) | Motion UI, `prefers-reduced-motion` | — |
| `impeccable` | Skill | Yunicity | Actif (local) | Hiérarchie, typo, spatial | — |
| `design-taste-frontend` | Skill | Yunicity | Actif (local) | Anti-slop, intention produit | — |
| `brandkit` | Skill | Yunicity | Actif (local) | Génération assets brand | — |
| `full-output-enforcement` | Skill | Yunicity | Actif (local) | Output complet sans truncation | — |
| `gpt-taste` | Skill | Yunicity | Actif (local) | UX/UI, motion GSAP | — |
| `high-end-visual-design` | Skill | Yunicity | Actif (local) | Design premium | — |
| `image-to-code` | Skill | Yunicity | Actif (local) | Référence visuelle → code | — |
| `imagegen-frontend-mobile` | Skill | Yunicity | Actif (local) | Concepts mobile | — |
| `imagegen-frontend-web` | Skill | Yunicity | Actif (local) | Concepts web par section | — |
| `industrial-brutalist-ui` | Skill | Yunicity | Actif (local) | Style industrial brutalist | — |
| `minimalist-ui` | Skill | Yunicity | Actif (local) | Style éditorial minimal | — |
| `redesign-existing-projects` | Skill | Yunicity | Actif (local) | Upgrade UI existant | — |
| `stitch-design-taste` | Skill | Yunicity | Actif (local) | Design system sémantique | — |

### 6.5 Skills Cursor (global utilisateur — hors dépôt)

Documentés dans `docs/ai/skills.md` — **non versionnés dans le repo Yunicity**.

| Nom | Type | Projet | Statut | Description | Dernière mise à jour |
|-----|------|--------|--------|-------------|----------------------|
| `create-rule` | Skill | Cursor global | Documenté | Créer/modifier rules | — |
| `create-skill` | Skill | Cursor global | Documenté | Créer skills | — |
| `split-to-prs` | Skill | Cursor global | Documenté | Découper changements en PRs | — |
| `babysit` | Skill | Cursor global | Documenté | PR merge-ready, CI | — |
| `canvas` | Skill | Cursor global | Documenté | Livrables analytiques visuels | — |
| `review-security` | Skill | Cursor global | Documenté | Revue sécurité (subagent) | — |
| `review-bugbot` | Skill | Cursor global | Documenté | Revue type Bugbot | — |
| `sdk` | Skill | Cursor global | Documenté | Automatisation agents Cursor | — |
| *autres* | Skill | Cursor global | Documenté | Voir installation poste (`~/.cursor/skills-cursor/`) | — |

### 6.6 Playbooks

| Nom | Type | Projet | Statut | Description | Dernière mise à jour |
|-----|------|--------|--------|-------------|----------------------|
| *Playbooks formels* | Playbook | IMORIA | **À compléter** | Aucun fichier playbook trouvé dans le dépôt | — |

### 6.7 Guides, prompts, BMAD, workflows

| Nom | Type | Projet | Statut | Description | Dernière mise à jour |
|-----|------|--------|--------|-------------|----------------------|
| `CLAUDE.md` | Guide | Yunicity | Actif | Mémoire projet Claude Code | — |
| `.cursor/Cursor.md` | Guide | Yunicity | Actif | Mémoire projet Cursor | — |
| `docs/ai/skills.md` | Guide | Yunicity | Actif | Skills, MCP, workflows par tâche | — |
| `docs/ai/prompts.md` | Prompts | Yunicity | Actif | Bibliothèque prompts + BMAD | — |
| `.claude/skills.md` | Prompts / modes | Yunicity | Actif | Modes expert Claude (`/seniordev`, etc.) | — |
| `docs/bmad/BMAD.md` | BMAD | Yunicity | Actif | Méthode BUILD → MEASURE → ANALYZE → DECIDE | — |
| `docs/workflow/YUNICITY-OFFICIAL-WORKFLOW.md` | Workflow | Yunicity | Actif | Flow Idea → Production | — |
| `docs/workflow/FEATURE-ROADMAP-POST-RC.md` | Workflow | Yunicity | Actif | Roadmap post Reality Check | — |
| `docs/ai/frontend-design-system.md` | Guide | Yunicity | Actif | Doctrine design frontend canon | — |
| `docs/prd/PRD-template.md` | Guide | Yunicity | Actif | Template PRD + gates §13 | — |

### 6.8 Checklists et QA

| Nom | Type | Projet | Statut | Description | Dernière mise à jour |
|-----|------|--------|--------|-------------|----------------------|
| `docs/ai/security-checklist.md` | Checklist | Yunicity | Actif | Sécurité merge + release | — |
| `docs/qa/MEDIA-INFRA-V1-smoke-test.md` | Checklist QA | Yunicity | Actif | Smoke R2 / worker recette | — |
| *Checklist release formelle* | Checklist | IMORIA | **À compléter** | Pas de doc dédié `*release-checklist*` unique | — |

### 6.9 Projets IMORIA — inventaire à compléter

| Projet | Rules | Skills | Guides | Statut registre |
|--------|-------|--------|--------|-----------------|
| Yunicity | §6.2–6.3 | §6.4–6.5 | §6.7 | Inventaire initial DOC-GOV-02 |
| YURPASS | *À compléter* | *À compléter* | *À compléter* | — |
| SharingGO | *À compléter* | *À compléter* | *À compléter* | — |

---

## Historique des révisions

| Version | Date | Changement |
|---------|------|------------|
| **v1.0** | 2026-06-29 | DOC-GOV-02 — Création du registre des standards d'exécution (inventaire Yunicity) |

---

## Références

| Document | Lien |
|----------|------|
| Gouvernance collaboration | `docs/governance/AI-COLLABORATION.md` |
| Index skills projet | `docs/ai/skills.md` |
| Workflow officiel | `docs/workflow/YUNICITY-OFFICIAL-WORKFLOW.md` |
