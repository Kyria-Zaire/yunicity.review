# Passation — VIDEO-REFONTE-L8-DESKTOP-LECTEUR-01

## Objectif

Lot 8 : lecteur desktop superposé — BUILD local **ACCEPTÉ / SUSPENDU** ; recette Preview groupée restante ; **NON clos**.

## État Git

| | |
|--|--|
| Worktree code | `yunicity-wt-video-lot1` — diffs L7 + L8 **non commités** (conservés) |
| Tip Preview | `3b1586bb` / code `e49f4bb4` |
| Commit / push / deploy | **interdits** jusqu’à demande |
| Production / `main` | gelés |

## Documents importants

- Rapport : `docs/qa/controle-rendu/l8-desktop/RAPPORT-L8-DESKTOP-LECTEUR.md`
- Diff : `…/VIDEO-REFONTE-L8-DESKTOP-LECTEUR-01-precommit.diff`
- Preuves : `preuves-app.json`, `preuves-a11y-link-gestures.json`, `captures-app/`
- Finitions C2 → L9 : cadrage `l9-desktop/CADRAGE-L9-DESKTOP-01.md` §3 (F1–F10)
- Baseline L7 : `docs/qa/controle-rendu/l7-desktop/`

## Preuves acquises

- Vitest : **18/18**
- Sonde overlay : **20/20**, R-FOCUS Δ 0 (max-scroll), panneau 380×828, 1024 OK
- Finalisation : Entrée + R-FOCUS Δ 0 ; Ctrl/Cmd nouvel onglet sans overlay ici ; milieu sans preventDefault ; tap tactile OK (`preuves-a11y-link-gestures.json`)
- Effet de bord noté (non bloquant) : mousedown+modificateur marque encore sessionStorage — pas de régression d’ouverture

## Erreurs de classement corrigées

- Δ11 = focus-scroll avant mark (pas shrink `scrollHeight`)
- Structure C2 = L8 ; typo/espacements = L9 (pas « panneau manquant »)

## Inconnues / réserves

- Finitions C2 F1–F10 (L9)
- Safari desktop / RC-D1 ; Preview non jouée
- Hint « Voir les vidéos du fil » timing

## Décisions CTO

- BUILD local ACCEPTÉ (15/11) après R-FOCUS + structure C2 + finalisation gestes
- Suspendre L8 ; ouvrir L9 cadrage ; Preview **7+8+9**

## Tâches actives

1. Conserver diff / preuves jusqu’à Preview groupée  
2. Aucun commit tant que non demandé  
3. Ticket actif basculé vers L9

## Prochaine action

Cadrage / BUILD L9 (ticket actif). L8 en attente recette Preview groupée — **NON clos**.
