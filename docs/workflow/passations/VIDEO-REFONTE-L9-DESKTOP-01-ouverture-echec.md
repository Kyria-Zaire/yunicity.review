# Passation — VIDEO-REFONTE-L9-DESKTOP-01

## Objectif

Lot 9 finitions avant revue groupée 7+8+9 — **BUILD local à jour** (F1=32, D2 login simulé).
Aucun commit / push / deploy.

## État Git

| | |
|--|--|
| Worktree | `yunicity-wt-video-lot1` — diffs L7+L8+L9 non commités |
| Tip Preview | `3b1586bb` / code `e49f4bb4` (inchangé) |
| Commit / push / deploy | **interdits** |
| Production / `main` | gelés |

## Documents importants

- Bilan 7+8+9 : `docs/qa/controle-rendu/l9-desktop/BILAN-CONSOLIDE-7-8-9.md`
- Matrice F1–F10 : `…/MATRICE-F1-F10.md`
- Réserves : `…/RESERVES-LIVRAISON-7-8-9.md`
- D2 §3-2 : `…/JUSTIFICATION-D2-HIERARCHIE-3-2.md`
- Diff : `…/L9-BUILD-precommit.diff`
- Preuves : `preuves-app.json`, `preuves-l789-regression.json`, `captures-app/`

## Preuves acquises

Next `:3002` + API simulée.

| Cas | Résultat |
|-----|----------|
| F1 `panelTop=32` (Δ 0), 380×836, composer 44 | OK |
| C4 / C7 / retry / no-loop (1 hit) | OK |
| D2 login simulé → `p1` + reload overlay | OK — réserve credentials réels |
| R-FOCUS ±1, focus vignette | OK |
| Régression L7+L8+L9 | OK |
| L7 et L8 sondes rejouées | OK |
| Medium 820 / mobile 390 | 0 overlay desktop |

## Erreurs de classement corrigées

- F1 « réserve 48 px » **levée** par alignement `pt-8` + `items-start` (preuve `panelTop=32`).

## Inconnues

- Credentials réels / Preview / Safari : hors BUILD local.

## Décisions CTO

- GO finitions L9 (15/11) appliqué ; pas de GO commit.

## Tâches actives

1. Revue CTO bilan 7+8+9  
2. Aucun commit tant que non demandé  

## Prochaine action

Revue humaine du package consolidé ; commit seulement sur GO explicite.
