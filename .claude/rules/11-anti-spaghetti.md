---
paths:
  - "backend/**/*"
  - "frontend/**/*"
---

# Anti-spaghetti

## Signaux d’alerte

- Fichier > 300 lignes sans raison métier claire.
- Fonction > 40 lignes ou > 3 niveaux d’indentation.
- Import circulaire ou `from app import *`.
- Même logique copiée 2+ fois sans extraction.
- `utils.py` fourre-tout qui grossit chaque sprint.

## Règles de dépendance

```
Frontend  →  API HTTP uniquement  →  Backend layers
```

- Pas d’import backend dans frontend ni inverse.
- Dans le backend : `routers → services → models` — jamais l’inverse.
- Dans le frontend : `screens → hooks → api` — pas de logique métier lourde dans JSX.

## Refactor autorisé (quand demandé)

1. Extraire service/hook sans changer le comportement observable.
2. Tests de caractérisation avant déplacement si zone risquée.
3. Un refactor par PR — pas mélangé à une feature.

## Nommage & fichiers

- Un concept = un fichier (ex. `report_service.py`, `useReport.ts`).
- Éviter les préfixes vagues : `manager`, `handler`, `helper` sans domaine.

## Dette

- Si raccourci temporaire : commentaire court + lien ticket.
- Pas de `TODO` sans owner ni sans contexte actionnable.

Posture générale : `01-senior-dev.md`.

# Anti-Spaghetti Rules

## Stop Conditions
Stop and propose refactor if:
- a file exceeds ~300 lines without strong reason
- a function exceeds ~50 lines
- a module mixes HTTP, DB, validation, and business rules
- a component has too many responsibilities
- duplicated logic appears 3 times
- circular imports appear
- tests become hard to write because of coupling

## Required Refactor Pattern
When refactoring:
1. Preserve behavior.
2. Add characterization test if needed.
3. Extract pure logic first.
4. Move side effects behind interfaces.
5. Keep commits small.

## Architecture Direction
Dependencies should flow inward:
- API routes depend on services
- services depend on repositories/interfaces
- repositories depend on database
- domain rules should not depend on FastAPI or UI