# Plan ciblé — VIDEO-REFONTE-L5-MEDIUM-01 (Lot 5)

**Statut** : proposition avant modification — **aucun code**.  
**Base** : Preview `815c6bdf`.  
**Acquis à préserver** : Safari SCROLL / P0, partage L2 (H1–H3 + repli accueil).

---

## 1. Références

| Doc | Rôle |
|-----|------|
| PRD Story 4 + §6.3 lot 5 | critères d’acceptation |
| Cadrage §2 lot 5 | écrans F1–F3, M2, M5, S1–S3 |
| Medium v1.2 figé | planche + canevas Shorts |
| RC-M1 | 844 × 390, geste depuis la vidéo |

---

## 2. État actuel (écarts)

| Attendu (v1.2) | État Preview `815c6bdf` (constat code) |
|----------------|----------------------------------------|
| Fil vertical medium 640–1023 | **Écart** : shell medium s’appuie encore sur `VideoDetailScreen` / flux catalogue-style, pas le fil Shorts cadré |
| Rail + hero-header inchangés | **À conserver** tels quels (contrainte explicite) |
| `?video=` = vidéo en premier puis suite du fil | **Partiel** : lien détail existe ; enchaînement fil medium non conforme à la maquette |
| Ensemble vidéo + actions centré | **À mesurer** après BUILD |
| Partage H1–H3 | **OK** sous Provider `VideosScreen` — ne pas casser |

---

## 3. Périmètre BUILD proposé

1. Remplacer la vue medium catalogue par un **fil vertical** (réutiliser le lecteur commun mobile autant que possible, sans casser l’immersif &lt; 640).
2. Garder **hero-header** et **rail** medium dans leur disposition actuelle.
3. Brancher `?video=<id>` : ouvrir cette vidéo en premier, puis la suite du fil courant (onglet / filtres / tri).
4. Navigation : flèches, clavier ↑/↓, molette, glisser ; bornes première / dernière.
5. Tests : présence / centrage ; e2e lien partagé ; non-régression partage + Safari hooks non touchés.
6. Recette RC-M1 (appareil / viewport 844 × 390) après Preview.

**Hors lot 5** : R-PAN feuille/panneau, clavier medium, F4, équivalent C7 → lot 6.

---

## 4. Dépendances & Lot 8

```
Lot 2 (CLOS ✅) ──┐
Lot 4 (sur Preview, ticket NON clos) ──┼── Lot 8 (bloqué aussi par Lot 7)
Lot 7 (non commencé) ─────────────────┘
```

- **Dépendance Lot 8 → Lot 2** : **satisfaite** (L2 CLOS `815c6bdf`).
- Lot 8 reste **bloqué** tant que **Lot 7** (grille desktop) n’est pas fait ; Lot 4 code déjà présent via L3L4.
- **Lot 5** ne débloque pas Lot 8 ; il ouvre la branche medium (puis Lot 6).

**Parallèle possible** (après GO) : Lot 7 desktop grille (dépend Lot 1, déjà sur Preview) en parallèle du Lot 5.

---

## 5. Risques

| Risque | Mesure |
|--------|--------|
| Régression Safari mobile en touchant le lecteur commun | Diff minimal ; ne pas modifier hooks immersive / SCROLL |
| Casser H1–H3 | Provider reste monté une fois dans `videos-screen` |
| Casser hint accueil | Ne pas retirer le dual-path du hook interactions |
| Confusion avec Lot 6 | Panneaux / F4 exclus explicitement |

---

## 6. Décision attendue de Kyria

1. Ouvrir **`VIDEO-REFONTE-L5-MEDIUM-01`** comme seul ticket actif ?  
2. Ou préférer d’abord **Lot 7** (grille desktop) / clôture formelle L3L4·P0-02·L1·L1B ?
