# Passation — VIDEO-REFONTE-L5-MEDIUM-01

## Objectif

Lot 5 : fil vertical medium v1.2. Actions portrait alignées maquette (`ax = vx + vw + 12`). Préserver Safari, partage L2, hint accueil, desktop.

## État Git

| | |
|--|--|
| Worktree | `yunicity-wt-video-lot1` |
| Branche | `feat/video-refonte-l3l4-mobile-v23` |
| HEAD / Preview | **`815c6bdf`** |
| Working tree | **GO livraison** — commit L5 en cours |
| Production / `main` | gelés |

## Documents importants

- Plan : `docs/qa/controle-rendu/l5-medium/PLAN-L5-MEDIUM-FIL-VERTICAL.md`
- Rapport : `docs/qa/controle-rendu/l5-medium/RAPPORT-L5-MEDIUM-LOCAL.md`
- Réf. : `docs/ux/video-refonte/maquette-medium/Lecteur-medium.dc.html` (`ax = vx + vw + 12`)
- Preuves : `captures-avant-apres.json`, `frontieres-live.json`

## Preuves acquises

- Fil medium + `?video=` reorder sans doublon + badge partagé.
- Portrait medium : colonne **side** hors vidéo + nav ▲/▼ en tête (≠ R-PAN).
- Catalogue cartes retiré du palier 640–1023 ; desktop ≥1024 conservé.
- Tests : L5 3/3 · stage portrait 1/1 · mobile-v23 aiguillage OK.
- Captures fixture avant/après 640 / 820 / 1023 / 844×390.
- Live mock : frontières 639/640, 1023/1024 ; `?video=` ; share + comments.

## Erreurs de classement corrigées

- « Actions portrait en overlay = intention L5 » → **écart maquette**, corrigé (stage medium + `surface=side`). Preuve : LIVE-640/820 + test stage.

## Inconnues / réserves

- R-PAN / F4 / C7 : Lot 6.
- RC-M1 geste appareil réel : après Preview.
- Tickets L1 / L1B / L3L4 / P0-02 : **toujours SUSPENDUS (NON clos)**.

## Décisions CTO

- GO BUILD local (15/11).
- **GO commit / Preview** (15/11) — FF contrôlé sans `--force` ; ticket **reste ouvert** jusqu’à recette visuelle CTO.
- Production / `main` hors périmètre.

## Tâches actives

1. ~~Implémenter fil medium~~
2. ~~Aligner actions portrait v1.2~~
3. ~~Tests + captures avant/après + frontières~~
4. ~~Revue CTO / GO livraison~~
5. **Commit + FF Preview + CI/Railway + preuves Preview**
6. Recette visuelle CTO (RC-M1 appareil après)

## Prochaine action

Livraison Preview en cours — commit local puis FF `feat/c3-videos-refonte-final` depuis `815c6bdf`.
