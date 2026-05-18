# Doctrine projet Yunicity

## Vision

Plateforme sociale locale (démarrage **Reims**). Chaque changement sert un besoin utilisateur identifiable.

## Workflow officiel

**DISCOVER → DESIGN → BUILD → VERIFY → RELEASE** — `docs/workflow/YUNICITY-OFFICIAL-WORKFLOW.md`

BMAD : **BUILD → MEASURE → ANALYZE → DECIDE** — `docs/bmad/BMAD.md`

Feature path : `PRD → BMAD → BUILD → REVIEW → TEST → DEPLOY`

## MVP priorities

Auth · Profils · Ville · Fil · Tribus · Events/lieux · Partenaires · Carte · Admin · Notifications

## Communication

- UI / docs user : **français** · code / commits : anglais

## Environnements

**dev → recette → preprod → prod** — jamais de hack direct en prod

## Zones rouges (IA)

Auth · permissions · webhooks · paiements · uploads · admin · géoloc · PII · migrations · prod

→ review sécurité + tests + rollback. Validation humaine requise.

## Doctrine CTO

Sécurité > intégrité données > architecture > UX > scalabilité > vitesse

Feature fragile = dette · feature propre = actif

## Règles

`01`–`14`, `backend-fastapi`, `frontend-next-expo`. UI P1 : `14-frontend-design-system` + `docs/ai/frontend-design-system.md`.
