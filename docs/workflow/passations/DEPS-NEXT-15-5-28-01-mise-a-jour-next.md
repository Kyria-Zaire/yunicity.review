# Passation — DEPS-NEXT-15-5-28-01 · Mise à jour corrective de Next.js 15.5.28

> **Ouvert le 2026-11-04 par Kyria.** ⛔ **Zone rouge** : dépendance du serveur
> web de production. **Index** : [`../TICKETS-INDEX.md`](../TICKETS-INDEX.md).
> Ticket précédent : `FEED-NEW-UX-01`, livré au stade Preview.

## 1. Objectif

Corriger la faille critique de Next.js signalée par l'audit des dépendances,
par une **montée de correctif**, sans toucher aux fonctionnalités livrées.

## 2. Avis officiels — vérifiés le 2026-11-04

| Avis | Sévérité | Versions affectées | Corrigé | Conditions | Nous concerne ? |
|---|---|---|---|---|---|
| **GHSA-2464-fhr4-w9xw** (CVE-2026-96889) | **critique**, CVSS 9.5 | `next` 10.0.0 – 15.5.27 ; 16.0.0 – 16.4.0 | **15.5.28** / 16.4.1 | RCE via une faille mémoire de **`sharp`** (optimisation d'images), sur **Linux glibc** ; contournement : `sharp ≥ 0.35.5` | **oui** — optimiseur actif (`next/image`, images distantes) |
| **GHSA-p3m5-59mp-jv5r** | haute, CVSS 8.2 | `next` 13.0.0 – 15.5.27 ; 16.0.0 – 16.4.0 | **15.5.28** / 16.4.1 | App Router **avec au moins une Server Action** | **non** — 0 `"use server"` |

## 3. Exposition mesurée

| Ligne | `next` | `sharp` | Verdict |
|---|---|---|---|
| `main` (`3e0b27ba`) | 15.5.22 | **0.35.3** (figé par `pnpm.overrides`) | **exposé** |
| Preview `feat/c3-videos-refonte-final` (`1b2dd7f3`) | 15.5.25 | 0.35.5 | contournement déjà atteint ; audit rouge sur la version de `next` |

Service web : Railpack (image Debian par défaut) → **glibc probable, non vérifié
dans les journaux de build**.

### Nuances — ce que l'exposition N'ÉTABLIT PAS

- **Exploitabilité non démontrée chez nous** : l'avis décrit une faille
  mémoire « pouvant mener à une RCE », sans publier le vecteur. Nous n'avons
  ni reproduit, ni observé d'exploitation ; « exposé » signifie **dans la plage
  vulnérable, avec les conditions déclarées vraisemblablement réunies**.
- **Condition glibc non vérifiée** : si l'image servie était musl (Alpine),
  l'avis ne s'appliquerait pas tel quel.
- **Surface réelle** : l'optimiseur traite les images locales et les hôtes
  distants autorisés (`remotePatterns`) ; l'influence d'un attaquant sur ces
  sources n'a pas été évaluée.
- **Quel environnement sert `main` ?** non établi dans cette session : `main`
  n'est exposé **en ligne** que si un service est déployé depuis `main`.
- **Preview** : `sharp 0.35.5` = contournement officiel **déjà en place** ; la
  montée y ferme l'alerte d'audit et aligne `next`, elle ne ferme pas une
  exposition ouverte.

⚠️ **Piège relevé** : sur `main`, monter `next` **seul** ne corrigeait rien —
la surcharge `sharp: 0.35.3` aurait maintenu la version vulnérable.

## 4. Réalisé — **commits locaux, NON poussés**

| Worktree | Branche | Base | Commit | Changement |
|---|---|---|---|---|
| `../yunicity-wt-deps-next` | `fix/deps-next-15-5-28` | `origin/main` `3e0b27ba` | **`08b25edf`** | `next` → **15.5.28** (web, admin) · surcharge `sharp` → **0.35.5** |
| `../yunicity-wt-deps-next-preview` | `integration/preview-deps-next-15-5-28` | `origin/feat/c3-videos-refonte-final` `1b2dd7f3` | **`983a592c`** | `next` → **15.5.28** (web, admin) — `sharp` déjà 0.35.5 |

**Décisions de mise en œuvre** :
- **version exacte `15.5.28`** — `^15.5.28` re-résolvait **15.5.29** (publiée le
  03/11, correctifs *modérés* supplémentaires, un jour de recul), hors de la
  version corrective confirmée ;
- `pnpm update` **rejeté** : il remontait **84 paquets** sans rapport ;
- lockfiles **minimaux** : `main` → `next`, `sharp`, `semver` (dépendance de
  l'ancien `sharp`) ; Preview → `next` et un doublon `caniuse-lite`.

## 5. Preuves — poste Windows de Kyria, worktrees non poussés

| Contrôle | `main` + correctif | Preview + correctif |
|---|---|---|
| `pnpm install --frozen-lockfile` | ✅ | ✅ |
| typecheck `web` / `admin` | ✅ / ✅ | ✅ / ✅ |
| lint `web` | ✅ 0 erreur (29 avert. préexistants) | ✅ 0 erreur (38 avert. préexistants) |
| tests `web` (vitest, sérialisé) | ✅ 39 fichiers, **395** tests | ✅ 111 fichiers, **1167** tests |
| build `web` / `admin` | ✅ « Next.js 15.5.28 » | ✅ « Next.js 15.5.28 » |
| `sharp` chargé par `next` à l'exécution | **0.35.5** (libvips 8.18.7) | **0.35.5** |

⛔ **Non fait avant poussée** : CI GitHub, déploiement, recette Preview,
`pnpm audit`/OSV local (l'audit CI sera relu après poussée).

**Décision de Kyria (2026-11-04)** : version **exacte 15.5.28** conservée pour
ce lot ; poussée autorisée — PR vers `main` **sans fusion**, puis intégration
Preview en avance rapide, références explicites, sans `--force`.

## 6. Ce qui reste

1. **Décision de Kyria** : pousser `fix/deps-next-15-5-28` (PR vers `main`) et
   `integration/preview-deps-next-15-5-28` → `feat/c3-videos-refonte-final`
   (avance rapide d'**un** commit).
2. Après poussée : relire l'audit CI — attendu : **les deux avis `next`
   disparaissent** ; restent les alertes de la chaîne mobile (Expo :
   `node-forge`, `decode-uri-component`) et des outils de test (`undici`,
   `vite`) → **ticket de tri à ouvrir**.
3. Recette Preview courte : pages à images (`next/image`).
4. **À arbitrer** : `next` 15.5.29 (correctifs modérés, dont un contournement du
   rejet SVG dans l'optimisation d'images).
5. La branche `fix/mobile-publishing-p0` porte **2 commits documentaires
   locaux** (`f03a242c`, `c8a8f8db`) ; après poussée de l'intégration, elle
   devra être rebasée sur la Preview avant d'être poussée.

## 7. Retour arrière — nuancé

- **Mécanique** : revenir au commit parent (`3e0b27ba` sur `main`, `1b2dd7f3`
  sur la Preview) par un **commit de revert**, jamais par réécriture
  d'historique ; ou, sur Railway, **réactiver le déploiement précédent**
  (immédiat, sans build). Aucune migration, aucune donnée touchée.
- ⚠️ **Revenir en arrière RÉINTRODUIT la faille** : sur `main`, `sharp` repasse
  en 0.35.3 (exposé). Sur la Preview, le contournement `sharp 0.35.5` reste en
  place — le retour arrière n'y rouvre que l'alerte d'audit.
- **Préférer un correctif en avant** si un défaut est lié à la montée : rester
  sur 15.5.28 et corriger, plutôt que revenir sur une version vulnérable.
- **Critère de retour arrière** : régression fonctionnelle **bloquante** sur la
  Preview, non contournable, et seulement sur décision de Kyria.
