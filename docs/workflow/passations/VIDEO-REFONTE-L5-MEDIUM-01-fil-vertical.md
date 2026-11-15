# Passation — VIDEO-REFONTE-L5-MEDIUM-01

## Objectif

Lot 5 : fil vertical medium v1.2. Correctif recette visuelle CTO (espaces, stage, son, scroll) puis livraison Preview.

## État Git

| | |
|--|--|
| Worktree | `yunicity-wt-video-lot1` |
| Branche | `feat/video-refonte-l3l4-mobile-v23` |
| Preview tip avant correctif | **`95674af1`** |
| Working tree | correctif layout **prêt commit** (scripts probe exclus) |
| Production / `main` | gelés |

## Documents importants

- Rapport correctif : `docs/qa/controle-rendu/l5-medium/recette-visuelle/RAPPORT-RECETTE-VISUELLE-CORRECTIF.md`
- Preuves scroll/géométrie : `recette-visuelle/verify-scroll-geometry.json`
- Mesures : `recette-visuelle/mesures-apres.json`
- Réf. : `Lecteur-medium.dc.html`

## Preuves acquises

- Livraison Preview antérieure `95674af1`.
- Recette visuelle CTO **non validée** — causes établies (toolbar son, double margin portal, 70dvh).
- Correctif local (API simulée) : gap tri→stage **20 px** ; réserve **14.5rem (232 px) ≥ stageTop 230 px**.
- **clipBasPx** = `stage.bottom − innerHeight` ; `>0` = débordement KO ; `≤0` = OK.
- Trois grandes hauteurs : **clipBas ≤ 0** (pas de débordement) — 640×900 (−2), 820×1180 (−230), 1023×768 (−2).
- 844×390 : clipBas +80 attendu ; scroll page → lecteur entier + mute/share/comments + nav haut.
- Scroll réel : souris / trackpad / tactile / flèches — **VERIFY_OK** (scrollbar masquée ≠ preuve).
- Vitest medium concernés : **22/22**.
- Mention : preuves locales API simulée ; captures CTO indisponibles localement.

## Inconnues / réserves

- Session Preview réelle (login) non rejouée avant déploiement du correctif.
- RC-M1 appareil réel ; Lot 6 ; L1/L1B/L3L4/P0-02 suspendus.
- Ticket **ouvert** jusqu’à nouvelle recette visuelle CTO.

## Décisions CTO

- Recette visuelle non validée → correctif local.
- GO livraison Preview du correctif si contrôles OK (15/11) — FF sans `--force` ; ticket reste ouvert.
- Production / `main` hors périmètre.

## Tâches actives

1. ~~Diagnostiquer + corriger local~~
2. ~~Vérifs scroll + géométrie + tests~~
3. **Commit ciblé + FF Preview + CI/Railway**
4. Nouvelle recette visuelle CTO

## Prochaine action

Commit (hors scripts temporaires) → vérifier distante encore `95674af1` → FF `feat/c3-videos-refonte-final` → attendre CI/Railway → confirmer SHA servis.
