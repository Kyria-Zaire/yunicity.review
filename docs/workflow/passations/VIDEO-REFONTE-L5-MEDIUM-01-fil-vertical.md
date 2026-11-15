# Passation — VIDEO-REFONTE-L5-MEDIUM-01

## Objectif

Lot 5 : fil vertical medium v1.2. Correctif recette visuelle CTO livré sur Preview.

## État Git

| | |
|--|--|
| Worktree | `yunicity-wt-video-lot1` |
| Branche | `feat/video-refonte-l3l4-mobile-v23` |
| HEAD / Preview | **`d077e455`** (correctif `6fdf5fe4` + relevé docs ; FF sans `--force`) |
| Production / `main` | gelés |

## Documents importants

- Relevé : `docs/qa/LIVRAISON-PREVIEW-6fdf5fe4-releve.md`
- Rapport correctif : `docs/qa/controle-rendu/l5-medium/recette-visuelle/RAPPORT-RECETTE-VISUELLE-CORRECTIF.md`
- Preuves : `recette-visuelle/verify-scroll-geometry.json`

## Preuves acquises

- Correctif : son dans cadre ; stage `100dvh−14.5rem` ; portal mb 0 ; scroll fil (scrollbar masquée ≠ preuve).
- clipBasPx = `stage.bottom − innerHeight` ; `>0` KO ; `≤0` OK.
- Trois grandes hauteurs sans débordement ; 844×390 scroll → lecteur + actions.
- VERIFY_OK souris / trackpad / tactile ; vitest medium **22/22**.
- Railway API + web **SUCCESS** sur `6fdf5fe4` ; API health OK ; CSS `14.5rem` servi.
- CI OK sauf audit préexistant (60 GHSA, identique).
- Mention : preuves locales API simulée ; captures CTO indisponibles localement.

## Inconnues / réserves

- Nouvelle recette visuelle CTO (humaine) non faite.
- RC-M1 appareil réel ; Lot 6 ; L1/L1B/L3L4/P0-02 suspendus.

## Décisions CTO

- GO livraison Preview du correctif (15/11).
- Ticket **reste ouvert** jusqu’à nouvelle recette visuelle CTO.
- Production / `main` hors périmètre.

## Tâches actives

1. ~~Correctif + vérifs + tests~~
2. ~~Commit + FF Preview + CI/Railway~~
3. **Nouvelle recette visuelle CTO**
4. Clôture sur validation CTO

## Prochaine action

Recette visuelle CTO sur https://preview.yunicity.city/videos (`6fdf5fe4`) — ticket ouvert.
