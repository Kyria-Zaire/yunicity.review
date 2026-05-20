# TICKET-604 — Mesure & beta readiness (Sprint 6)

**Phase BMAD :** MEASURE → QA → préparation beta humaine  
**Contexte :** TICKET-602 (catalogue quartiers) + TICKET-603 (UI territoriale) mergés ; stack citoyenne stable (fil, Passport, événements, flash, notifications, seed Reims).

## 1. Objectifs recette

- Valider que Yunicity peut être **montré à des humains hors équipe** sans honte produit ni erreurs runtime visibles.
- Documenter les **flows critiques** et leurs états (succès, vide, erreur, retry).
- Corriger les **frictions P0/P1** par micro-copy, polish minimal et enrichissement seed — **sans nouvelle feature**.
- Produire une **checklist go/no-go beta** et un **rapport mesurable** pour DECIDE Sprint 7.

## 2. Critères beta ready

| Domaine | Critère |
|---------|---------|
| Auth | Inscription / connexion / logout fiables web + mobile ; messages en français citoyen |
| Fil | Vivant avec seed Reims, pas saturé ; badges quartier discrets |
| Passport | Mémoire locale humaine, pas dashboard gaming |
| Quartiers | Ambiance éditoriale, pas mini-réseau social |
| Notifications | Méritées, deeplinks corrects |
| Technique | CI verte (ruff, mypy, pytest ; lint, typecheck, build web/mobile) |
| Contenu | Seed crédible Reims (quartiers, posts, events, offres liés) |

## 3. Cohérence émotionnelle

Une seule personnalité : **calme, territorial, éditorial**. Blanc + `#2A2FFF`. Pas de hype, trending, FOMO, violet legacy.

## 4. Fatigue cognitive

Limiter : 5 onglets mobile (surveiller), badges multiples, notifications en rafale, sections passport denses, listes quartiers type grille casino.

## 5. Flows critiques (audit obligatoire)

1. Auth (register, login, logout, redirect feed, erreurs, retry)
2. Feed (rythme, densité, likes, commentaires, badges quartier, empty/skeleton)
3. Passport (niveaux, tampons, offres, QR, hiérarchie)
4. Events (liste, détail, intérêt, ligne territoriale, → quartier)
5. Neighborhoods (liste, détail, feed/event → quartier, anti-tribalisation)
6. Partner (offre, flash, modération, scan — smoke)
7. Notifications (volume, ton, deeplink, non-lu)

## 6. Perception qualité

Chaque écran : **où suis-je**, **que puis-je faire**, **que se passe-t-il ensuite** — en ≤ 3 secondes. Chargements avec feedback sobre ; pas de texte API brut.

## 7. Cohérence quartiers / ville

- Fil **ville-first** inchangé ; quartier = méta contextuelle.
- Copy ancrée « Reims » ; quartier précise le coin.
- Fiche quartier : sections finies, pas de feed infini quartier.

## 8. Risques UX

| Risque | Mitigation ticket |
|--------|-------------------|
| Fiches quartier vides | Seed lie posts/events/orgs aux quartiers |
| Badge quartier trop présent | Rattachement seed partiel, pas 100 % posts |
| Tier néo-arrivant incompris | Labels passport déjà éditoriaux ; doc recette |
| 5 tabs mobile | Checklist beta + observation testeurs |

## 9. Anti-patterns (refus)

- Grosse feature, redesign complet, realtime, nouveaux concepts sociaux
- Trending territorial, leaderboard quartier, groupes quartier
- Copy startup / gaming / manipulateur
- Optimisation prématurée (cache complexe, refonte perf)

## 10. Stratégie recette terrain

1. **Interne** : checklist `beta-readiness-checklist.md` sur web desktop, web responsive, Expo Android.
2. **Seed** : `python -m app.db.seeds` + `--demo` ; compte `demo@yunicity.dev`.
3. **Externe** (2–3 testeurs) : script `external-beta-test-script.md` — 20 min, observation confusion / hésitation.
4. **Rapport** : `ticket-604-beta-readiness-report.md` → go / no-go / go avec réserves.

---

**Livrables :** intention (ce doc) → audit → corrections ciblées → checklist beta → rapport final. Pas de commit sans validation explicite.
