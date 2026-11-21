# L5 — Conformité portrait / paysage (correctif local)

**Ticket** : `VIDEO-REFONTE-L5-MEDIUM-01` (seul actif)  
**Statut** : correctif **local NON commité** — revue CTO avant GO  
**Base tip Preview** : `0090dc58` (code applicatif `6fdf5fe4`)  
**Preuves** : localhost + **API simulée** ; références CTO archivées (`REF-0*.png`)

## 1. Cause mesurée

| Couche | Constat |
|--------|---------|
| Détection média | **OK** — `resolveLocalVideoLayout` / `height/width > 1.05` ; Capture 4 avait déjà overlay + colonne side → composition *portrait* choisie |
| Viewport medium | **OK** — stage `100dvh−14.5rem` (indépendant de l’orientation média) |
| Dimensionnement cadre | **KO** — `LocalVideoMediumPortraitStage` remplissait en `flex-1` toute la largeur utile × hauteur du stage → cadre **carré / paysage** sur stage large (ex. ~1023×536) |
| Rendu vidéo | **Conséquence** — `object-cover` dans un mauvais cadre **découpait** haut/bas du portrait (Capture 4) |

**Orientation média ≠ orientation viewport.** Le défaut n’était pas la détection ni le stage global, mais le **cadre vidéo** qui n’appliquait pas le ratio média.

Réf. `Lecteur-medium.dc.html` : portrait défaut `vw×vh = 528×938` (≈ 9:16) ; `ax = vx + vw + 12`.  
Réf. `M4-Paysage-820` / `M8` : cadre horizontal + `object-fit: contain` + méta **sous** le lecteur.

## 2. Correctif (diff ciblé)

1. `fitMediaFrameInBox` — tient largeur **et** hauteur disponibles en conservant le ratio média (pas de ratio unique).  
2. Portrait medium — cadre mesuré + colonne 56 px / gap 12 (`Lecteur-medium`).  
3. Paysage medium — `LocalVideoMediumLandscapeStage` : cadre horizontal, méta `surface=panel` sous le lecteur, actions latérales, `object-fit: contain`.  
4. Métadonnées — medium attend dims API ou `loadedmetadata` (`resolveLocalVideoLayoutFromDims` → `null` = pas de faux paysage).  
5. Badge partagé — **dans** le cadre (1×), plus au-dessus du stage.

Fichiers : `local-video-layout.ts`, `local-video-slide-frames.tsx`, `local-video-slide.tsx`, `local-video-feed-viewport.tsx`, `videos-medium-vertical-feed.tsx`, `local-video-mobile-meta-overlay.tsx`, tests.

**Préservés** : Safari immersif, H1–H3 / partage L2, hint accueil, desktop ≥1024, Lot 6 hors périmètre.

## 3. Preuves

### Tests

- Web medium + stage + aiguillage : **23/23**  
- Utils `local-video-layout` (fit + fromDims) : **19/19**

### Mesures navigateur (API simulée) — `mesures-portrait-paysage.json`

| Viewport | Portrait cadre | ratio | object-fit | Paysage cadre | object-fit | méta sous |
|----------|----------------|-------|------------|---------------|------------|-----------|
| 640×900 | 369×656 | 0.563 | cover | 440×248 | contain | oui |
| 820×1180 | 398×708 | 0.562 | cover | 612×344 | contain | oui |
| 1023×768 | 295×524 | 0.563 | cover | 704×396 | contain | oui |
| 844×390 | 128×228 | 0.561 | cover | 178×100 | contain | oui |

`?video=vid-portrait` @ 820 : composition portrait, badge **1×**, pas de doublon.  
Frontières : 639 immersif · 640/1023 medium · 1024 desktop — **OK**.  
VERIFY_OK (souris/flèches navigation portrait→paysage).

### Captures

- Réf. CTO : `REF-01`…`REF-04`  
- Après : `APRES-*-portrait.png`, `APRES-*-paysage.png`, `APRES-820-shared-portrait.png`

## 4. Limites

- Médias de sonde : fichier flower (paysage) + dims API forcées pour le **cadre** ; le contenu image n’est pas les photos CTO.  
- Session Preview réelle / Safari appareil : non rejoués.  
- **Aucun commit / push / deploy** — production / `main` hors périmètre.

## Prochaine action

Revue CTO du diff + captures → GO commit / FF Preview si validé.
