# Passation — VIDEO-REFONTE-DESKTOP-VOILE-MOLETTE-01

## Objectif

Correctif local : bande blanche du voile desktop + navigation molette/trackpad. Aucun commit avant revue CTO.

## État Git

| | |
|--|--|
| Base / tip Preview | **`2d0c48c4`** |
| Worktree | `yunicity-wt-video-lot1` |
| Branche locale | `feat/video-refonte-l3l4-mobile-v23` (travail non poussé) |
| Diff | **non commité** |
| Production / `main` | gelés |

## Documents importants

- Ticket : `docs/workflow/tickets/VIDEO-REFONTE-DESKTOP-VOILE-MOLETTE-01.md`
- Rapport : `docs/qa/controle-rendu/voile-molette-01/RAPPORT-DIAGNOSTIC.md`
- Preuves : `docs/qa/controle-rendu/voile-molette-01/preuves.json` + `captures/`
- Diff : `docs/qa/controle-rendu/voile-molette-01/VIDEO-REFONTE-DESKTOP-VOILE-MOLETTE-01-precommit.diff`

## Décisions / validations CTO

- Navigation / fermeture desktop, retour après connexion réelle, Safari iPhone : **validés** sur Preview `2d0c48c4` (consignés, non rouverts).
- L7 / L8 / L9 : restent **ouverts** jusqu’à recette finale.

## Preuves acquises

- Diagnostic : `scrollbar-gutter: stable` + `overflow:hidden` → bande blanche à droite.
- Correctif voile : padding-right = gap (sans cumul) ; voile `100vw`.
- Correctif molette : verrou min 650 ms + silence geste 450 ms (cooldown seul insuffisant).
- vitest : **24/24** ; typecheck OK.
- GO conditionnel : inertie 1 saut ; 3× open/close OK ; Ctrl + panneaux OK ×4 viewports.

## Inconnues

- Confirmation visuelle CTO Preview après livraison.

## Tâches actives

Livraison Preview en cours / faite — L7/L8/L9 restent ouverts.

## Prochaine action

CI/Railway + recette visuelle CTO des deux finitions.
