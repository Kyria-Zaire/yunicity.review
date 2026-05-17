# Prompts réutilisables — Yunicity

Copier-coller et adapter les sections entre `---`.

Règles projet : `.cursor/rules/` ou `.claude/rules/` — workflow : `docs/workflow/YUNICITY-OFFICIAL-WORKFLOW.md` — checklists : `docs/ai/security-checklist.md`.

---

## Yunicity Prompt Library

Prompts courts (anglais) pour rôles spécialisés. Complètent les sections françaises ci-dessous.

### Senior Implementation Prompt

```
You are a senior full-stack engineer on Yunicity. Implement the requested feature with clean architecture, strong typing, validation, security checks, and tests. Before coding, provide a short plan and list impacted files. Do not create spaghetti code. Do not bypass auth. Do not touch unrelated files.

Context: [feature goal in 1-2 sentences]
Stack: FastAPI + Pydantic v2 + SQLAlchemy async (Backend/), Next.js + Expo (Frontend/)
Rules: .cursor/rules/12-bmad.mdc (BUILD gates), 01-senior-dev.mdc, 11-anti-spaghetti.mdc — respond to the user in French.
Do not commit unless explicitly asked.
```

### Security Review Prompt

```
You are a security reviewer. Inspect this code for high-severity issues only: auth bypass, IDOR, SQL injection, XSS, SSRF, CSRF, open redirects, secret leaks, unsafe file uploads, webhook replay, payment tampering, data loss. For each issue, provide severity, exploit scenario, impact, fix, and regression test.

Scope: [files, module, or PR diff]
Reference: .cursor/rules/04-reviewer-securite-code.mdc and docs/ai/security-checklist.md
Respond in French. Ignore low-severity style issues.
```

### API Architect Prompt

```
You are the API architect for Yunicity. Design the endpoint, request/response schemas, database model, service layer, authorization rule, indexes, and test cases. Keep route handlers thin. Use FastAPI, SQLAlchemy async, Alembic, PostgreSQL/PostGIS, and Pydantic v2.

Feature: [describe the API capability]
Prefix: /api/v1
Rules: .cursor/rules/02-architecte-api.mdc, backend-fastapi.mdc
Provide a short design summary first, then implementation. Respond to the user in French. Do not commit unless asked.
```

### UI Builder Prompt

```
You are a senior frontend designer and React/Expo engineer. Build a modern, mobile-first Yunicity interface with clear hierarchy, loading/empty/error/success states, accessibility, and clean components. Prefer simplicity over visual noise.

Screen/feature: [name and user story]
Platform: [Next.js web / Expo mobile / both]
Rules: .cursor/rules/07-constructeur-ui.mdc, 08-ui-ux-pro-max.mdc, frontend-next-expo.mdc
UI copy in French. Do not commit unless asked.
```

### Refactor Prompt

```
You are a codebase architecture expert. Analyze the selected files for spaghetti code, coupling, circular dependencies, oversized modules, duplicated logic, and unclear boundaries. Propose a safe incremental refactor plan, then implement the smallest safe step with tests.

Scope: [files or module]
Rules: .cursor/rules/11-anti-spaghetti.mdc, 01-senior-dev.mdc
Do not change observable behavior. One concern per change. Respond in French. Do not commit unless asked.
```

---

## BMAD Prompts

Méthode : `docs/bmad/BMAD.md` — règle `12-bmad`.

### BUILD

```
Phase BMAD: BUILD. PRD: [PRD-XXX path or summary].

Before coding, confirm gates: PRD validated, architecture, risks, permissions, endpoints, DB model.
Then: minimal plan + impacted files. Build small, modular, testable. No feature creep. No business logic in routes. No secrets. No auth bypass.

Deliver: code, migrations, tests, .env.example updates. Respond in French. Do not commit unless asked.
```

### MEASURE

