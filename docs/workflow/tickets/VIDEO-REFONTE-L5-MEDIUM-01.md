# VIDEO-REFONTE-L5-MEDIUM-01 — CLOS

## Lot 5 — Medium : fil vertical (v1.2)

| Champ | Valeur |
|-------|--------|
| **Statut** | ✅ **CLOS** après validation CTO (compositions portrait/paysage, 15/11) |
| **SHA code** | **`e49f4bb4`** |
| **Tip Preview (docs)** | **`3b1586bb`** |
| **Branche** | `feat/video-refonte-l3l4-mobile-v23` → Preview `feat/c3-videos-refonte-final` |
| **Passation** | `docs/workflow/passations/VIDEO-REFONTE-L5-MEDIUM-01-fil-vertical.md` |
| **PRD** | Story 4 · plan §6.3 lot 5 |
| **Cadrage** | `CADRAGE-DESKTOP-C-ET-PLAN-IMPLEMENTATION.md` lot 5 |
| **Maquette** | medium v1.2 figée |

## Objectif (conservé)

Remplacer le catalogue medium (640 → 1023 px) par le **fil vertical** Shorts-like :
rail + hero-header **inchangés** ; `/videos?video=` ouvre la vidéo en premier puis la suite.

## Dépendances (état à la clôture)

| Dépendance | État |
|------------|------|
| Lot 2 | **CLOS** (`815c6bdf`) |
| Lot 3 / L3L4 | Code sur Preview ; ticket **encore SUSPENDU (NON clos)** |
| Lot 4 | Non requis pour le lot 5 |
| Lots 7–9 / VOILE | **CLOS** depuis 2026-11-16 (tip `cb028a72`) — hors ce ticket |

## Critères (rappel PRD Story 4 + cadrage)

- Fil remplace le catalogue ; centrage vidéo + actions
- Navigation flèches / ↑↓ / molette / glisser ; 844 × 390 (RC-M1)
- Lien partagé `?video=` en tête du fil
- Préserve : Safari immersif, H1–H3 `/videos`, hint accueil

## Livraison Preview (historique conservé)

- SHA initial : **`95674af1`**
- SHA correctif chrome : **`6fdf5fe4`**
- SHA portrait/paysage (clôture) : **`e49f4bb4`** — relevé `docs/qa/LIVRAISON-PREVIEW-e49f4bb4-releve.md`
- Preuves : `docs/qa/controle-rendu/l5-medium/portrait-paysage/`
- CI tip `3b1586bb` : Frontend/Backend/Lint/Docker ✅ ; audit 45/60 (= baseline)

## Hors périmètre / réserves

- Panneaux R-PAN / F4 / C7 medium → **lot 6** (non ouvert)
- Production / `main`
- P0-02 / L3L4 / L1 / L1B **toujours SUSPENDUS (NON clos)**

## Prochaine action

Aucune sur ce ticket (clos). Voir index.
