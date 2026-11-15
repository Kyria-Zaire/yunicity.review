# Passation — VIDEO-REFONTE-L789-CORRECTION-C1C2C3-01

## Objectif

Correction C1/C2/C3 livrée Preview — L7/L8/L9 **NON CLOS** jusqu’à recette CTO réelle.

## État Git

| | |
|--|--|
| SHA Preview | **`2c6f9b30`** (FF `b7107736..2c6f9b30`, sans force) |
| Worktree | `yunicity-wt-video-lot1` |
| Production / `main` | gelés |

## Documents importants

- `docs/qa/controle-rendu/l789-correction/` (rapport, bandes, preuves, captures)
- Relevé : `docs/qa/LIVRAISON-PREVIEW-L789-CORRECTION-releve.md`

## Preuves acquises

- Pré-commit local : C1 ordres ×4 largeurs ; C2/C3@1024 ; R-FOCUS Δ0 ; typecheck ; vitest
- CI : Frontend/Backend/Docker/Lint ✅ ; audit 45/60 constant
- Railway API `b974f8d9` + web `cf5aef63` SUCCESS sur `2c6f9b30`
- Runtime Preview : health 200, `/videos` 200, marqueurs grid/overlay/meta-band

## Inconnues

- Recette CTO Preview réelle (credentials, Safari)

## Prochaine action

Recette humaine Preview ; tickets L7/L8/L9 restent ouverts.
