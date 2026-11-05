# Passation — MOBILE-PAGE-BG-01 · Fond de page mobile derrière l'espace inférieur

> **Ouvert le 2026-11-05 par Kyria**, seul ticket actif. Préproduction uniquement.
> ⛔ Aucun changement sur `main` ni sur la production. Desktop et medium non
> modifiés. ⏸ `TRIBE-CREATE-BLOCKING-STATUS-01` reste **en attente**.

## 1. Objectif

Supprimer la bande d'une autre couleur visible au-dessus de la barre basse
mobile **sans supprimer l'espace** de fin de contenu et **sans imposer une
couleur unique**. Origine établie par `BOTTOM-NAV-RESERVE-01` §9 ter :
espacement de la grille (2rem) sur le fond blanc imposé par `.web-shell-page`,
qui l'emporte sur le `bg-[#F4F5F7]` déclaré par les shells.

## 2. État Git

Worktree `C:/Users/kyria/yunicity-wt-deps-next-preview`, branche
**`fix/mobile-page-bg`** depuis **`a39b9171`** (Preview servie) :
`1d089b37` (docs : clôture de `BOTTOM-NAV-RESERVE-01`). Correctif **non
commité, non poussé, non déployé** — présentation à Kyria avant livraison.

## 3. Fond attendu — relevé (QA locale, 390 px, couleur peinte à x = 2 px, 160 px au-dessus de la barre)

| Vue au-dessus de l'espace | Écrans | Avant |
|---|---|---|
| gris `#F4F5F7` | quartiers (liste), notifications, réglages, liste des tribus, profil, détail d'événement | **bande blanche 31–32 px** |
| `neutral-50` `#FAFAFA` | détail de tribu | **bande blanche 32 px** |
| blanc | fil, discussions, sortir, détail de quartier, passport, lieux | continu, aucune bande |
| propre | `/videos` (noir), `/feed/new` (`#F7F8FA`) | continu |
| sans barre | formulaires (barre d'action blanche) | non concerné |

## 4. Correctif

`app/globals.css`, bloc `MOBILE-PAGE-BG-01` en fin de fichier, **sous
`@media (max-width: 639.98px)`** : le fond de page reprend le fond de la vue,
**seulement si cette vue est rendue** (`:has(...)` sur son marqueur) —
`#f4f5f7` pour les six vues grises, `theme("colors.neutral.50")` pour le
détail de tribu. Les vues blanches gardent le blanc. Espace non modifié.

Test `lib/layout/mobile-page-background.test.ts` (8) : bloc sous le média
mobile ; pour chaque règle, la vue déclare bien le même fond (garde-fou si une
vue change de couleur).

## 5. Preuves — QA locale, build `T8y6BP3zXA93yUIv_aBDA`

- **CSS de production** : règle présente sous `@media (max-width:639.98px)`
  (`#f4f5f7`, `#fafafa`).
- **390 px** : les 7 écrans concernés sont **d'une seule couleur sur 160 px**
  au-dessus de la barre (= couleur de leur vue) ; les autres **inchangés**.
- **800 et 1280 px** : fond de page **blanc** partout (`.web-shell-page`),
  `/feed/new` et le fil desktop gardent leur surface propre.
- **Espace conservé** : écart contenu → barre **identique à `a39b9171` sur
  les 20 écrans** mesurés (zone de sécurité 34 px).
- Captures : `scratchpad/pbg/avant/`, `scratchpad/pbg/apres/` (bas de page),
  `scratchpad/pbg/apres/planche-haut.png` (haut des 7 pages : pas de rupture).
- Contrôles : `tsc` vert ; `eslint` du test vert ; `vitest lib/layout`
  **24 fichiers / 238 tests verts**.
- ⚠️ **Limite d'instrument** : les mesures 800 / 1280 px n'ont été prises
  **qu'après** correctif (build de référence remplacé) ; l'absence d'effet
  repose sur le **média mobile seul** de la règle et sur le fond blanc relevé.
  Une mesure « avant 800 px » prise par erreur sur le nouveau build a été
  **supprimée**.
- Captures avant / après prises avec **deux comptes QA différents** (contenu
  différent, même structure).

## 6. Inconnues

- Safari iPhone réel non vérifié pour ce ticket.
- Autres écrans à vue grise **sans** réserve de barre (hors des 16 shells) :
  non relevés.

## 7. Prochaine action

Présentation à Kyria ; sur décision : commit sur `fix/mobile-page-bg`,
intégration en avance rapide sur `feat/c3-videos-refonte-final`, CI, SHA
servi, recette Safari iPhone.
