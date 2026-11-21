# Cadrage — VIDEO-REFONTE-L7-DESKTOP-GRILLE-01

**Statut** : proposition avant BUILD — **aucun code**.  
**Base** : Preview tip `3b1586bb` / code `e49f4bb4`.  
**Hors ticket** : lecteur superposé (Lot 8), C4/C7/D2 (Lot 9), prod/`main`.

---

## 1. Périmètre exact et références

### Inclus (écran **C1** uniquement)

- Grille mixte ≥ 1024 px : vignettes **portrait et paysage à leur format** (pas de carte split sombre).
- Métadonnées vignette : titre, auteur, quartier, durée (cadrage §1.1).
- États grille : loading (squelettes), empty (« Aucune vidéo » + Publier), error (+ Réessayer).
- Pagination « Charger plus » : **une demande à la fois**, dédoublonnage par `id`, erreur **locale** (ne casse pas la grille déjà affichée) — PRD §6.3 lot 7 / D3 partiel (chargement page ; ▼ lecteur = Lot 8).
- Navigation commune inchangée : header 69 px, rail gauche vidéos, en-tête contenu ; Abonnements masqué (Lot 1 déjà en code).
- Vignettes = **images** (`thumbnail_url`), jamais de `<video>` dans la grille.

### Exclus

| Exclu | Lot |
|-------|-----|
| Lecteur modal, flèches, historique D1, R-FOCUS, panneaux | **8** |
| Lien direct 404/5xx/401 | **9** |
| Medium / mobile | — |
| Nettoyage ancien lecteur | **10** |

### Références

| Source | Contenu |
|--------|---------|
| PRD Story 5 | grille + critères (partie grille) |
| PRD §6.3 lot 7 | contenu + preuves |
| Cadrage Desktop C §1.1 / §2 lot 7 | C1 |
| Planche | `planche-desktop-C-cadrage.jpg` |
| Canevas | https://claude.ai/artifact/EqED6AWSR3gtwgwiLvDeoW |
| Décision produit | piste **C** retenue ; A/B écartées |

---

## 2. Écarts code actuel ↔ maquettes

| Attendu C1 | État code (`VideosDesktopFeedStream` + cards) |
|------------|-----------------------------------------------|
| Grille de vignettes mixtes au ratio média | **Écart** : flux vertical de **cartes lecteur** |
| Portrait = vignette haute | **Écart** : `VideosDesktopPortraitCard` en `lg:grid-cols-2` — vidéo gauche + **colonne sombre** (présentation **rejetée**) |
| Paysage = vignette large | **Écart** : `VideosDesktopLandscapeCard` carte éditoriale, pas vignette grille |
| Clic vignette → lecteur superposé | Hors L7 (Lot 8) ; aujourd’hui lien `/videos?video=` / détail |
| États loading/empty/error grille | Partiels via shell éditorial — à aligner sur C1 |
| Pagination sûre | `dedupeById` présent dans `use-local-videos-feed` ; garde concurrente / erreur locale à **vérifier et renforcer** |

Shell à conserver : `VideosDesktopLeftRail`, `VideosDesktopRightRail`, `videos-responsive-shell` (seuil desktop).

---

## 3. Composants réutilisables et fichiers concernés

### Réutiliser

| Élément | Usage L7 |
|---------|----------|
| `resolveLocalVideoLayout` / dims | orientation vignette |
| `formatLocalVideoDuration` | badge durée |
| `use-local-videos-feed` (+ garde) | items, loadMore |
| Labels / a11y vidéo existants | focus, libellés FR |
| `VideosDesktopLeftRail` / RightRail | chrome inchangé |
| Helpers auteur / quartier / titre teaser | méta vignette |

### Toucher (prévision BUILD)

| Fichier | Rôle |
|---------|------|
| `components/videos/desktop/videos-desktop-feed-stream.tsx` | bascule vers grille C1 |
| `desktop/videos-desktop-portrait-card.tsx` | retirer / remplacer usage desktop split (ou nouveau composant vignette) |
| `desktop/videos-desktop-landscape-card.tsx` | idem |
| **Nouveau** `videos-desktop-grid.tsx` (+ `videos-desktop-grid-tile.tsx`) | grille + vignette |
| `videos-editorial-stream-region.tsx` | brancher grille desktop |
| CSS / tokens desktop vidéos | densités, gaps |
| `hooks/use-local-videos-feed.ts` | garde loadMore + erreur locale |
| Tests `vitest` + e2e grille | portrait + paysage + pagination |

Ne pas modifier le lecteur immersif medium/mobile ni les hooks Safari.

---

## 4. Dépendances et plan d’implémentation

```
Lot 1 (code Preview, ticket SUSPENDU) ──► Lot 7 (ce ticket)
                                              │
Lot 2 CLOS, Lot 4 code ───────────────────────┼──► Lot 8 (hors scope)
                                              └──► Lot 9
```

**Ordre BUILD proposé** (après GO) :

1. Contrat vignette C1 (props, a11y, ratio) + tests.
2. Grille CSS (colonnes / gap) calée sur planche ; états loading/empty/error.
3. Remplacer le stream desktop ; conserver rails.
4. Pagination : garde + dédup + erreur locale + bouton « Charger plus ».
5. Contrôles de rendu locaux (fixture) ; e2e grille.
6. **Pas de deploy Preview L7 seul** (PRD : lots 7–9 livrés ensemble).

---

## 5. Critères de recette et dimensions

| # | Critère | Dimensions / notes |
|---|---------|-------------------|
| R1 | Grille visible ≥ 1024 ; pas de split sombre | 1024, 1280, **1440×900** (réf. géométrie) |
| R2 | Vignette portrait plus haute que large | ratio média réel |
| R3 | Vignette paysage plus large que haute | idem |
| R4 | Titre, auteur, quartier, durée présents et lisibles | contraste texte |
| R5 | Loading / empty / error conformes | messages FR |
| R6 | « Charger plus » : 1 requête, pas de doublons `id` | 2+ pages |
| R7 | Erreur pagination locale : grille intacte + Réessayer | 500 simulé |
| R8 | Mobile ≤639 et medium 640–1023 **inchangés** | non-régression L5/L3 |
| R9 | Partage / Safari / hint accueil non régressés | smoke |

**Mesures à figer à la revue** (sur planche / canevas) : largeur colonne contenu, gap grille, largeur max vignette, hauteur min tuile, position badge durée.

---

## 6. Décision attendue

1. Valider ce cadrage tel quel ?
2. Ajuster densités / méta vignette avant GO ?
3. GO BUILD local (sans Preview) ou attendre autre priorité ?
