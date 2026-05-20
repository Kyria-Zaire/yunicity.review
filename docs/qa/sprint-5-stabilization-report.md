# Rapport — Sprint 5 stabilisation (TICKET-506)

**Phase BMAD :** MEASURE → STABILIZE  
**Date :** 2026-05-19  
**Statut :** livré en branche locale — **commit non effectué** (validation CTO requise)

## Synthèse

Objectif atteint en périmètre sprint qualité : intention UX documentée, audit produit, corrections ciblées UI/UX/micro-copy, seed Reims QA, checklist régression. Aucune nouvelle feature majeure.

## Problèmes détectés (audit)

| Zone | Problème | Sévérité |
|------|----------|----------|
| Feed | Emoji état vide, skeleton `animate-pulse` fatigant | Moyenne |
| Notifications mobile | Deeplink ignoré → toujours le fil | Haute |
| Notifications mobile | Pas d’état erreur / retry | Moyenne |
| Événements mobile | Pas de filtre ville, pas de retry | Moyenne |
| Événements web | `#2A2FFF` en dur, rail « Reims » figé | Basse |
| Passport | Empty offres citoyen générique / tutoiement dispersé | Moyenne |
| Seed dev | RBAC seul — fil vide en QA | Haute |
| Marque | Quelques composants hors tokens Tailwind | Basse |

## Corrections appliquées

### Documentation

- `docs/qa/sprint-5-stabilization-intent.md` (intention UX 10 axes)
- `docs/qa/regression-checklist.md`
- Ce rapport

### Frontend

- `notification-deeplink.ts` : mapping `/feed`, `/passport`, `/events`, `/events/{id}` → routes Expo
- Notifications mobile : deeplink + erreur/retry
- Événements mobile : ville profil, pull-to-refresh, erreur/retry
- Événements web : tokens `yunicity-primary`, rail ville dynamique, bouton réessayer
- Feed : empty sans emoji, loading sans pulse agressif
- Passport web/mobile : `PASSPORT_CITIZEN_OFFERS_EMPTY`, tokens marque, vouvoiement activation web

### Backend

- `reims_demo_content.py` : citoyens, partenaires, orgs vérifiées, posts, événements, offre flash, passport démo
- `python -m app.db.seeds` : inclut désormais `passport_tiers` + `stamp_definitions` ; flag `--demo` pour contenu Reims

**Compte QA (après `--demo`) :** `demo@yunicity.dev` / `DemoReims1!`

## Dette technique acceptable

- Deeplink fil `?post=` non exploité côté mobile (retour fil sans scroll ciblé)
- Tests E2E cross-platform non automatisés dans ce ticket
- Harmonisation tutoiement/vouvoiement globale non exhaustive (hors surfaces corrigées)
- Push web toujours hors scope MVP

## Risques restants

| Risque | Mitigation suggérée |
|--------|---------------------|
| Seed démo en prod par erreur | `python -m app.db.seeds --demo` refuse si `APP_ENV` ∈ {preprod, prod} |
| Volume notifications en conditions réelles | MEASURE post-déploiement, plafonds si besoin |
| Performance fil très chargé | Profilage après beta terrain, pas d’optim prématurée |
| Android safe areas devices exotiques | Test manuel checklist |

## Recommandations beta terrain

1. Exécuter la [checklist de régression](./regression-checklist.md) sur 3 devices (desktop, mobile web, Android).
2. Appliquer migrations + `python -m app.db.seeds --demo` sur recette uniquement.
3. Observer 1 semaine : taux scroll feed, abandons passport, CTR offres flash, opt-out notifications.
4. Collecter verbatim « calme / bruyant » avant nouvelles features.

## Priorités futures (hors 506)

1. Deeplink post précis dans le fil (web + mobile)
2. Harmonisation micro-copy vouvoiement produit
3. Tests E2E Playwright / Maestro smoke
4. MEASURE métriques engagement territorial

## Qualité (session 506)

| Gate | Résultat |
|------|----------|
| `ruff` seeds | OK |
| `mypy` seeds | OK |
| `pnpm lint` | OK |
| `pnpm typecheck` | OK |
| `@yunicity/utils` vitest (33 tests) | OK |
| `pnpm --filter web build` | OK |

À lancer localement avant merge : pytest cibles régression + `pnpm --filter mobile build`.

## Recommandation commit (après validation)

```
chore(qa): sprint 5 integration stabilization (TICKET-506)
```

Fichiers principaux : `docs/qa/*`, `backend/app/db/seeds/*`, `frontend/packages/utils/src/notification-deeplink.ts`, composants feed/events/passport/notifications.
