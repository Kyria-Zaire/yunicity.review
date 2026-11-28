# Bilan consolidé BUILD local — Lots 7 + 8 + 9

**Date** : 15/11/2026  
**Worktree** : `yunicity-wt-video-lot1`  
**Env** : Next `http://127.0.0.1:3002` + **API simulée** Playwright  
**Commit / push / deploy** : **non** — revue avant  
**Production / `main`** : hors périmètre  

## Résultats sondes

| Sonde | Fichier preuves | Résultat |
|-------|-----------------|----------|
| L7 grille | `l7-desktop/` (rejouée) | **OK** — grille, pagination, frontières 1023/1024 |
| L8 lecteur | `l8-desktop/` (rejouée) | **OK** — 20/20 (nav, historique, R-FOCUS ±1, 1024, medium/mobile) |
| L9 C4/C7/D2/C2 | `l9-desktop/preuves-app.json` | **OK** — 11/11 |
| Régression 7+8+9 | `l9-desktop/preuves-l789-regression.json` | **OK** — 6/6 |

## Correctifs intégration revalidés

| Sujet | Preuve |
|-------|--------|
| Sticky origin à la fermeture | L8 nav-history + L9 C4 close direct → replace `/videos` |
| Boucle `getLocalVideo` | L9 C4 : 1 hit, stable après 1 s ; régression `hits1=hits2=1` |
| F1 top 32 px | `panelTop=32`, composer 44, panneau 380×836 |
| D2 login simulé → vidéo + reload | `next=/videos?video=p1` ; overlay après login et reload |
| Partage / commentaires | Régression L789 : panneau + share UI ; L8 panel 380×836 |
| Medium / mobile | 0 overlay desktop à 820 et 390 |

## Diff final

`docs/qa/controle-rendu/l9-desktop/L9-BUILD-precommit.diff` (L7+L8+L9 inclus dans le worktree).

## Captures app (échantillon)

- L9 : `captures-app/APP-C2-f1-top32-apres-1440.png`, `APP-D2-retour-lecteur-1440.png`, `APP-D2-reload-lecteur-1440.png`, C4/C7  
- L789 : `APP-L789-grille-1440.png`, `APP-L789-comments-1440.png`, C4/C7  
- L7 / L8 : dossiers `l7-desktop/captures-app/`, `l8-desktop/captures-app/`

## Tests unitaires (session précédente, code inchangé sur classify/REC-01)

- `desktop-overlay-direct-error` + overlay L9 + `auth-return-path` REC-01 vidéo : verts  

## Réserves restantes

Voir `RESERVES-LIVRAISON-7-8-9.md` — notamment **credentials réels non joués**, Preview, Safari.

## Prochaine action

Revue CTO groupée 7+8+9 → GO commit local éventuel → Preview groupée sur demande.
