# VIDEO-REFONTE-L5-MEDIUM-01 — Rapport implémentation locale

**Base** : `815c6bdf`  
**Statut** : ajustement actions portrait **livré en local** — **NON commité** — en attente GO  
**Acquis préservés** : Safari SCROLL / P0, partage H1–H3 `/videos`, hint accueil  
**Hors lot** : R-PAN / F4 / C7 (Lot 6) · desktop grille (Lot 7+)

---

## Référence actions portrait (medium v1.2)

| Source | Placement |
|--------|-----------|
| `docs/ux/video-refonte/maquette-medium/Lecteur-medium.dc.html` | `ax = vx + vw + 12` — colonne **hors cadre vidéo** |
| Même fichier | flèches ▲/▼ **en tête** de la colonne ; J’aime / Commentaires / Partager / … **en bas** (`margin-top: auto`) |
| Pastilles | fond `#F3F4F6`, encre sombre — **pas** overlay voilé mobile |
| R-PAN (Lot 6) | panneau commentaires latéral / feuille — **distinct**, non touché |

**Contradictions** : aucune entre maquette et cadrage. L’écart L5 initial (overlay portrait via lecteur immersif) est **corrigé** par `LocalVideoMediumPortraitStage` + `surface="side"`.

---

## Diff ciblé (ajustement inclus)

| Fichier | Rôle |
|---------|------|
| `medium/videos-medium-vertical-feed.tsx` | fil vertical ; `presentation="medium"` ; nav via `mediumNav` (plus dans la toolbar) |
| `local-video-feed-viewport.tsx` | props `presentation` / `mediumNav` (défaut immersive → Safari inchangé) |
| `local-video-slide.tsx` | branche portrait medium → `LocalVideoMediumPortraitStage` |
| `local-video-slide-frames.tsx` | **nouveau** stage portrait medium (vidéo + colonne side) |
| `local-video-action-rail.tsx` | surface `side` (pastilles claires) |
| `videos-editorial-stream-region.tsx` | aiguillage medium → fil L5 |
| `videos-discovery-screen.tsx` / `videos-responsive-shell.tsx` / `videos-screen.tsx` | `deepLinkVideoId` |
| `app/globals.css` | palier 640–1023 ; fond stage blanc ; compact hauteur ≤520 |
| `local-video-labels.ts` | `LOCAL_VIDEO_SHARED_BADGE` |
| `video-medium-l5.test.tsx` / `video-medium-portrait-stage.test.tsx` / `video-mobile-v23.test.tsx` | tests |

Scripts probe / fixtures : preuves locales, **non destinés au commit applicatif**.

---

## Contrôles

| Suite | Résultat |
|-------|----------|
| `video-medium-l5.test.tsx` | **3/3** |
| `video-medium-portrait-stage.test.tsx` | **1/1** (colonne hors wrap vidéo) |
| `video-mobile-v23.test.tsx` | **OK** (aiguillage medium / desktop) |
| Safari immersive hooks / viewport | **non modifiés** (props optionnelles seulement) |

---

## Captures — distinguer fixture vs live

### Fixture géométrie (schématique)

`CAPTURE-{640x900,820x1180,1023x768,844x390}-{avant,apres}.png`  
- **avant** = overlay sur vidéo (écart)  
- **après** = colonne side ≠ R-PAN  
Réf. : `Lecteur-medium.dc.html`

### Live Next + API mock (`localhost:3002`, Playwright route)

| Fichier | Preuve |
|---------|--------|
| `LIVE-639-mobile.png` | ≤639 : immersif, **0** medium feed |
| `LIVE-640-medium.png` | 640 : feed medium + colonne side |
| `LIVE-820-medium.png` | 820 : idem |
| `LIVE-1023-medium.png` | 1023 : idem |
| `LIVE-1024-desktop.png` | ≥1024 : **0** medium vertical |
| `LIVE-820-video-query.png` | `?video=vid-b` en tête, badge **1** occurrence |
| `LIVE-820-share-comments.png` | Partager utilisable (H3 Chromium) ; commentaires ouverts |

JSON : `frontieres-live.json`, `captures-avant-apres.json`, `frontieres-preuves.json`.

---

## Frontières (synthèse)

| Seuil | Résultat |
|-------|----------|
| 639 → 640 | mobile immersif → medium feed + side |
| 1023 → 1024 | medium feed → desktop (catalogue) |
| `?video=` | reorder sans doublon + badge une fois (live + unit) |
| Partage / commentaires | visibles et cliquables en medium live mock |

---

## Prochaine action

Revue CTO du diff + preuves → **GO commit / Preview** si accord. **Aucun push** sans demande.
