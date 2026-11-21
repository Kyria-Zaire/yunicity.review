# Passation — VIDEO-REFONTE-DESKTOP-VOILE-MOLETTE-01

## Objectif

Correctif desktop : bande blanche du voile + navigation molette/trackpad.

## Statut

✅ **CLOS** le 2026-11-16 — recette finale CTO confirmée sur Preview **`cb028a72`**.
Aucune recette restante sur ce ticket. Ne pas relancer les recettes validées.

## État Git

| | |
|--|--|
| SHA Preview (livraison + clôture) | **`cb028a72`** (FF `2d0c48c4..cb028a72`, sans force) |
| Worktree | `yunicity-wt-video-lot1` |
| Branche locale | `feat/video-refonte-l3l4-mobile-v23` |
| Branche Preview | `feat/c3-videos-refonte-final` |
| Production / `main` | gelés |

## Documents importants

- Ticket : `docs/workflow/tickets/VIDEO-REFONTE-DESKTOP-VOILE-MOLETTE-01.md`
- Rapport : `docs/qa/controle-rendu/voile-molette-01/RAPPORT-DIAGNOSTIC.md`
- Preuves : `docs/qa/controle-rendu/voile-molette-01/preuves.json` + `captures/`
- Diff : `docs/qa/controle-rendu/voile-molette-01/VIDEO-REFONTE-DESKTOP-VOILE-MOLETTE-01-precommit.diff`

## Décisions / validations CTO

### Conservées sur Preview `2d0c48c4` (ne pas réattribuer à `cb028a72`)

- Navigation / fermeture du lecteur desktop
- Retour après connexion **réelle**
- Contrôle Safari iPhone

### Clôture sur Preview `cb028a72`

- Recette finale voile bord à bord + molette : **confirmée par Kyria** (2026-11-16)
- L7 / L8 / L9 : **CLOS** en même temps (voir leurs passations)

## Preuves acquises

- Diagnostic : `scrollbar-gutter: stable` + `overflow:hidden` → bande blanche à droite
- Correctif voile : padding-right = gap (sans cumul) ; voile `100vw`
- Correctif molette : verrou min 650 ms + silence geste 450 ms
- vitest : **24/24** ; typecheck OK
- GO conditionnel local : inertie 1 saut ; 3× open/close OK ; Ctrl + panneaux OK ×4 viewports
- CI : Frontend/Backend/Docker/Lint ✅ ; Safety ❌ audit préexistant
- Railway API `43115bf3` + web `f8b78ecc` SUCCESS sur **`cb028a72`**
- Runtime : health API 200, `/videos` 200, feed sans session 401

## Inconnues

Aucune sur ce ticket (clos).

## Tâches actives

Aucune — ticket **clos**.

## Prochaine action

Aucune sur ce ticket. Chantier suivant : **réconciliation documentaire** (pas de ticket produit ouvert).
