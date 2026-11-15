# VIDEO-REFONTE-L9-DESKTOP-01 — BUILD local (revue)

## Lot 9 — Desktop C : ouverture directe en échec + finitions C2

| Champ | Valeur |
|-------|--------|
| **Statut** | **OUVERT — LIVRÉ PREVIEW `a30c9346`** ; **NON clos** ; recette CTO Preview restante |
| **Base** | L8 + L7 BUILD local ACCEPTÉS / SUSPENDUS ; tip Preview `3b1586bb` / `e49f4bb4` |
| **PRD** | Story 6 · §6.3 lot 9 · §7 · §9.2 (404 / 500 / D2) |
| **Cadrage** | `docs/qa/controle-rendu/l9-desktop/CADRAGE-L9-DESKTOP-01.md` |
| **Preuves** | `docs/qa/controle-rendu/l9-desktop/` (diff, captures, matrice, réserves) |

## Objectif (GO)

1. **C4** — 404 → indisponible ; aucune autre vidéo lue.  
2. **C7** — erreur → Réessayer ; ≠ C4.  
3. **D2** — `/login?next=…` puis retour lecteur (PRD ; pas d’aperçu public).  
4. **Finitions C2** F1–F10 — matrice ref → modif → preuve.  
5. **R-FOCUS** — fermeture ±1 px, focus restauré, pas de recentrage.

## Hors périmètre

- Commit / push / deploy sans revue  
- Preview L9 seul (groupée 7+8+9)  
- Production / `main`  
- Lot 10 ; modif API  

## Prochaine étape

Revue CTO du package local → commit sur accord → Preview **groupée 7+8+9**.
