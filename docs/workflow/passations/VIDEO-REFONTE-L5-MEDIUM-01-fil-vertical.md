# Passation — VIDEO-REFONTE-L5-MEDIUM-01

## Objectif

Lot 5 : fil vertical medium v1.2. Conformité portrait / paysage — livraison Preview.

## État Git

| | |
|--|--|
| Worktree | `yunicity-wt-video-lot1` |
| Branche | `feat/video-refonte-l3l4-mobile-v23` |
| Preview tip avant | **`0090dc58`** |
| Working tree | commit portrait/paysage en cours |
| Production / `main` | gelés |

## Documents importants

- Rapport : `docs/qa/controle-rendu/l5-medium/portrait-paysage/RAPPORT-PORTRAIT-PAYSAGE.md`
- Mesures : `portrait-paysage/mesures-portrait-paysage.json`
- Réf. : `Lecteur-medium.dc.html`, `M4-Paysage-820.dc.html`

## Preuves acquises

- Cause : cadre `flex-1` sans ratio média (détection OK).
- Correctif : `fitMediaFrameInBox` ; stages portrait/paysage ; badge dans cadre.
- Tests : web **23/23**, utils **19/19**.
- VERIFY_OK local API simulée (640/820/1023/844×390 + frontières + `?video=`).
- Mentions : preuves locales API simulée ; captures CTO en `REF-0*`.

## Inconnues / réserves

- Recette visuelle CTO humaine après Preview.
- Lot 6 ; L1/L1B/L3L4/P0-02 suspendus.

## Décisions CTO

- GO livraison Preview du correctif portrait/paysage (15/11).
- Ticket **ouvert** jusqu’à recette visuelle CTO.
- Production / `main` hors périmètre.

## Tâches actives

1. ~~Correctif + preuves locales~~
2. **Commit + FF Preview + CI/Railway + preuves Preview**
3. Recette visuelle CTO

## Prochaine action

Commit ciblé → FF `feat/c3-videos-refonte-final` si tip encore `0090dc58` → CI/Railway.
