# Passation — MOBILE-PAGE-BG-01 · Fond de page mobile derrière l'espace inférieur

> ✅ **CLOS le 2026-11-05 au stade Preview sur `586dd249`** (décision de
> Kyria) — recette Safari iPhone du **profil** validée (§5 ter). Limites
> conservées : §5 (mesures desktop / medium après correctif seulement), §6.
> Non fusionné dans `main`.
>
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

## 5 bis. 🚀 PREVIEW — *2026-11-05*

- Commit **`586dd249`** (3 fichiers de ce ticket) ; Preview
  `feat/c3-videos-refonte-final` avancée **`a39b9171..586dd249`** en avance
  rapide (inclut `1d089b37`, docs de clôture de `BOTTOM-NAV-RESERVE-01`),
  distante vérifiée avant poussée, **sans `--force`** ; branche
  `fix/mobile-page-bg` poussée. `main` = `3e0b27ba`, **inchangé**.
- **CI — PR #202 sur `586dd249`** : lint · typecheck · build ✅, ruff · mypy ·
  pytest ✅, compose · health · pytest ✅, lint-agent-rules ✅, Gitleaks ✅,
  chemins interdits ✅ ; **audit des dépendances ❌ — 19 High/Critical,
  INCHANGÉ** (réserve préexistante).
- **Railway Preview** : web `bbbc0f1a` et API `a6468c07` **SUCCESS**, tous deux
  `meta.commitHash = 586dd249`.
- **Servi** : `buildId` `bm9yXQjAfGRaeUZIBWy9s` ; feuille
  `e029c5badf5ff974.css` — **même empreinte que le build QA local mesuré** —
  contient la règle sous `@media (max-width:639.98px)` (`#f4f5f7`,
  `#fafafa`) et la réserve de `BOTTOM-NAV-RESERVE-01`.
- Section **non commitée** (un commit relancerait un déploiement Preview).

## 5 ter. 📱 RECETTE SAFARI IPHONE — *Kyria, 2026-11-05, Preview `586dd249`*

**Profil** : fond **continu**, contenu **accessible**, espace inférieur
**conservé** — ✅ validé.

⚠️ **Non recettés sur iPhone** : liste des tribus, réglages, notifications,
liste des quartiers, détail d'événement, détail de tribu — couverts
**uniquement** par la mesure QA locale (Chrome, 390 px, zone de sécurité
émulée) du §5. Une validation sur le profil ne vaut pas pour ces vues.

## 6. Inconnues

- Safari iPhone réel : **profil validé** (§5 ter) ; les six autres vues non recettées sur appareil.
- Autres écrans à vue grise **sans** réserve de barre (hors des 16 shells) :
  non relevés.

## 7. Prochaine action

✅ Ticket clos par Kyria. Aucun ticket actif désigné ; à choisir dans l'index
(`TRIBE-CREATE-BLOCKING-STATUS-01` en attente). Si une bande réapparaît sur
une des six vues non recettées sur iPhone, rouvrir avec capture et appareil.
