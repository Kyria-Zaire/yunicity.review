# Diagnostic + correctifs — L789 C1/C2/C3

**Ticket** : `VIDEO-REFONTE-L789-CORRECTION-C1C2C3-01`  
**Base** : `a30c9346` / tip livré `b7107736`  
**Env preuves** : Next `http://127.0.0.1:3022` + **API simulée** (Playwright)  
**Commit/push/deploy** : **aucun**

---

## 1. Diagnostic

| Écran | Symptôme CTO | Cause code | Réf. |
|-------|--------------|------------|------|
| **C1** | 2 vidéos empilées, largeur centrale vide | `.videos-desktop-grid` en `column-count` → remplissage **vertical** | `C1-Grille.dc.html` : portraits côte à côte (209 px), paysage = 2 unités |
| **C2** | Auteur / titre / quartier / description absents | `LocalVideoMobileMetaOverlay` seulement si `landscape` ; portrait = barre seule | `Lecteur-desktop.dc.html` : méta dans le voile bas du stage |
| **C3** | Bloc trop haut ; méta/actions coupés | Layout `flex-col` → **NavColumn sous** vidéo+méta | `C3-Lecteur-paysage.dc.html` : `[vidéo\|actions]` puis méta sous vidéo |

Bandes noires C3 : `object-contain` dans cadre 800×600 (4:3) avec média 16:9 — **cadrage média**, pas letterbox artificiel ajouté hors ratio.

---

## 2. Correctifs (diff local)

| Fichier | Changement |
|---------|------------|
| `globals.css` | CSS **grid** 2 cols (≥1024) / 4 cols (≥1280) ; portrait `span 1`, paysage `span 2` |
| `videos-desktop-grid-tile.tsx` | paysage `object-contain` ; retrait `break-inside-avoid` |
| `videos-desktop-overlay-player.tsx` | C2 méta sur stage ; C3 rangée vidéo\|nav + méta dessous ; `maxHeight` cadre |
| tests L7/L8 | assertions orientation / meta-band / caption |

Diff : `VIDEO-REFONTE-L789-CORRECTION-C1C2C3-01-precommit.diff`

---

## 3. Mesures (après) — pré-commit

Voir `preuves-precommit.json`. Grille : **3 cols @1024**, **4 @≥1280**.

### C1 — portrait+paysage (2 ordres) × 4 largeurs

Tous **OK** (`sameRow` + paysage ≈ 2× portrait). Captures `PRECOMMIT-C1-*`.

### C2 / C3 @ 1024

| | overflow | méta | nav/close | comments |
|--|----------|------|-----------|----------|
| C2 | 0 | meta-band + auteur | in view | panel OK |
| C3 | 0 | caption below | in view | sheet OK |

### Bandes C3

Voir `BANDES-C3.md` : média déclaré 1280×720 dans cadre 800×600 → letterbox **75 px** (contain), pas dans le fichier.

### R-FOCUS

`delta = 0` (≤1) — `preuves-precommit.json`.

---

## 4. Captures

| | Fichier |
|--|---------|
| AVANT C1 (L9 sim) | `captures-app/AVANT-C1-grille-simulee-1440.png` |
| AVANT C2 (sans méta) | `captures-app/AVANT-C2-portrait-sans-meta-1440.png` |
| APRÈS C1/C2/C3 | `captures-app/APRES-*.png` |
| JSON | `preuves-app.json` |

Réf. maquettes : `docs/ux/video-refonte/maquette-desktop/captures-pistes/C1|C2|C3-*.jpg`

---

## 5. Non régressions ciblées

- Historique / R-FOCUS / partage / commentaires : non retirés (structure overlay conservée).
- Mobile / medium : fichiers non touchés hors desktop overlay + grille CSS.
- Vitest L7+L8 ciblés : **13/13** OK.

## 6. Données

| Nature | Usage |
|--------|--------|
| **API/auth simulées** | Sonde Playwright (feed mock) |
| Preview réelle | Non rejouée ici (correction locale avant revue) |

L7 / L8 / L9 restent **NON CLOS**.
