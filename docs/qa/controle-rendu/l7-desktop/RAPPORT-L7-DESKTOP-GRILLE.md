# Rapport BUILD — VIDEO-REFONTE-L7-DESKTOP-GRILLE-01

**Statut** : BUILD local prêt pour revue CTO — **aucun commit / push / deploy**.  
**Base** : tip Preview `3b1586bb` / code `e49f4bb4`.  
**Hors scope** : lecteur Lot 8 · C4/C7 Lot 9 · Preview L7 seul · prod/`main`.

---

## 1. Diff ciblé

Fichier : [`VIDEO-REFONTE-L7-DESKTOP-GRILLE-01-precommit.diff`](VIDEO-REFONTE-L7-DESKTOP-GRILLE-01-precommit.diff)

| Zone | Fichiers |
|------|----------|
| Nouveau | `videos-desktop-grid.tsx`, `videos-desktop-grid-tile.tsx` |
| Remplacé | `videos-desktop-feed-stream.tsx` → grille C1 (plus de split sombre) |
| États / shell | `videos-editorial-stream-region.tsx`, `videos-responsive-shell.tsx`, `videos-discovery-screen.tsx`, `videos-screen.tsx` |
| Pagination | `use-local-videos-feed.ts` — `loadMoreError`, items conservés, garde concurrente |
| CSS | `globals.css` — `.videos-desktop-grid` (2 col @1024, 3 @1280+) |
| Tests | `video-desktop-l7-grid.test.tsx`, `use-local-videos-feed-l7.test.tsx` |

Anciennes cartes `VideosDesktopPortraitCard` / `LandscapeCard` : **non importées** (nettoyage Lot 10). Honesty tests les utilisent encore isolément.

---

## 2. Comportement

- Vignettes = **images** (`thumbnail_url`), ratio média, durée en pastille bas-droite.
- Méta : titre, `auteur · quartier`.
- Ouverture : lien `/videos?video=<id>` (détail existant) — **pas** de lecteur modal provisoire.
- États : loading (squelettes), vide (+ Publier), erreur (+ Réessayer).
- « Charger plus » : lock ; dédup `id` ; échec → `loadMoreError` local, grille intacte.

---

## 3. Tests

```
vitest: video-desktop-l7-grid + use-local-videos-feed-l7 + video-medium-l5 + videos-responsive-shell-r4
→ 17/17 passed
```

---

## 4. Captures (données **SIMULÉES**)

| Fichier | Dim | Nature |
|---------|-----|--------|
| `captures/REF-planche-desktop-C-cadrage.jpg` | planche | Référence maquette |
| `captures/APRES-grille-1024x900.png` | 1024×900 | Fixture HTML simulée |
| `captures/APRES-grille-1280x800.png` | 1280×800 | Fixture HTML simulée |
| `captures/APRES-grille-1440x900.png` | 1440×900 | Fixture HTML simulée |
| `_fixture-l7-grille.html` | — | Source fixture |

**Pas de données Preview réelles** (interdit L7 seul ; login feed 401).  
Non-régression medium : tests L5 verts ; CSS medium inchangé pour le fil vertical.

---

## 5. Prochaine action

Revue CTO du diff + captures → GO commit **local uniquement** (pas de push Preview avant lots 8+9).
