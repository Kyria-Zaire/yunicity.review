# BMAD (Yunicity)

Sous-cycle : **BUILD → MEASURE → ANALYZE → DECIDE**.

- Détail : `docs/bmad/BMAD.md`
- Flow complet : `docs/workflow/YUNICITY-OFFICIAL-WORKFLOW.md`

## BUILD — avant tout code

Gates : PRD §13 — validé, architecture, risques, permissions, endpoints, modèle DB.

Anti-spaghetti : si symptômes → **STOP BUILD → REFACTOR FIRST**

## MEASURE / ANALYZE / DECIDE

Post-deploy recette/preprod/prod. **Ne jamais scaler une mauvaise architecture.**

## Agent

Identifier phase (DISCOVER…RELEASE + BMAD). Pas de commit sans demande.
