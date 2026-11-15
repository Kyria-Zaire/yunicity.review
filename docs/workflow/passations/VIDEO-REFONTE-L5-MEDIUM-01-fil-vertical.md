# Passation — VIDEO-REFONTE-L5-MEDIUM-01

## Objectif

Lot 5 : fil vertical medium v1.2. Conformité portrait / paysage livrée Preview.

## État Git

| | |
|--|--|
| Worktree | `yunicity-wt-video-lot1` |
| Branche | `feat/video-refonte-l3l4-mobile-v23` |
| HEAD / Preview | **`e49f4bb4`** (FF `0090dc58..e49f4bb4`, sans `--force`) |
| Production / `main` | gelés |

## Documents importants

- Relevé : `docs/qa/LIVRAISON-PREVIEW-e49f4bb4-releve.md`
- Rapport : `docs/qa/controle-rendu/l5-medium/portrait-paysage/RAPPORT-PORTRAIT-PAYSAGE.md`
- Preuves Preview : `portrait-paysage/preview-e49f4bb4-preuves.json`

## Preuves acquises

- Correctif cadre ratio média livré `e49f4bb4`.
- CI : Frontend/Backend/Lint ✅ ; audit préexistant **45 uniques / 60 occurrences** (identique baseline `6fdf5fe4`, 0 delta IDs).
- Railway API + web SUCCESS ; health OK ; `/videos` 200.
- Preview : JS marqueurs présents ; feed réel 401 sans login ; composition vérifiée sur JS servi + API simulée (PREVIEW_VERIFY_OK).
- Ticket **ouvert** — recette visuelle CTO.

## Inconnues / réserves

- Médias Preview DB : login requis.
- Lot 6 ; L1/L1B/L3L4/P0-02 suspendus.

## Décisions CTO

- GO livraison portrait/paysage (15/11).
- Pas de clôture avant recette visuelle CTO.
- Production / `main` hors périmètre.

## Tâches actives

1. ~~Commit + FF + CI/Railway~~
2. **Recette visuelle CTO**
3. Clôture sur validation

## Prochaine action

Recette visuelle CTO sur https://preview.yunicity.city/videos (`e49f4bb4`).