```
Phase BMAD: MEASURE for feature [PRD-XXX].

Define what to measure: product (adoption, conversion, engagement, retention), technical (latency p95, errors, crashes, DB, queues), security (abuse, auth attempts, rate limits), UX (friction, drop-off).

Propose metrics, tools, thresholds, and a measurement window. Output a checklist table. Respond in French.
```

### ANALYZE

```
Phase BMAD: ANALYZE for feature [PRD-XXX] using measurement results: [paste data or summary].

Answer: Was scope correct? Real user value? Bottlenecks, tech debt, recurring patterns, security signals, UX confusion?

Output: prioritized findings (P0/P1/P2) + recommendations. Respond in French.
```

### DECIDE

```
Phase BMAD: DECIDE for feature [PRD-XXX] after analysis: [paste ANALYZE summary].

Choose next action: scale | refactor | optimize | remove | defer | secure | monitor more.

Apply CTO rule: never scale bad architecture. Document decision, owners, dates. Respond in French.
```

---

## Feature full-stack

```
Contexte : projet Yunicity (monorepo Backend FastAPI + Frontend Next/Expo).
Objectif : [décrire la feature en 1-2 phrases]

Contraintes :
- Phase BMAD BUILD : gates PRD + docs/bmad/BMAD.md avant code
- Respecter .cursor/rules/ ou .claude/rules/ (00-doctrine, 12-bmad, backend, frontend, ui-ux)
- API sous /api/v1, schemas Pydantic, tests pytest
- UI en français, accessible (WCAG AA)
- Ne pas committer

Livrables attendus :
1. Endpoints + schemas + service backend
2. Client API + écrans/composants frontend
3. Tests minimaux
4. Mise à jour .env.example si nouvelles variables
```

---

## Bugfix

```
Bug : [symptôme]
Reproduction : [étapes ou endpoint/écran]
Comportement attendu : [...]

Investigue Backend/ et Frontend/, identifie la cause racine.
Corrige avec le changement minimal. Ajoute un test de régression.
Réponds en français. Ne pas committer.
```

---

## Revue de code / PR

```
Revue la PR / le diff actuel pour Yunicity.

Utilise la checklist dans .cursor/rules/05-code-review.mdc et
docs/ai/security-checklist.md.

Format de réponse :
- Résumé (2-3 phrases)
- Bloquants (sécurité, bugs)
- Suggestions non bloquantes
- Verdict : Approuver / Demander changements / Commenter
```

---

## Sécurité (audit ciblé)

```
Audit sécurité sur [fichiers / module / flux auth].

Vérifier : secrets, authZ, validation entrées, IDOR, CORS, logs PII,
dépendances vulnérables.

Référence : .cursor/rules/04-reviewer-securite-code.mdc et docs/ai/security-checklist.md

Liste findings par sévérité (Critique / Haute / Moyenne / Info) avec
fichier:ligne et correction proposée. Français.
```

---

## UI / écran

```
Crée l’écran [nom] pour Yunicity.

Contexte métier : [citoyen, signalement, carte, etc.]
Plateforme : [web Next / mobile Expo / les deux]

Exigences UX :
- Mobile-first, français, états loading/error/empty
- Composants design system existants (ne pas réinventer Button/Input)
- Accessibilité : labels, focus, contraste

Maquette ou wireframe : [optionnel]
```

---

## Bootstrap initial (repo vide)

```
Le dépôt Yunicity a Backend/ et Frontend/ vides.

Initialise :
1. Backend : FastAPI, pyproject.toml, structure app/, health, pytest, ruff
2. Frontend : Next.js App Router + option Expo dans le même dossier ou workspace

Documente les commandes dev dans README racine et mets à jour .cursor/Cursor.md
si les chemins diffèrent. Ne pas committer sans demande.
```

---

## Refactor ciblé

```
Refactor uniquement [module/fichier] pour [objectif : lisibilité, perf, typage].

Interdit : changer le comportement observable, toucher d’autres modules,
commits automatiques.

Montre le diff conceptuel avant gros changements si > 3 fichiers.
```
