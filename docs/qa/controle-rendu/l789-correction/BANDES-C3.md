# Bandes C3 — intrinsèque vs cadre

## Référence

`C3-Lecteur-paysage.dc.html` : cadre **800×600** (ratio **4:3 ≈ 1,333**), `object-fit: contain`.

## Mesure pré-commit (fixture API simulée)

| | Valeur | Source |
|--|--------|--------|
| Média déclaré | **1280×720** (16:9 ≈ 1,778) | `media_width` / `media_height` fixture |
| Décodé navigateur | 0×0 dans cette passe | WebM distant non décodé à temps — dims **déclarées** utilisées |
| Cadre stage | **800×600** (1,333) | mesuré DOM ; conforme C3 |
| `object-fit` | `contain` | CSS lecteur |
| Zone image dans cadre | 800×450 | contain 16:9 dans 4:3 |
| Bandes | **75 px** haut + bas **dans le cadre** | calcul contain — **pas** dans le fichier |

## Conclusion

Les bandes visibles sont un **letterbox du lecteur** (cadre C3 4:3 + contain), pas des bandes du média. Aligné sur la maquette C3 (`object-fit: contain` dans 800×600).
