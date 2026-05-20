# Rapport — TICKET-604 Beta readiness (Sprint 6)

**Date :** 2026-05-20  
**Phase BMAD :** MEASURE → QA  
**Références :** `ticket-604-beta-readiness-intent.md`, TICKET-602/603, `beta-readiness-checklist.md`

---

## Synthèse

| Verdict | **GO avec réserves** — prêt pour recette interne et pilote 2–3 testeurs externes |
|---------|-------------------------------------------------------------------------------------|

Yunicity peut être montré à des humains hors équipe sur **Reims seedé**, avec flows critiques documentés et frictions P0 corrigées. Réserves : 5 onglets mobile, contenu quartier encore partiel hors seed `--demo`, testeurs externes non encore exécutés.

---

## Audit flows critiques

| Flow | Statut | Notes |
|------|--------|-------|
| **Auth** | OK | Redirect feed, `humanizeAuthFailure`, retry web/mobile |
| **Feed** | OK | Empty/error copy calme ; badges quartier discrets |
| **Passport** | OK | Tier néo-arrivant à l’activation ; pas de gaming UI |
| **Events** | OK | Ligne territoriale `Quartier · Reims` web + mobile |
| **Neighborhoods** | OK | Liste/détail éditorial ; anti-tribalisation respectée |
| **Notifications** | OK | Deeplinks Sprint 5 ; ton sobre |
| **Partner** | Smoke | Seed partenaire + flash ; parcours complet = recette manuelle |

---

## Problèmes détectés

| ID | Sévérité | Problème | Statut |
|----|----------|----------|--------|
| P0-CI | P0 | Backend CI : ruff E501, mypy unused-ignore, pytest prod settings | Corrigé (commits antérieurs) |
| P1-SEED | P1 | Fiches quartier vides — contenu non lié aux quartiers | Corrigé (seed `--demo` TICKET-604) |
| P1-TEST | P1 | `test_activate_creates_passport` attendait `basic` vs `neo_arrivant` | Corrigé |
| P2-TABS | P2 | 5 onglets mobile — charge cognitive | Accepté pilote Reims |
| P2-EXT | P2 | Pas encore de session testeurs externes | Script prêt |

---

## Corrections appliquées (TICKET-604)

### Seed Reims (`reims_demo_content.py`)
- Liaison **posts** → centre-ville, Boulingrin, Saint-Remi
- **Events** + **orgs** + **offre flash** → `neighborhood_id` + `district` cohérents
- Mise à jour idempotente des enregistrements existants (`neighborhood_id` null)

### Micro-copy & polish
- `NEIGHBORHOODS_LOADING`, `NEIGHBORHOOD_DETAIL_LOADING`
- Erreurs quartiers : ton neutre (plus `text-red-600` agressif web)
- Skeleton liste quartiers web (`animate-pulse`)
- Post démo Saint-Remi : copy alignée basilique

### Tests
- `test_passport_activation` : tier `neo_arrivant` (comportement produit réel)

### Documentation
- `ticket-604-beta-readiness-intent.md`
- `beta-readiness-checklist.md`
- `external-beta-test-script.md`
- Ce rapport

---

## Dette acceptable (beta)

| Dette | Justification |
|-------|---------------|
| 5 tabs mobile | Acceptable MVP Reims ; DECIDE si métriques fatigue |
| Fiches quartier hors demo peu remplies | Contenu réel viendra avec partenaires |
| Pas de cover images quartiers seed | Accent color suffisant recette |
| Perf non profilée | Pas de régression visible ; optimiser après MEASURE terrain |

---

## Risques restants

1. **Sur-badging** si tous les posts futurs sont tagués quartier → garder rattachement optionnel.
2. **Néo-arrivant** : certains testeurs peuvent ne pas comprendre le tier — surveiller en recette externe.
3. **Environnement local** : tests pytest intégration dépendent de `DATABASE_URL` (normal).

---

## Recommandations avant beta humaine

1. Exécuter **`beta-readiness-checklist.md`** en entier (web + Android).
2. Lancer **2–3 testeurs** avec `external-beta-test-script.md` (20 min).
3. Re-seed recette : `python -m app.db.seeds --demo` après deploy.
4. **Sprint 7** : lier plus de contenu partenaire aux quartiers ; revue 5 onglets si fatigue confirmée.

---

## Priorités Sprint suivant

| Priorité | Sujet |
|----------|--------|
| P1 | Retours testeurs externes → micro-copy ciblée |
| P1 | Enrichir contexte quartier (events/posts org) via partenaires |
| P2 | Évaluer fusion onglets mobile (Events + Quartiers ?) |
| P3 | Images cover quartiers éditoriales (CDN) |

---

## Résultats qualité (local, 2026-05-20)

| Gate | Résultat |
|------|----------|
| `ruff` (seed) | OK |
| `pytest` ciblés | 2 passed |
| `pnpm lint` | OK |
| `pnpm typecheck` | OK |
| `pnpm --filter web build` | OK |
| `pnpm --filter mobile build` | OK |

---

## Recommandation commit

**Message suggéré (après validation explicite) :**

```
chore(qa): beta readiness measure and Reims seed territorial links (TICKET-604)
```

**Fichiers touchés :** `docs/qa/*`, `backend/app/db/seeds/reims_demo_content.py`, `backend/tests/test_passport_activation.py`, `frontend/packages/utils`, écrans quartiers web/mobile.

---

*Ne pas commit sans validation explicite (règle ticket).*
