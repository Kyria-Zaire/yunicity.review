# VIDEO-REFONTE-DESKTOP-VOILE-MOLETTE-01 — OUVERT

## Lecteur desktop : bande blanche du voile + navigation molette

| Champ | Valeur |
|-------|--------|
| **Statut** | **OUVERT** — correctif local ; **aucun commit/push/deploy** avant revue |
| **Base** | Preview **`2d0c48c4`** |
| **Passation** | `docs/workflow/passations/VIDEO-REFONTE-DESKTOP-VOILE-MOLETTE-01.md` |
| **Preuves** | `docs/qa/controle-rendu/voile-molette-01/` |

## Validation CTO déjà acquise (à conserver)

Sur Preview `2d0c48c4` / recette humaine :

- navigation et fermeture du lecteur desktop ;
- retour après connexion **réelle** (auth non simulée) ;
- contrôle Safari iPhone.

Ces points restent **validés**. Ce ticket ne les rouvre pas.

## Périmètre

1. **Voile** — supprimer la bande blanche à droite ; couverture bord à bord ; fond verrouillé ; pas de décalage à l’ouverture/fermeture ; R-FOCUS ±1 px.
2. **Molette** — bas = suivante, haut = précédente ; même ordre/limites/URL replace que ▲▼ ; seuil + anti-inertie ; pas de détournement des panneaux défilants ; pas Ctrl+molette ; grille fermée / medium / mobile / Safari hors effet.

## Hors périmètre

Production / `main` · L7/L8/L9 restent ouverts jusqu’à recette finale CTO · commit/push/deploy avant revue.
