# Cadrage — VIDEO-REFONTE-L8-DESKTOP-LECTEUR-01

**Statut** : cadrage **validé** → BUILD local livré (voir `RAPPORT-L8-DESKTOP-LECTEUR.md`).  
**Base** : BUILD L7 local accepté (non poussé) + tip Preview `3b1586bb` / `e49f4bb4`.  
**Hors ticket** : C4 / C7 / D2 (Lot 9) · Preview L8 seul · prod/`main`.  
**Livraison Preview** : groupée **7+8+9** (PRD Q3).

---

## 1. Références exactes

| Source | Contenu Lot 8 |
|--------|----------------|
| PRD Story 5 | Lecteur superposé, D1, D3, D4, D5, R-FOCUS |
| PRD §5.3–§5.5 | URL / historique ; R-ORD ; R-VIDE ; D4 ; R-FOCUS |
| PRD §6.3 lot 8 | C2, C3, C5, C6 ; dépend 2, 4, 7 |
| PRD §9.1–§9.3 | Tests unitaires R-ORD/R-VIDE/R-FOCUS ; e2e §9.2 ; **RC-D1** |
| Cadrage Desktop C §1.2–§1.4 + §2 lot 8 | Comportement + preuves |
| Planche | `maquette-desktop/captures-pistes/planche-desktop-C-cadrage.jpg` |
| Captures écran | `C2-Lecteur-portrait.jpg`, `C3-Lecteur-paysage.jpg`, `C5-Focus-restaure.jpg`, `C6-Chargement.jpg` |
| Sources canevas | `C2-Lecteur-portrait.dc.html`, `C3-…`, `C5-…`, `C6-…` |
| Canevas | https://claude.ai/artifact/EqED6AWSR3gtwgwiLvDeoW |
| L7 (réf. avant L8) | diff + `captures-app/` + rapports L7 — **à conserver** |

---

## 2. Écrans, compositions, états (périmètre L8)

| Écran | Attendu (réf.) |
|-------|----------------|
| **C2** | Lecteur superposé **portrait** : vidéo entière hauteur d’écran (planche / piste C : « à la hauteur de l’écran »), panneau commentaires blanc, actions, voile sur la grille |
| **C3** | Lecteur superposé **paysage** : image entière (décision §17.2 : **800 × 600** cité pour C3), légende dessous |
| **C5** | Fermeture → grille : scroll mémorisé, focus vignette (R-FOCUS) |
| **C6** | Ouverture directe hors grille en attente API : « Chargement de la vidéo… » (`aria-busy`) ; ✕ / Échap actifs |

**États lecture (cadrage §1.3)** : démarrage son coupé ; pause à la fermeture ; panneaux → pause / reprise conditionnelle (Lot 4).  
**Hors L8** : C4 (404), C7 (erreur chargement), D2 (sans session) → **Lot 9**.

---

## 3. Ouverture depuis la grille L7 via `?video=`

| Action | Contrat |
|--------|---------|
| Clic / Entrée vignette L7 | URL `/videos?video=<id>` ; historique **ajoute** une entrée (D1) |
| Effet | Superposition ouverte ; mémoriser vignette d’origine + `scrollY` grille |
| Lien partagé / ouverture directe | Grille dessous + superposition immédiate ; si absente de la grille → **C6** puis C2/C3 si 200 |

**Écart actuel** : `videos-screen.tsx` bascule desktop sur `VideoDetailScreen` (page détail), **pas** une superposition sur la grille L7.

---

## 4. Retour grille et précédent / suivant navigateur

| Action | Historique | Effet |
|--------|------------|-------|
| ✕ / Échap / voile (D4) / « Voir les autres vidéos » — depuis grille | **retour** historique | `/videos` + R-FOCUS (C5) |
| Idem — ouverture **directe** | **remplace** l’entrée | `/videos` ; pas de sortie hors app |
| **Retour** navigateur | `popstate` | même fermeture + R-FOCUS |
| **Avance** navigateur | `popstate` | rouvre sur **dernière vidéo consultée** (conséquence du `replace` aux flèches) |
| ▲ / ▼, ↑ / ↓ | **remplace** l’entrée `?video=` | ordre = séquence R-ORD (pas le recalcul live de la grille) |

Invariant PRD : **le lecteur ne pousse jamais plus d’une entrée**.

---

## 5. Contrôles / interactions à réutiliser

| Élément | Source |
|---------|--------|
| Voile 60 %, bande méta, barre / fil progression, actions | Lecteur commun mobile / medium (Lots 3–5) |
| Pause / reprise conditionnelle | hook panneaux Lot 4 |
| Feuilles / panneaux Description & Commentaires, menu « … » | Lot 4 (code Preview ; ticket encore SUSPENDU) |
| Son coupé au démarrage | existant |
| Flèches + bornes (▲ désactivé en tête ; ▼ charge page / R-VIDE) | à construire (hooks indicatifs PRD §6.2) |
| Grille L7 + `loadMore` / `loadMoreError` | ne pas casser ; ▼ lecteur s’appuie sur la même pagination sûre |

---

## 6. Partage H1 / H2 / H3

- Lot 2 **CLOS** (`815c6bdf`) : `shareLocalVideoWithFallback` + UI H1/H2/H3.
- Cadrage §1.3 : partage natif direct **avec les mêmes états** dans la superposition.
- L8 : brancher le bouton Partager du lecteur desktop sur le même chemin — **ne pas** réinventer les branches.

---

## 7. Dépendances et frontière Lot 9

