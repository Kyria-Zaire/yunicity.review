# VIDEO-REFONTE-L5-MEDIUM-01 — PROPOSÉ (non ouvert)

## Lot 5 — Medium : fil vertical (v1.2)

| Champ | Valeur |
|-------|--------|
| **Statut** | **PROPOSÉ** — aucun GO BUILD ; aucun code |
| **Base Preview** | **`815c6bdf`** (acquis Safari / partage / accueil à préserver) |
| **PRD** | Story 4 · plan §6.3 lot 5 |
| **Cadrage** | `CADRAGE-DESKTOP-C-ET-PLAN-IMPLEMENTATION.md` lot 5 |
| **Maquette** | medium v1.2 figée — planche `maquette-medium/captures-v1.1/planche-medium-v1.2.jpg` |
| **Canevas** | <https://claude.ai/artifact/GfUQTV2g4TA33gQdV9ELue> |

## Objectif

Remplacer le catalogue medium (640 → 1023 px) par le **fil vertical** Shorts-like :
rail + hero-header **inchangés** ; `/videos?video=` ouvre la vidéo en premier puis la suite.

## Dépendances

| Dépendance | État |
|------------|------|
| Lot 3 (mobile lecteur / fil) | Code sur Preview via L3L4 → `815c6bdf` ; ticket L3L4 **encore SUSPENDU (NON clos)** |
| Lot 2 | **CLOS** — non requis pour le lot 5 |
| Lot 4 | Non requis pour le lot 5 (requis pour lot 6) |

## Hors périmètre (ce ticket)

- Panneaux R-PAN / F4 / C7 medium → **lot 6**
- Grille / lecteur desktop → **lots 7–9**
- Production / `main`

## Critères (rappel PRD Story 4 + cadrage)

- Fil remplace le catalogue ; centrage vidéo + actions
- Navigation flèches / ↑↓ / molette / glisser ; 844 × 390 (RC-M1)
- Lien partagé `?video=` en tête du fil
- Préserve : Safari immersif, H1–H3 `/videos`, hint accueil

## Prochaine étape

Validation CTO du plan → ouverture formelle du ticket (seul actif) → BUILD.

## Livraison Preview (15/11)

- SHA initial : **`95674af1`** — relevé [`LIVRAISON-PREVIEW-95674af1-releve.md`](../../qa/LIVRAISON-PREVIEW-95674af1-releve.md)
- Recette visuelle CTO : **non validée** → correctif layout (son dans cadre, stage `100dvh−14.5rem`, portal mb 0, scroll vérifié).
- SHA correctif chrome : **`6fdf5fe4`** — relevé [`LIVRAISON-PREVIEW-6fdf5fe4-releve.md`](../../qa/LIVRAISON-PREVIEW-6fdf5fe4-releve.md)
- Recette portrait/paysage : **non validée** → correctif cadre ratio média (`fitMediaFrameInBox`, stages portrait/paysage).
- Preuves : [`portrait-paysage/RAPPORT-PORTRAIT-PAYSAGE.md`](../../qa/controle-rendu/l5-medium/portrait-paysage/RAPPORT-PORTRAIT-PAYSAGE.md) — API simulée + REF CTO.
- Statut : **NON clos** — ticket ouvert jusqu’à nouvelle recette visuelle CTO.
