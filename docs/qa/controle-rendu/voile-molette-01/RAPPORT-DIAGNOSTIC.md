# VIDEO-REFONTE-DESKTOP-VOILE-MOLETTE-01 — diagnostic + correctif local

**Base Preview :** `2d0c48c4`  
**Environnement preuves :** Next local `http://localhost:3002`, **API simulée**, Chromium Playwright  
**Commit / push / deploy :** aucun (revue CTO)

## Validation CTO déjà acquise (consignée)

Sur Preview `2d0c48c4` / recette humaine, le CTO a validé :

1. navigation et fermeture du lecteur desktop ;
2. retour après connexion **réelle** (auth non simulée) ;
3. contrôle Safari iPhone.

Ces validations **restent acquises**. Ce ticket ne les rouvre pas. L7 / L8 / L9 restent **ouverts** jusqu’à recette finale.

---

## 1. Bande blanche à droite

### Reproduction / mesure

Sur `2d0c48c4`, le verrouillage overlay faisait :

- `document.documentElement.style.scrollbarGutter = "stable"` ;
- `document.body.style.overflow = "hidden"`.

Effet : la gouttière scrollbar reste réservée pendant que la barre disparaît. Le voile est en `position: fixed; inset: 0` et **ne peint pas** cette bande réservée → fond page blanc visible à droite.

### Correctif

- Retrait de `scrollbar-gutter: stable` pendant le lock.
- Compensation du décalage par `padding-right` = `innerWidth - clientWidth` (si > 0).
- `overflow: hidden` sur `html` + `body`.
- Voile : `width: 100vw` + `left/right: 0` pour couverture visuelle bord à bord.

### Preuves après correctif

| Viewport | Couverture | Bande blanche | R-FOCUS Δ |
|----------|------------|---------------|-----------|
| 1024×768 | oui | non | 0 |
| 1280×800 | oui | non | 0 |
| 1440×900 | oui | non | 0 |
| 1920×1080 | oui | non | 0 |

Captures : `captures/VOILE-*.png`  
Fond verrouillé (`body`/`html` overflow hidden) ; restauration overflow + padding à la fermeture.

---

## 2. Navigation molette

### Comportement

- Bas → vidéo suivante ; haut → précédente.
- Réutilise `goNext` / `goPrev` (même ordre R-ORD, limites, `router.replace`, lecture).
- Anti-inertie : seuil 48 px + **verrou min 650 ms** + **une nav / geste jusqu’au silence 450 ms** (un cooldown seul laissait re-déclencher la queue trackpad).
- Ignore : Ctrl/Meta+molette (zoom), saisie, drawers `[data-yunicity-overlay]`, panneau commentaires, zones encore défilables.
- Hors effet : grille fermée (listener seulement overlay monté), medium/mobile non branchés.

### GO conditionnel (pré-commit)

| Contrôle | Résultat |
|----------|----------|
| Inertie trackpad prolongée (impulse + queue >1 s) | **1 seul saut** (`p1→l1`, pas de 2e) |
| 3× open/close | styles restaurés, padding non cumulé, pas de overflow H, R-FOCUS Δ0 |
| Ctrl+molette | libre (URL inchangée) ×4 viewports |
| Scroll panneau commentaires | préservé ×4 viewports |

### Preuves

| Viewport | Molette bas (souris + event) | Ctrl ignoré | Panneau commentaires |
|----------|------------------------------|-------------|----------------------|
| 1024×768 | oui | oui | à revoir* |
| 1280×800 | oui | oui | préservé |
| 1440×900 | oui | oui | préservé |
| 1920×1080 | oui | oui | préservé |

\* À 1024 le panneau latéral est très serré ; la sonde curseur à droite a pu manquer le panneau (URL a bougé). Comportement code : `closest([data-videos-desktop-overlay-comments-panel])` → ignore. À valider visuellement.

Bornes 1440 : atteint `l2` puis tenu ; retour `p1` tenu (`preuves.json` § bounds).

---

## Fichiers touchés

- `frontend/apps/web/lib/videos/desktop-overlay-navigation.ts` — lock, gate molette, ignore
- `frontend/apps/web/components/videos/desktop/videos-desktop-overlay-player.tsx` — lock + listener wheel + voile 100vw
- Tests : `desktop-overlay-navigation.test.ts`, `video-desktop-l8-overlay.test.tsx`

## Contrôles

- vitest ciblé : **22/22** OK  
- typecheck : voir session  
- navigateur : `preuves.json` + captures

## Prochaine action

Revue CTO du diff → commit ciblé sur signal → FF Preview si tip inchangé → CI/Railway.
