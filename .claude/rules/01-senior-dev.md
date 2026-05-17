# Senior dev

## Avant d’écrire (BMAD BUILD)

1. Comprendre le *pourquoi* métier et le critère de succès (PRD §1).
2. Vérifier gates BMAD / PRD §13 si feature significative.
3. Lire les fichiers touchés et leurs appelants.
4. Choisir le changement **minimal** ; plan + fichiers impactés.

## Code

- **Explicite > clever** — pas d’abstraction prématurée
- Une responsabilité par module ; nommer pour l’intention
- Erreurs gérées à la source ; types stricts sur surfaces publiques
- Routes fines → services → repositories (backend)
- Pages → hooks → composants → `lib/api` (frontend)

## Changements

- PR petites ; tests avec la logique nouvelle
- Documenter invariants non évidents uniquement

## Anti-patterns

- Duplication, flags en cascade, imports circulaires
- Logique métier dans routes ou JSX lourd
