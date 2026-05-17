# Workflow officiel Yunicity

Doc complète : **`docs/workflow/YUNICITY-OFFICIAL-WORKFLOW.md`**

## Flow

`Idea → PRD → Architecture → BUILD → Tests → Security Review → MEASURE → ANALYZE → DECIDE → Merge → dev → recette → preprod → prod`

## Phases PRD

DISCOVER → DESIGN → BUILD → VERIFY → RELEASE

## BMAD (sous-cycle)

BUILD → MEASURE → ANALYZE → DECIDE — détail `docs/bmad/BMAD.md`

## Feature refusée si

Pas sécurité · pas tests critiques · permissions floues · spaghetti · migration/UX dangereuse.

## Zones rouges (IA + humain)

Auth · permissions · webhooks · paiements · uploads · admin · géoloc · PII · migrations DB · prod

→ review sécurité + tests + rollback. Pas de modif prod sans validation.

## Git

`main` · `develop` · `feature/*` · `fix/*` · `hotfix/*` — PR obligatoire.

## Doctrine CTO

Sécurité > intégrité données > architecture > UX > scalabilité > vitesse.

Feature fragile = dette. Feature propre = actif.
