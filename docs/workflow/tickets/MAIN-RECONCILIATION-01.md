# MAIN-RECONCILIATION-01 — Réconcilier `main` avec la ligne déployée sur la Preview

> **Statut : dette ouverte le 2026-11-26, non traitée.** Ouverte sur décision CTO (B1 de
> `PASSPORT-PRESENCE-01`). Aucune action sur `main` dans le cadre de ce ticket sans décision
> explicite.

## 1. Constat (2026-11-26, lecture seule)

| Référence | SHA | Remarque |
|---|---|---|
| `main` | `3e0b27ba` (2026-08-29) | branche par défaut du dépôt |
| `feat/c3-videos-refonte-final` | `ea1edf11` (2026-11-22) | **246 commits d'avance** sur `main`, 0 de retard ; déployée sur la Preview `dazzling-wisdom` (enregistrement de déploiement GitHub du 2026-11-22) |

`CONTRIBUTING.md` décrit `main` comme « code prêt pour production » et `feature/*` →
`develop` → `main`. L'état réel s'en écarte : la Preview suit une branche de fonctionnalité
et `main` ne reflète plus le code déployé.

## 2. Risques

- Une branche créée depuis `main` régresserait silencieusement 246 commits (correctifs de
  sécurité Passport du 2026-11-05 inclus).
- La documentation de flux (`CONTRIBUTING.md`, workflow officiel) ne décrit plus la
  pratique réelle.

## 3. À décider (Architecture Authority)

1. Stratégie : avance rapide de `main` sur la ligne Preview, ou merge commit de
   réconciliation, après vérification CI.
2. Branche d'intégration de référence à documenter pour les tickets suivants.
3. Production : vérifier séparément ce qui y est déployé (hors de ce ticket).

## 4. Hors périmètre

Toute réécriture d'historique ; toute action en production.