```
Lot 2 CLOS ──┐
Lot 4 (code Preview, ticket SUSPENDU) ──┼── Lot 8 (ce ticket)
Lot 7 BUILD local ACCEPTÉ ─────────────┘
                                              │
                                    Lot 9 ← C4, C7, D2 (401)
```

| Dans L8 | Hors L8 → Lot 9 |
|---------|-----------------|
| C2, C3, C5, C6 | C4 404 `LOCAL_VIDEO_NOT_FOUND` |
| D1, D3, D4, D5, R-ORD, R-VIDE, R-FOCUS | C7 erreur réseau / 5xx |
| 200 hors grille → C2/C3 | D2 sans session → login + retour |

---

## 8. Écarts code actuel · fichiers · plan

### Écarts

| Attendu L8 | État actuel |
|------------|-------------|
| Overlay modal sur grille | `VideoDetailScreen` page pleine (desktop `isDetailMode`) |
| D1 push/replace/popstate | Navigation détail classique ; pas de contrat overlay |
| R-ORD / R-VIDE | Absent (related autoplay dans détail ≠ R-ORD) |
| R-FOCUS + scroll | Absent |
| D4 voile | Absent |
| C6 loading direct | Partiel via loading détail ; pas le contrat overlay |
| Une seule `<video>` active, libération au change | À vérifier / imposer |

### Fichiers concernés (prévision BUILD)

| Zone | Fichiers |
|------|----------|
| Shell / route | `videos-screen.tsx` — desktop `?video=` → overlay, plus page détail |
| Nouveau | `desktop/videos-desktop-overlay-player.tsx` (nom indicatif) |
| Hooks | `useVideoOverlayHistory`, `useOrderedVideoNavigation`, `useGridRestore` (noms PRD) |
| Réemploi | slides / action rail / description / comments / share feedback |
| L7 | `videos-desktop-grid-tile` (ouverture) ; feed `loadMore` |
| Tests | vitest R-ORD/R-VIDE/R-FOCUS ; e2e §9.2 |
| **Ne pas toucher** | fil medium L5, immersif mobile, correctifs Safari |

### Plan ciblé (après GO)

1. Hooks historique + séquence R-ORD + restore (tests d’abord).  
2. Overlay C2/C3 + a11y (dialog, inert, focus trap, Échap par couche).  
3. Brancher ouverture grille L7 + deep link + C6.  
4. Flèches / R-VIDE / D3 ; partage H1–H3.  
5. Fermeture D4 + R-FOCUS (C5) ; e2e §9.2.  
6. **Pas de push Preview** tant que Lot 9 non prêt (livraison groupée).

---

## 9. Critères de recette · dimensions

| # | Dim / appareil | Critère |
|---|----------------|---------|
| R1 | **1440×900**, **1280×800** (réfs géométrie desktop) | C2/C3 : vidéo entière, voile, actions, pas de split sombre |
| R2 | idem | Ouverture vignette → `?video=` + overlay ; grille visible dessous (inerte) |
| R3 | clavier | ↑/↓ / ▲▼ ; Entrée ouvre ; Échap ferme couche haute puis overlay |
| R4 | Chrome + Safari desktop | **RC-D1** : parcours e2e §9.2 joués à la main |
| R5 | — | Retour / Avance navigateur conformes D1 |
| R6 | — | Fermeture → `scrollY` ±1 px + `activeElement` = vignette attendue |
| R7 | — | R-ORD / R-VIDE (messages et bornes PRD §5.4) |
| R8 | 1023 / medium | **Aucune régression** fil L5 |
| R9 | mobile / Safari | **Préservés** |

---

## 10. Références manquantes ou contradictoires *(sans inventer)*

| Point | Constat |
|-------|---------|
| **Naming « lot 8 » dans la fiche décision** | Certains passages (pause mobile, recettes R6) disent « lot 8 » au sens **historique** des correctifs Preview — **≠** Lot 8 du plan PRD (desktop overlay). Le **PRD §6.3** fait foi pour ce ticket. |
| **Piste A vs C** | §17 recommandait A ; **piste C retenue** ensuite (cadrage + planche C). Ne pas réintroduire A/B. |
| **C3 « 800 × 600 »** | Cité dans décision §17.2 (piste C) ; à **vérifier** sur capture `C3-Lecteur-paysage.jpg` / canevas au BUILD — pas de cotation supplémentaire inventée ici. |
| **Hauteur exacte C2 « hauteur d’écran »** | Formulation planche/décision ; **pas** de px figés hors captures. Mesurer sur `C2-Lecteur-portrait.jpg` avant code. |
| **Axe a11y** | PRD : « C1, C2, C4 (lot 8, 9) » — C1 déjà L7 ; C4 = Lot 9. L8 vise C2 (+ C3). |
| **Lot 4 ticket** | Dépendance code **satisfaite** sur Preview ; ticket **toujours SUSPENDU (NON clos)** — ne pas le clore ici. |
| **C6 dans Lot 8 vs erreurs** | C6 (loading) ∈ L8 ; échec 404/5xx ∈ L9. Frontière claire. |
| **Autoplay fin de vidéo** | `VideoDetailScreen` enchaîne `relatedVideos` — **hors** contrat D5 (« aucun basculement automatique »). À retirer pour l’overlay L8. |

---

## 11. Décision attendue

1. Valider ce cadrage L8 ?  
2. GO BUILD local (sans Preview) ou ajustements ?  
3. Confirmer conservation du diff/preuves L7 comme baseline avant code L8.
